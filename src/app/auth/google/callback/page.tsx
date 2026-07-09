"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { supabase } from "@/utilities/storage";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function GoogleAuthCallbackPage() {
    const [message, setMessage] = useState("Completing Google sign-in...");
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const hasHandledCallback = useRef(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const mapMobileLoginRestrictionMessage = (message?: string) =>
        message === "Mobile login is allowed only between 10:00 AM and 1:00 PM IST."
            ? t("settings.mobileLoginRestricted")
            : message ?? "";

    useEffect(() => {
        if (hasHandledCallback.current) return;
        hasHandledCallback.current = true;

        const finalizeGoogleLogin = async () => {
            const code = searchParams.get("code");
            if (!code) {
                setMessage("Missing Google authorization code.");
                setSnackbar({ message: "Missing Google authorization code.", severity: "error", open: true });
                return;
            }

            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                setMessage("Google sign-in failed.");
                setSnackbar({ message: error.message, severity: "error", open: true });
                return;
            }

            const { data } = await supabase.auth.getSession();
            const accessToken = data.session?.access_token;

            if (!accessToken) {
                setMessage("Google session could not be established.");
                setSnackbar({ message: "Google session could not be established.", severity: "error", open: true });
                return;
            }

            const response = await fetch("/api/auth/google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ accessToken }),
            });

            const payload = await response.json();
            if (!payload?.success) {
                const nextMessage = mapMobileLoginRestrictionMessage(payload?.message ?? "Google login failed.");
                setMessage(nextMessage);
                setSnackbar({ message: nextMessage, severity: "error", open: true });
                return;
            }

            router.replace(payload.redirectTo ?? "/home");
        };

        void finalizeGoogleLogin();
    }, [router, searchParams]);

    return (
        <>
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 2,
                    backgroundColor: "#000",
                    color: "#e7e9ea",
                }}
            >
                <CircularProgress color="inherit" />
                <Typography>{message}</Typography>
            </Box>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </>
    );
}
