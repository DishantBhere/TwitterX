import { useEffect, useRef, useState } from "react";
import { TextField, Avatar } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaMicrophone, FaRegImage, FaRegSmile, FaStop } from "react-icons/fa";
import { MdOutlineAudiotrack } from "react-icons/md";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTranslation } from "react-i18next";

import CircularLoading from "../misc/CircularLoading";
import { createTweet, requestAudioOtp, verifyAudioOtp } from "@/utilities/fetch";
import { NewTweetProps } from "@/types/TweetProps";
import Uploader from "../misc/Uploader";
import { getFullURL } from "@/utilities/misc/getFullURL";
import { uploadFile } from "@/utilities/storage";
import ProgressCircle from "../misc/ProgressCircle";

const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 300;
const AUDIO_TIME_RESTRICTION_MESSAGE = "Audio tweets can only be posted between 2:00 PM and 7:00 PM IST.";

export default function NewTweet({ token, handleSubmit }: NewTweetProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [showDropzone, setShowDropzone] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
    const [audioOtp, setAudioOtp] = useState("");
    const [audioOtpError, setAudioOtpError] = useState("");
    const [audioOtpVerified, setAudioOtpVerified] = useState(false);
    const [isAudioOtpLoading, setIsAudioOtpLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingError, setRecordingError] = useState("");
    const [pendingAudioOtp, setPendingAudioOtp] = useState<{
        destination: string;
        simulatedOtp: string;
    } | null>(null);
    const [count, setCount] = useState(0);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const { t } = useTranslation();

    const queryClient = useQueryClient();

    const displayBrowserNotification = (text: string) => {
        if (!token.browserNotificationsEnabled) return;
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        if (!/cricket|science/i.test(text)) return;

        new Notification("Keyword Tweet", {
            body: text,
        });
    };

    const mutation = useMutation<string, unknown, string>({
        mutationFn: createTweet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tweets"] });
        },
        onError: (error) => console.log(error),
    });

    const handlePhotoChange = (file: File) => {
        setPhotoFile(file);
    };

    const clearAudioSelection = () => {
        setAudioFile(null);
        setAudioOtp("");
        setAudioOtpError("");
        setAudioOtpVerified(false);
        setPendingAudioOtp(null);
        if (audioInputRef.current) audioInputRef.current.value = "";
    };

    const getAudioDuration = (file: File) => {
        return new Promise<number>((resolve, reject) => {
            const audio = document.createElement("audio");
            const objectUrl = URL.createObjectURL(file);

            audio.preload = "metadata";
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(audio.duration);
            };
            audio.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Unable to read audio metadata."));
            };
            audio.src = objectUrl;
        });
    };

    const validateAudioFile = async (file: File) => {
        if (file.size > MAX_AUDIO_SIZE_BYTES) {
            return "Audio files must be 100 MB or smaller.";
        }

        try {
            const duration = await getAudioDuration(file);
            if (!Number.isFinite(duration)) return "Unable to read audio duration.";
            if (duration > MAX_AUDIO_DURATION_SECONDS) return "Audio must be 5 minutes or shorter.";
        } catch {
            return "Unable to read audio metadata.";
        }

        return "";
    };

    const isWithinAudioUploadWindow = () => {
        const timeParts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(new Date());
        const hour = Number(timeParts.find((part) => part.type === "hour")?.value);
        const minute = Number(timeParts.find((part) => part.type === "minute")?.value);
        const minutesSinceMidnight = hour * 60 + minute;

        return minutesSinceMidnight >= 14 * 60 && minutesSinceMidnight < 19 * 60;
    };

    const requestOtpForAudioFile = async (file: File) => {
        const validationMessage = await validateAudioFile(file);
        if (validationMessage) {
            clearAudioSelection();
            setAudioOtpError(validationMessage);
            return;
        }

        setAudioFile(file);
        setAudioOtp("");
        setAudioOtpError("");
        setAudioOtpVerified(false);
        setPendingAudioOtp(null);
        setIsAudioOtpLoading(true);

        const response = await requestAudioOtp();
        setIsAudioOtpLoading(false);

        if (!response.success) {
            clearAudioSelection();
            return setAudioOtpError(response.message ?? "Audio verification failed.");
        }

        setPendingAudioOtp({
            destination: response.destination,
            simulatedOtp: response.simulatedOtp,
        });
    };

    const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await requestOtpForAudioFile(file);
    };

    const stopRecordingStream = () => {
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
    };

    const handleStartRecording = async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            return setRecordingError("Audio recording is not supported in this browser.");
        }

        setRecordingError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordingStreamRef.current = stream;
            recordedChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const mimeType = mediaRecorder.mimeType || "audio/webm";
                const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
                const extension = mimeType.includes("mp4") ? "m4a" : "webm";
                const audioFile = new File([audioBlob], `recorded-audio-${Date.now()}.${extension}`, { type: mimeType });

                stopRecordingStream();
                mediaRecorderRef.current = null;
                setIsRecording(false);
                await requestOtpForAudioFile(audioFile);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            stopRecordingStream();
            setIsRecording(false);
            setRecordingError("Microphone permission is required to record audio.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const handleVerifyAudioOtp = async () => {
        setIsAudioOtpLoading(true);
        const response = await verifyAudioOtp(audioOtp);
        setIsAudioOtpLoading(false);

        if (!response.success) {
            setAudioOtpVerified(false);
            return setAudioOtpError(response.message ?? "Audio verification failed.");
        }

        setAudioOtpError("");
        setAudioOtpVerified(true);
        setPendingAudioOtp(null);
        setAudioOtp("");
    };

    useEffect(() => {
        if (!audioFile) {
            setAudioPreviewUrl("");
            return;
        }

        const previewUrl = URL.createObjectURL(audioFile);
        setAudioPreviewUrl(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [audioFile]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.onstop = null;
                mediaRecorderRef.current.stop();
            }
            stopRecordingStream();
        };
    }, []);

    const validationSchema = yup.object({
        text: yup
            .string()
            .max(280, t("home.tweetMax"))
            .test("has-tweet-content", t("home.tweetRequired"), (value) => Boolean(value?.trim() || photoFile || audioFile)),
    });

    const formik = useFormik({
        initialValues: {
            text: "",
            authorId: token.id,
            photoUrl: "",
            audioUrl: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const currentText = values.text;
            if (audioFile && !audioOtpVerified) {
                setAudioOtpError("Verify the audio upload OTP before tweeting.");
                return;
            }
            if (audioFile && !isWithinAudioUploadWindow()) {
                setAudioOtpError(AUDIO_TIME_RESTRICTION_MESSAGE);
                return;
            }
            if (photoFile) {
                const path: string | void = await uploadFile(photoFile);
                if (!path) throw new Error("Error uploading image.");
                values.photoUrl = path;
                setPhotoFile(null);
            }
            if (audioFile) {
                const path: string | void = await uploadFile(audioFile);
                if (!path) throw new Error("Error uploading audio.");
                values.audioUrl = path;
                clearAudioSelection();
            }
            mutation.mutate(JSON.stringify(values), {
                onSuccess: () => {
                    displayBrowserNotification(currentText);
                },
            });
            resetForm();
            setCount(0);
            setShowDropzone(false);
            clearAudioSelection();
            if (handleSubmit) handleSubmit();
        },
    });

    const customHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCount(e.target.value.length);
        formik.handleChange(e);
    };

    const hasTweetContent = Boolean(formik.values.text.trim() || photoFile || audioFile);
    const isTweetSubmittable = hasTweetContent && !Boolean(formik.errors.text);

    if (formik.isSubmitting) {
        return <CircularLoading />;
    }

    return (
        <div className="new-tweet-form">
            <Avatar
                className="avatar div-link"
                sx={{ width: 50, height: 50 }}
                alt=""
                src={token.photoUrl ? getFullURL(token.photoUrl) : "/assets/egg.jpg"}
            />
            <form onSubmit={formik.handleSubmit}>
                <div className="input">
                    <TextField
                        placeholder={t("home.whatsHappening")}
                        multiline
                        hiddenLabel
                        minRows={3}
                        variant="standard"
                        fullWidth
                        name="text"
                        value={formik.values.text}
                        onChange={customHandleChange}
                        error={formik.touched.text && Boolean(formik.errors.text)}
                        helperText={formik.touched.text && formik.errors.text}
                    />
                </div>
                <div className="input-additions">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowDropzone(true);
                        }}
                        className="icon-hoverable"
                    >
                        <FaRegImage />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            audioInputRef.current?.click();
                        }}
                        className="icon-hoverable"
                    >
                        <MdOutlineAudiotrack />
                    </button>
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} hidden />
                    {isRecording ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleStopRecording();
                            }}
                            className="icon-hoverable"
                        >
                            <FaStop />
                            Stop Recording
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleStartRecording();
                            }}
                            className="icon-hoverable"
                        >
                            <FaMicrophone />
                            Record Audio
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPicker(!showPicker);
                        }}
                        className="icon-hoverable"
                    >
                        <FaRegSmile />
                    </button>
                    <ProgressCircle maxChars={280} count={count} />
                    <button className={`btn ${isTweetSubmittable ? "" : "disabled"}`} disabled={!isTweetSubmittable} type="submit">
                        {t("actions.tweet")}
                    </button>
                </div>
                {showPicker && (
                    <div className="emoji-picker">
                        <Picker
                            data={data}
                            onEmojiSelect={(emoji: any) => {
                                formik.setFieldValue("text", formik.values.text + emoji.native);
                                setShowPicker(false);
                                setCount(count + emoji.native.length);
                            }}
                            previewPosition="none"
                        />
                    </div>
                )}
                {showDropzone && <Uploader handlePhotoChange={handlePhotoChange} />}
                {recordingError && <p className="audio-recording-error">{recordingError}</p>}
                {audioFile && (
                    <div className="audio-preview">
                        <p>{audioFile.name}</p>
                        {audioPreviewUrl && <audio controls src={audioPreviewUrl} />}
                    </div>
                )}
                {isAudioOtpLoading && <CircularLoading />}
                {pendingAudioOtp && (
                    <div className="audio-otp">
                        <p>OTP sent to {pendingAudioOtp.destination}</p>
                        <p className="simulated-otp">Testing OTP: {pendingAudioOtp.simulatedOtp}</p>
                        <TextField
                            fullWidth
                            name="audioOtp"
                            label="Enter OTP"
                            value={audioOtp}
                            onChange={(event) => setAudioOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            error={Boolean(audioOtpError)}
                            helperText={audioOtpError}
                        />
                        <button
                            type="button"
                            className={`btn btn-dark ${audioOtp.length === 6 ? "" : "disabled"}`}
                            disabled={audioOtp.length !== 6}
                            onClick={handleVerifyAudioOtp}
                        >
                            Verify
                        </button>
                        <button type="button" className="btn" onClick={clearAudioSelection}>
                            Cancel
                        </button>
                    </div>
                )}
                {audioOtpError && !pendingAudioOtp && <p className="audio-otp-error">{audioOtpError}</p>}
            </form>
        </div>
    );
}
