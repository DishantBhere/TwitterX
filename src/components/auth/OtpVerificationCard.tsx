"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

type OtpVerificationCardProps = {
    title: string;
    subtitle: string;
    destinationLabel?: string;
    destinationValue?: string;
    destinationType?: "email" | "phone";
    onEditDestination?: () => void;
    icon?: ReactNode;
    otp: string;
    setOtp: (value: string) => void;
    onVerify: () => void | Promise<void>;
    onCancel?: () => void;
    onResend?: () => void | Promise<void>;
    resendLabel?: string;
    expiresAt?: number;
    expiresInLabel?: string;
    expiredLabel?: string;
    loading?: boolean;
    error?: string;
    successMessage?: string;
    contextCard?: ReactNode;
    demoOtp?: string;
    verifyLabel?: string;
    cancelLabel?: string;
    resendPrefix?: string;
    compact?: boolean;
};

const BOX_LENGTH = 6;
const OTP_DURATION_SECONDS = 5 * 60;

const formatCountdown = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60)
        .toString()
        .padStart(2, "0");
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
};

export default function OtpVerificationCard({
    title,
    subtitle,
    destinationLabel,
    destinationValue,
    destinationType,
    onEditDestination,
    icon,
    otp,
    setOtp,
    onVerify,
    onCancel,
    onResend,
    resendLabel = "Resend code",
    expiresAt,
    expiresInLabel = "OTP expires in",
    expiredLabel = "OTP expired.",
    loading = false,
    error = "",
    successMessage = "",
    contextCard,
    demoOtp,
    verifyLabel = "Verify Code",
    cancelLabel = "Cancel",
    resendPrefix = "Didn't receive the code?",
    compact = false,
}: OtpVerificationCardProps) {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [showDemoOtp, setShowDemoOtp] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(OTP_DURATION_SECONDS);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const digits = useMemo(() => otp.slice(0, BOX_LENGTH).split(""), [otp]);
    const isExpired = remainingSeconds === 0;

    useEffect(() => {
        const nextIndex = Math.min(digits.length, BOX_LENGTH - 1);
        setFocusedIndex(nextIndex);
    }, [digits.length]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        if (destinationType !== "phone" || !demoOtp) return;

        const timer = window.setTimeout(() => {
            setShowDemoOtp(false);
        }, 15000);

        return () => window.clearTimeout(timer);
    }, [destinationType, demoOtp]);

    useEffect(() => {
        if (!expiresAt) {
            setRemainingSeconds(OTP_DURATION_SECONDS);
            return;
        }

        const tick = () => {
            setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
        };

        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt]);

    useEffect(() => {
        if (otp) return;
        setFocusedIndex(0);
        inputRefs.current[0]?.focus();
    }, [otp]);

    const updateOtp = (nextValue: string) => {
        setOtp(nextValue.replace(/\D/g, "").slice(0, BOX_LENGTH));
    };

    const focusIndex = (index: number) => {
        const nextIndex = Math.max(0, Math.min(BOX_LENGTH - 1, index));
        inputRefs.current[nextIndex]?.focus();
        inputRefs.current[nextIndex]?.select();
        setFocusedIndex(nextIndex);
    };

    const handleChange = (index: number, value: string) => {
        const cleaned = value.replace(/\D/g, "");
        if (!cleaned) {
            const nextDigits = [...digits];
            nextDigits[index] = "";
            updateOtp(nextDigits.join(""));
            return;
        }

        const nextDigits = [...digits];
        cleaned.split("").forEach((digit, offset) => {
            if (index + offset < BOX_LENGTH) {
                nextDigits[index + offset] = digit;
            }
        });
        updateOtp(nextDigits.join(""));

        const nextFocus = Math.min(BOX_LENGTH - 1, index + cleaned.length);
        requestAnimationFrame(() => focusIndex(nextFocus));
    };

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            if (digits[index]) {
                const nextDigits = [...digits];
                nextDigits[index] = "";
                updateOtp(nextDigits.join(""));
                return;
            }

            if (index > 0) {
                event.preventDefault();
                const nextDigits = [...digits];
                nextDigits[index - 1] = "";
                updateOtp(nextDigits.join(""));
                requestAnimationFrame(() => focusIndex(index - 1));
            }
            return;
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            focusIndex(index - 1);
        }

        if (event.key === "ArrowRight" && index < BOX_LENGTH - 1) {
            event.preventDefault();
            focusIndex(index + 1);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, BOX_LENGTH);
        if (!pasted) return;

        event.preventDefault();
        updateOtp(pasted);
        requestAnimationFrame(() => focusIndex(Math.min(pasted.length, BOX_LENGTH - 1)));
    };

    console.log("OTP CARD demoOtp", demoOtp);
    console.log("OTP CARD showDemoOtp", showDemoOtp);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ width: "100%" }}
        >
            <Box
                sx={{
                    width: "min(100%, 520px)",
                    mx: "auto",
                    borderRadius: compact ? "18px" : "20px",
                    border: "1px solid #2F3336",
                    bgcolor: "#16181C",
                    color: "#E7E9EA",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.38)",
                    p: compact ? { xs: 2, sm: 2.5 } : { xs: 2.5, sm: 4 },
                }}
            >
                <Stack spacing={compact ? 2 : 3.25} alignItems="stretch">
                    <Stack spacing={compact ? 1.1 : 1.5}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                            {icon && (
                                <Box
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "14px",
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "rgba(29,155,240,0.10)",
                                        color: "#1D9BF0",
                                        flexShrink: 0,
                                    }}
                                >
                                    {icon}
                                </Box>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant={compact ? "h6" : "h5"}
                                    sx={{ fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.15, color: "#E7E9EA" }}
                                >
                                    {title}
                                </Typography>
                                <Typography sx={{ color: "#71767B", mt: 0.5, lineHeight: 1.45, fontSize: compact ? 13 : 15 }}>
                                    {subtitle}{" "}
                                    {destinationValue && (
                                        <Box component="span" sx={{ color: "#E7E9EA", fontWeight: 700 }}>
                                            {destinationValue}
                                        </Box>
                                    )}
                                    {destinationLabel && onEditDestination && (
                                        <Box
                                            component="button"
                                            type="button"
                                            onClick={onEditDestination}
                                            sx={{
                                                ml: 1,
                                                p: 0,
                                                border: 0,
                                                background: "transparent",
                                                color: "#1D9BF0",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Edit
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                        </Stack>
                        {contextCard}
                    </Stack>

                    {destinationType === "phone" && process.env.NODE_ENV !== "production" && (
                        <Box
                            sx={{
                                p: compact ? 1.25 : 1.5,
                                borderRadius: "12px",
                                border: "1px solid rgba(29,155,240,0.25)",
                                bgcolor: "rgba(29,155,240,0.08)",
                                color: "#E7E9EA",
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                            }}
                        >
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#E7E9EA" }}>Demo Mode</Typography>
                            <Typography sx={{ fontSize: 13, color: "#E7E9EA" }}>
                                SMS verification is not connected yet. For testing purposes, the generated OTP will be displayed
                                temporarily.
                            </Typography>
                            {showDemoOtp && demoOtp && (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: "999px",
                                            bgcolor: "rgba(29,155,240,0.16)",
                                            color: "#1D9BF0",
                                            fontSize: 12,
                                            fontWeight: 800,
                                        }}
                                    >
                                        Demo OTP
                                    </Box>
                                    <Box
                                        component="code"
                                        sx={{
                                            fontFamily:
                                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                            fontSize: 14,
                                            fontWeight: 800,
                                            letterSpacing: 1,
                                            color: "#E7E9EA",
                                        }}
                                    >
                                        {demoOtp}
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    )}

                    <Box sx={{ pt: compact ? 0 : 0.5 }}>
                        <Typography sx={{ mb: compact ? 1 : 1.5, color: "#71767B", fontSize: compact ? 13 : 15 }}>
                            Enter the 6-digit code
                        </Typography>
                        <Stack direction="row" spacing={{ xs: 0.65, sm: compact ? 0.75 : 1 }} justifyContent="space-between" sx={{ width: "100%" }}>
                            {Array.from({ length: BOX_LENGTH }).map((_, index) => (
                                <motion.input
                                    key={index}
                                    ref={(node) => {
                                        inputRefs.current[index] = node;
                                    }}
                                    value={digits[index] ?? ""}
                                    onFocus={() => setFocusedIndex(index)}
                                    onChange={(event) => handleChange(index, event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                    onPaste={handlePaste}
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                    aria-label={`OTP digit ${index + 1}`}
                                    maxLength={1}
                                    animate={{
                                        scale: focusedIndex === index ? 1.02 : 1,
                                        borderColor:
                                            error && otp.length === BOX_LENGTH
                                                ? "#f4212e"
                                                : focusedIndex === index
                                                  ? "#1D9BF0"
                                                  : "#38444D",
                                        backgroundColor:
                                            error && otp.length === BOX_LENGTH
                                                ? "rgba(244, 33, 46, 0.08)"
                                                : digits[index]
                                                  ? "rgba(255,255,255,0.04)"
                                                  : "#0F1419",
                                    }}
                                    transition={{ duration: 0.16 }}
                                    style={{
                                        width: "100%",
                                        maxWidth: compact ? 52 : 56,
                                        height: compact ? 52 : 56,
                                        borderRadius: compact ? 10 : 12,
                                        border: "1px solid #38444D",
                                        outline: "none",
                                        textAlign: "center",
                                        fontSize: compact ? 18 : 20,
                                        fontWeight: 800,
                                        color: "#E7E9EA",
                                        background: "#0F1419",
                                        boxShadow: focusedIndex === index ? "0 0 0 3px rgba(29,155,240,0.16)" : "none",
                                    }}
                                />
                            ))}
                        </Stack>
                        <AnimatePresence mode="wait">
                            {error ? (
                                <motion.div key="error" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                    <Typography sx={{ mt: 1.25, color: "#f4212e", fontSize: 14, fontWeight: 600 }}>{error}</Typography>
                                </motion.div>
                            ) : successMessage ? (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                                    <Typography sx={{ mt: 1.25, color: "#00ba7c", fontSize: 14, fontWeight: 700 }}>{successMessage}</Typography>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </Box>

                    <Stack spacing={1.1}>
                        <Stack spacing={0.35}>
                            <Typography sx={{ color: "#71767B", fontSize: compact ? 13 : 14 }}>
                                {expiresInLabel}{" "}
                                <Box component="span" sx={{ color: "#E7E9EA", fontWeight: 700 }}>
                                    {formatCountdown(remainingSeconds)}
                                </Box>
                            </Typography>
                            {isExpired ? (
                                <Typography sx={{ color: "#f4212e", fontSize: 14, fontWeight: 700 }}>{expiredLabel}</Typography>
                            ) : (
                                <Typography sx={{ color: "#71767B", fontSize: compact ? 13 : 14 }}>
                                    {resendPrefix}{" "}
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={onResend}
                                        disabled={!onResend}
                                        sx={{
                                            p: 0,
                                            border: 0,
                                            background: "transparent",
                                            color: "#1D9BF0",
                                            fontWeight: 700,
                                            cursor: onResend ? "pointer" : "default",
                                            "&:disabled": { opacity: 0.7, cursor: "default" },
                                        }}
                                    >
                                        {resendLabel}
                                    </Box>
                                </Typography>
                            )}
                        </Stack>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={onVerify}
                            disabled={loading || otp.length !== BOX_LENGTH || isExpired}
                            sx={{
                                height: 48,
                                borderRadius: "9999px",
                                fontWeight: 800,
                                textTransform: "none",
                                boxShadow: "none",
                                bgcolor: "#1D9BF0",
                                "&:hover": { bgcolor: "#1A8CD8", boxShadow: "none" },
                            }}
                        >
                            {loading ? "Verifying..." : verifyLabel}
                        </Button>

                        {onCancel && (
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={onCancel}
                                sx={{
                                    height: 48,
                                    borderRadius: "9999px",
                                    fontWeight: 800,
                                    textTransform: "none",
                                    color: "#E7E9EA",
                                    borderColor: "#38444D",
                                    "&:hover": { borderColor: "#4b545c", backgroundColor: "rgba(255,255,255,0.02)" },
                                }}
                            >
                                {cancelLabel}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>
        </motion.div>
    );
}
