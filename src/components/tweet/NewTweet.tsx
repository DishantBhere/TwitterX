import { useEffect, useRef, useState } from "react";
import { Avatar, Dialog, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RiEmotionHappyLine, RiFileGifLine, RiImage2Line, RiMic2Line, RiMusic2Line, RiStopCircleLine } from "react-icons/ri";
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
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

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
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [gifFile, setGifFile] = useState<File | null>(null);
    const [gifPreviewUrl, setGifPreviewUrl] = useState("");
    const [gifResults, setGifResults] = useState<Array<{ title: string; previewUrl: string; gifUrl: string }>>([]);
    const [gifQuery, setGifQuery] = useState("");
    const [gifLoading, setGifLoading] = useState(false);
    const [gifError, setGifError] = useState("");
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
    const [audioOtp, setAudioOtp] = useState("");
    const [audioOtpError, setAudioOtpError] = useState("");
    const [audioOtpVerified, setAudioOtpVerified] = useState(false);
    const [isAudioOtpLoading, setIsAudioOtpLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingError, setRecordingError] = useState("");
    const [pendingAudioOtp, setPendingAudioOtp] = useState(false);
    const [audioOtpExpiresAt, setAudioOtpExpiresAt] = useState(0);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
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
        setGifFile(null);
        setGifPreviewUrl("");
        setGifError("");
    };

    const clearGifSelection = () => {
        setGifFile(null);
        setGifPreviewUrl("");
        setGifError("");
        setGifResults([]);
        setGifQuery("");
    };

    const clearAudioSelection = () => {
        setAudioFile(null);
        setAudioOtp("");
        setAudioOtpError("");
        setAudioOtpVerified(false);
        setPendingAudioOtp(false);
        setAudioOtpExpiresAt(0);
        if (audioInputRef.current) audioInputRef.current.value = "";
    };

    const fetchGifs = async (query = "") => {
        const apiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;
        if (!apiKey) {
            setGifError("GIF search is unavailable right now.");
            return;
        }

        setGifLoading(true);
        setGifError("");

        try {
            const endpoint = query
                ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&client_key=twitter_clone&limit=12&media_filter=gif`
                : `https://tenor.googleapis.com/v2/trending?key=${apiKey}&client_key=twitter_clone&limit=12&media_filter=gif`;

            const response = await fetch(endpoint);
            const data = await response.json();
            const items = (data.results || [])
                .map((item: any) => {
                    const media = item.media?.[0];
                    const gif = media?.gif || media?.tinygif || media?.nanogif;
                    return gif?.url
                        ? {
                              title: item.content_description || "GIF",
                              previewUrl: gif.url,
                              gifUrl: gif.url,
                          }
                        : null;
                })
                .filter(Boolean) as Array<{ title: string; previewUrl: string; gifUrl: string }>;

            setGifResults(items);
            if (!items.length) {
                setGifError("No GIFs found for this search.");
            }
        } catch {
            setGifError("Unable to load GIFs right now.");
        } finally {
            setGifLoading(false);
        }
    };

    const handleGifSelection = async (gifUrl: string) => {
        try {
            const response = await fetch(gifUrl);
            const blob = await response.blob();
            const file = new File([blob], `selected-gif-${Date.now()}.gif`, { type: blob.type || "image/gif" });

            setPhotoFile(null);
            setGifFile(file);
            setGifPreviewUrl(URL.createObjectURL(file));
            setShowGifPicker(false);
            setGifError("");
        } catch {
            setGifError("Unable to attach this GIF.");
        }
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
        setAudioOtpExpiresAt(new Date(response.expiresAt).getTime());
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
        if (!gifFile) {
            setGifPreviewUrl("");
            return;
        }

        const previewUrl = URL.createObjectURL(gifFile);
        setGifPreviewUrl(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [gifFile]);

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
            if (gifFile) {
                const path: string | void = await uploadFile(gifFile);
                if (!path) throw new Error("Error uploading GIF.");
                values.photoUrl = path;
                clearGifSelection();
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
            setShowGifPicker(false);
            clearAudioSelection();
            if (handleSubmit) handleSubmit();
        },
    });

    const customHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCount(e.target.value.length);
        formik.handleChange(e);
    };

    const hasTweetContent = Boolean(formik.values.text.trim() || photoFile || gifFile || audioFile);
    const isTweetSubmittable = hasTweetContent && !Boolean(formik.errors.text);

    if (formik.isSubmitting) {
        return <CircularLoading />;
    }

    return (
        <div className="new-tweet-form x-composer">
            <div className="x-composer-header">
                <Avatar
                    className="avatar div-link x-composer-avatar"
                    sx={{ width: 44, height: 44 }}
                    alt=""
                    src={token.photoUrl ? getFullURL(token.photoUrl) : "/assets/egg.jpg"}
                />
                <div className="x-composer-header-spacer" />
            </div>
            <form onSubmit={formik.handleSubmit} className="x-composer-form">
                <div className="input x-composer-input">
                    <TextField
                        placeholder="What's happening?"
                        multiline
                        hiddenLabel
                        minRows={1}
                        variant="standard"
                        fullWidth
                        name="text"
                        value={formik.values.text}
                        onChange={customHandleChange}
                        error={formik.touched.text && Boolean(formik.errors.text)}
                        helperText={formik.touched.text && formik.errors.text}
                    />
                </div>
                <div className="x-composer-toolbar">
                    <div className="x-composer-icons">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowDropzone(true);
                            }}
                            className="icon-hoverable"
                            aria-label="Add image"
                        >
                            <RiImage2Line />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowGifPicker(true);
                                if (!gifResults.length && !gifLoading) {
                                    void fetchGifs();
                                }
                            }}
                            className="icon-hoverable"
                            aria-label="Add GIF"
                        >
                            <RiFileGifLine />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                audioInputRef.current?.click();
                            }}
                            className="icon-hoverable"
                            aria-label="Add audio"
                        >
                            <RiMusic2Line />
                        </button>
                        <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} hidden />
                        {isRecording ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleStopRecording();
                                }}
                                className="icon-hoverable x-mic-btn"
                                aria-label="Stop recording"
                            >
                                <RiStopCircleLine />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleStartRecording();
                                }}
                                className="icon-hoverable x-mic-btn"
                                aria-label="Record audio"
                            >
                                <RiMic2Line />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowPicker(!showPicker);
                            }}
                            className="icon-hoverable"
                            aria-label="Add emoji"
                        >
                            <RiEmotionHappyLine />
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
                {gifFile && gifPreviewUrl && (
                    <div className="composer-gif-preview">
                        <img src={gifPreviewUrl} alt="Selected GIF" />
                        <button type="button" className="composer-gif-remove" onClick={clearGifSelection}>
                            Remove
                        </button>
                    </div>
                )}
                {recordingError && <p className="audio-recording-error">{recordingError}</p>}
                {audioFile && (
                    <div className="audio-preview x-audio-card">
                        <div className="x-audio-card-header">
                            <div className="x-audio-icon">🎵</div>
                            <div>
                                <p className="x-audio-title">{audioFile.name}</p>
                                <p className="x-audio-subtitle">{audioPreviewUrl ? "Selected audio ready" : "Audio attached"}</p>
                            </div>
                            <button type="button" className="x-audio-remove" onClick={clearAudioSelection}>
                                Remove
                            </button>
                        </div>
                        {audioPreviewUrl && <audio controls src={audioPreviewUrl} className="x-audio-player" />}
                    </div>
                )}
                {isAudioOtpLoading && <CircularLoading />}
                {pendingAudioOtp && (
                    <OtpVerificationCard
                        title="Verify your identity"
                        subtitle="We've sent a 6-digit verification code to"
                        destinationValue={token.email ?? "your registered email"}
                        expiresAt={audioOtpExpiresAt}
                        otp={audioOtp}
                        setOtp={setAudioOtp}
                        onVerify={handleVerifyAudioOtp}
                        onCancel={clearAudioSelection}
                        onResend={async () => {
                            setIsAudioOtpLoading(true);
                            const response = await requestAudioOtp();
                            setIsAudioOtpLoading(false);

                            if (!response.success) {
                                return setAudioOtpError(response.message ?? "Audio verification failed.");
                            }

                            setAudioOtp("");
                            setAudioOtpError("");
                            setAudioOtpVerified(false);
                            setPendingAudioOtp(true);
                            setAudioOtpExpiresAt(new Date(response.expiresAt).getTime());
                            setSnackbar({ message: "New verification code sent.", severity: "success", open: true });
                        }}
                        loading={isAudioOtpLoading}
                        error={audioOtpError}
                        verifyLabel="Verify Code"
                        compact
                    />
                )}
                {audioOtpError && !pendingAudioOtp && <p className="audio-otp-error">{audioOtpError}</p>}
            </form>
            {snackbar.open && <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />}
            <Dialog
                className="dialog"
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ className: "gif-picker-dialog" }}
            >
                <DialogTitle className="title">Choose a GIF</DialogTitle>
                <DialogContent className="gif-picker-content">
                    <form
                        className="gif-search-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void fetchGifs(gifQuery.trim());
                        }}
                    >
                        <input
                            value={gifQuery}
                            onChange={(event) => setGifQuery(event.target.value)}
                            placeholder="Search GIFs"
                            className="gif-search-input"
                        />
                        <button type="submit" className="gif-search-button">
                            Search
                        </button>
                    </form>
                    {gifLoading && <p className="gif-status">Loading GIFs…</p>}
                    {gifError && <p className="gif-status error">{gifError}</p>}
                    {!gifLoading && !gifError && (
                        <div className="gif-grid">
                            {gifResults.map((gif) => (
                                <button
                                    key={`${gif.title}-${gif.previewUrl}`}
                                    type="button"
                                    className="gif-card"
                                    onClick={() => void handleGifSelection(gif.gifUrl)}
                                >
                                    <img src={gif.previewUrl} alt={gif.title} />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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
                    padding: 12px 16px 14px;
                }
                .x-composer-header {
                    display: flex;
                    align-items: center;
                    margin-top: 2px;
                }
                .x-composer-avatar {
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .x-composer-form {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .x-composer-input {
                    min-height: 96px;
                    padding-top: 2px;
                    padding-bottom: 6px;
                    font-size: 17px;
                }
                .x-composer-input :global(.MuiInputBase-root) {
                    padding: 0;
                    border: none;
                    box-shadow: none;
                }
                .x-composer-input :global(.MuiInputBase-input),
                .x-composer-input :global(textarea) {
                    font-size: 22px;
                    line-height: 1.4;
                    padding: 0;
                    border: none;
                    outline: none;
                    min-height: 110px;
                    resize: none;
                }
                .x-composer-input :global(textarea::placeholder) {
                    color: rgb(113, 118, 123);
                    opacity: 1;
                    font-size: 22px;
                }
                .x-composer-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    min-height: 40px;
                    padding-top: 2px;
                    border-top: none;
                }
                .x-composer-icons {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    flex: 1;
                    gap: 2px;
                    min-height: 38px;
                }
                .x-composer-icons .icon-hoverable {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 20px;
                    color: rgb(29, 155, 240);
                    background: transparent;
                    border: none;
                    transition: background-color 0.15s ease, transform 0.12s ease, color 0.15s ease;
                    cursor: pointer;
                    padding: 0;
                }
                .x-composer-icons .icon-hoverable:hover {
                    background-color: rgba(29, 155, 240, 0.1);
                    transform: scale(1.02);
                }
                .x-composer-icons .icon-hoverable:active {
                    background-color: rgba(29, 155, 240, 0.18);
                    transform: scale(0.98);
                }
                .x-composer-post-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-left: auto;
                }
                .x-composer-post-btn {
                    width: auto;
                    min-width: 90px;
                    max-width: 110px;
                    height: 38px;
                    min-height: 38px;
                    padding: 0 18px;
                    border-radius: 9999px;
                    font-size: 15px;
                    font-weight: 700;
                    line-height: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 18px rgba(29, 155, 240, 0.16);
                    flex: 0 0 auto;
                }
                .x-composer-post-btn.disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .x-mic-btn {
                    color: rgb(29, 155, 240) !important;
                    font-size: 20px !important;
                }
                .x-mic-btn:hover {
                    background-color: rgba(29, 155, 240, 0.1) !important;
                }
                .x-mic-btn:active {
                    background-color: rgba(29, 155, 240, 0.18) !important;
                }
                .x-composer-post-btn:hover:not(.disabled) {
                    transform: translateY(-1px);
                    filter: brightness(1.01);
                }
                .composer-gif-preview {
                    margin-top: 10px;
                    border: 1px solid rgba(15, 20, 25, 0.12);
                    border-radius: 16px;
                    overflow: hidden;
                    background: var(--twitter-white);
                }
                .composer-gif-preview img {
                    display: block;
                    width: 100%;
                    max-height: 220px;
                    object-fit: cover;
                }
                .composer-gif-remove {
                    width: 100%;
                    border: none;
                    background: rgba(15, 20, 25, 0.04);
                    color: rgb(29, 155, 240);
                    padding: 8px 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .gif-picker-dialog {
                    border-radius: 16px;
                    overflow: hidden;
                }
                .gif-picker-content {
                    padding: 12px 16px 16px;
                    background: var(--twitter-white);
                }
                .gif-search-form {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .gif-search-input {
                    flex: 1;
                    border: 1px solid rgba(15, 20, 25, 0.16);
                    border-radius: 999px;
                    padding: 10px 12px;
                    background: transparent;
                    color: var(--twitter-black);
                    outline: none;
                }
                .gif-search-button {
                    border: none;
                    background: rgb(29, 155, 240);
                    color: white;
                    border-radius: 999px;
                    padding: 0 14px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .gif-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }
                .gif-card {
                    border: 1px solid rgba(15, 20, 25, 0.08);
                    border-radius: 12px;
                    overflow: hidden;
                    padding: 0;
                    background: transparent;
                    cursor: pointer;
                }
                .gif-card img {
                    display: block;
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                }
                .gif-status {
                    color: var(--twitter-muted);
                    font-size: 14px;
                    margin: 0 0 10px;
                }
                .gif-status.error {
                    color: #f4212e;
                }
                .x-audio-card {
                    margin-top: 10px;
                    padding: 14px;
                    border: 1px solid rgba(15, 20, 25, 0.12);
                    border-radius: 16px;
                    background: var(--twitter-white);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .x-audio-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .x-audio-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    display: grid;
                    place-items: center;
                    background: rgba(29, 155, 240, 0.1);
                    font-size: 20px;
                }
                .x-audio-title {
                    margin: 0;
                    font-weight: 700;
                    color: var(--twitter-black);
                }
                .x-audio-subtitle {
                    margin: 2px 0 0;
                    color: var(--twitter-muted);
                    font-size: 13px;
                }
                .x-audio-remove {
                    margin-left: auto;
                    border: none;
                    background: transparent;
                    color: rgb(29, 155, 240);
                    font-weight: 700;
                    cursor: pointer;
                }
                .x-audio-player {
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
