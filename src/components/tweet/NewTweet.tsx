import { useEffect, useRef, useState } from "react";
import { Avatar, Dialog, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaMicrophone, FaRegImage, FaRegSmile, FaStop } from "react-icons/fa";
import { MdOutlineAudiotrack } from "react-icons/md";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

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
const SUBSCRIPTION_LIMIT_MESSAGES = [
    "Free plan allows only 1 tweet.",
    "Bronze plan allows only 3 tweets per month.",
    "Silver plan allows only 5 tweets per month.",
];

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
    const [pendingAudioOtp, setPendingAudioOtp] = useState(false);
    const [isTweetLimitDialogOpen, setIsTweetLimitDialogOpen] = useState(false);
    const [count, setCount] = useState(0);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const { t } = useTranslation();
    const router = useRouter();

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
        onError: (error) => {
            const message = error instanceof Error ? error.message : "";
            if (SUBSCRIPTION_LIMIT_MESSAGES.includes(message)) {
                setIsTweetLimitDialogOpen(true);
                return;
            }

            console.log(error);
        },
    });

    const handlePhotoChange = (file: File) => {
        setPhotoFile(file);
    };

    const clearAudioSelection = () => {
        setAudioFile(null);
        setAudioOtp("");
        setAudioOtpError("");
        setAudioOtpVerified(false);
        setPendingAudioOtp(false);
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
        setPendingAudioOtp(false);
        setIsAudioOtpLoading(true);

        const response = await requestAudioOtp();
        setIsAudioOtpLoading(false);

        if (!response.success) {
            clearAudioSelection();
            return setAudioOtpError(response.message ?? "Audio verification failed.");
        }

        setPendingAudioOtp(true);
        if (response.message) {
            setAudioOtpError("");
        }
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
        setPendingAudioOtp(false);
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
        <div className="new-tweet-form x-composer">
            <Avatar
                className="avatar div-link x-composer-avatar"
                sx={{ width: 48, height: 48 }}
                alt=""
                src={token.photoUrl ? getFullURL(token.photoUrl) : "/assets/egg.jpg"}
            />
            <form onSubmit={formik.handleSubmit} className="x-composer-form">
                <div className="input x-composer-input">
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
                <div className="x-composer-divider" />
                <div className="input-additions x-composer-toolbar">
                    <div className="x-composer-icons">
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
                            className="icon-hoverable x-mic-btn"
                        >
                            <FaStop />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleStartRecording();
                            }}
                            className="icon-hoverable x-mic-btn"
                        >
                            <FaMicrophone />
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
                    </div>
                    <div className="x-composer-post-group">
                        <ProgressCircle maxChars={280} count={count} />
                        <button
                            className={`btn x-composer-post-btn ${isTweetSubmittable ? "" : "disabled"}`}
                            disabled={!isTweetSubmittable}
                            type="submit"
                        >
                            {t("actions.tweet")}
                        </button>
                    </div>
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
                        <p>An audio verification code has been sent to your registered email.</p>
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
            <Dialog className="dialog" open={isTweetLimitDialogOpen} onClose={() => setIsTweetLimitDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle className="title">Tweet Limit Reached</DialogTitle>
                <DialogContent>
                    <DialogContentText className="text-muted">
                        You have reached the maximum tweets allowed for your current subscription plan. Upgrade your subscription to continue
                        tweeting.
                    </DialogContentText>
                </DialogContent>
                <div className="button-group" style={{ padding: "0 24px 24px" }}>
                    <button
                        className="btn btn-dark"
                        onClick={() => {
                            setIsTweetLimitDialogOpen(false);
                            router.push("/settings");
                        }}
                        autoFocus
                    >
                        Upgrade Plan
                    </button>
                    <button className="btn btn-white" onClick={() => setIsTweetLimitDialogOpen(false)}>
                        Cancel
                    </button>
                </div>
            </Dialog>
            <style jsx>{`
                .x-composer {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    padding: 12px 16px;
                }
                .x-composer-avatar {
                    flex-shrink: 0;
                }
                .x-composer-form {
                    flex: 1;
                    min-width: 0;
                }
                .x-composer-input {
                    min-height: 40px;
                    padding-top: 4px;
                    padding-bottom: 8px;
                    font-size: 20px;
                }
                .x-composer-input :global(input),
                .x-composer-input :global(textarea) {
                    font-size: 20px;
                }
                .x-composer-input :global(textarea::placeholder) {
                    color: rgb(113, 118, 123);
                    opacity: 1;
                }
                .x-composer-divider {
                    border-bottom: 1px solid rgba(239, 243, 244, 0.08);
                    margin-bottom: 8px;
                }
                .x-composer-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .x-composer-icons {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex: 1;
                    max-width: 320px;
                }
                .x-composer-icons .icon-hoverable {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 70px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 21px;
                    color: rgb(162, 179, 189);
                    transition: background-color 0.15s ease, transform 0.1s ease;
                }
                .x-composer-icons .icon-hoverable:hover {
                    background-color: rgba(29, 155, 240, 0.1);
                    transform: scale(1.05);
                }
                .x-composer-icons .icon-hoverable:active {
                    background-color: rgba(29, 155, 240, 0.18);
                }
                .x-mic-btn {
                    color: rgb(178, 202, 219) !important;
                    font-size: 21px !important;
                }
                .x-mic-btn:hover {
                    background-color: rgba(29, 155, 240, 0.1) !important;
                }
                .x-mic-btn:active {
                    background-color: rgba(29, 155, 240, 0.18) !important;
                }
                .x-composer-post-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-left: auto;
                }
                .x-composer-post-btn {
                    border-radius: 9999px;
                    padding: 6px 16px;
                    font-size: 14px;
                    font-weight: 700;
                    background-color: #eff3f4;
                    color: #0f1419;
                    transition: opacity 0.15s ease;
                }
                .x-composer-post-btn.disabled {
                    opacity: 0.5;
                }
                .x-composer-post-btn:hover:not(.disabled) {
                    opacity: 0.85;
                }
            `}</style>
        </div>
    );
}