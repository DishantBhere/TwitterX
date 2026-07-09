"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Box, Button, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { FaApple, FaGoogle, FaPhone, FaXTwitter } from "react-icons/fa6";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import SignUpDialog from "@/components/dialog/SignUpDialog";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { logIn, verifyLoginOtp } from "@/utilities/fetch";
import { supabase } from "@/utilities/storage";
import CircularLoading from "@/components/misc/CircularLoading";
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";
import { getCurrentIstMinutes, getLoginContext } from "@/utilities/auth/shared";

export default function RootPage() {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [loginStep, setLoginStep] = useState<1 | 2>(1);
    const [pendingOtp, setPendingOtp] = useState<string | null>(null);
    const [pendingOtpExpiresAt, setPendingOtpExpiresAt] = useState<number>(0);
    const [otp, setOtp] = useState("");
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const { t } = useTranslation();
    const router = useRouter();

    const handleSignUpClick = () => {
        setIsSignUpOpen(true);
    };
    const handleSignUpClose = () => {
        setIsSignUpOpen(false);
    };

    const validationSchema = useMemo(
        () =>
            yup.object({
                identifier: yup.string().required("Email or username is required."),
                password:
                    loginStep === 2
                        ? yup
                              .string()
                              .min(8, "Password should be of minimum 8 characters length.")
                              .max(100, "Password should be of maximum 100 characters length.")
                              .required("Password is required.")
                        : yup.string().notRequired(),
            }),
        [loginStep]
    );

    const formik = useFormik({
        initialValues: {
            identifier: "",
            password: "",
        },
        validationSchema,
        onSubmit: async (values, { setFieldTouched, resetForm }) => {
            if (loginStep === 1) {
                setFieldTouched("identifier", true, false);
                if (!values.identifier.trim()) return;
                setLoginStep(2);
                return;
            }

            const response = await logIn(JSON.stringify({ identifier: values.identifier, password: values.password }));
            if (!response.success) {
                setSnackbar({ message: response.message, severity: "error", open: true });
                return;
            }

            if (response.requiresOtp) {
                setPendingOtp(response.username ?? values.identifier);
                setPendingOtpExpiresAt(new Date(response.expiresAt).getTime());
                setOtp("");
                setSnackbar({
                    message: response.message ?? "A verification code has been sent to your registered email.",
                    severity: "success",
                    open: true,
                });
                return;
            }

                            setPendingOtp(null);
                            setPendingOtpExpiresAt(0);
                            setOtp("");
                            setLoginStep(1);
                            resetForm();
            router.push("/explore");
        },
    });

    const handleVerifyOtp = async () => {
        if (!pendingOtp) return;

        const response = await verifyLoginOtp(pendingOtp, otp);
        if (!response.success) {
            setSnackbar({ message: response.message, severity: "error", open: true });
            return;
        }

        setPendingOtp(null);
        setPendingOtpExpiresAt(0);
        setOtp("");
        setLoginStep(1);
        formik.resetForm();
        router.push("/explore");
    };

    const handleBack = () => {
        setLoginStep(1);
        setPendingOtp(null);
        setPendingOtpExpiresAt(0);
        setOtp("");
        formik.setFieldValue("password", "");
    };

    const handleGoogleLogin = async () => {
        const { deviceType } = getLoginContext(window.navigator.userAgent || "", "", "", null);
        if (deviceType === "Mobile") {
            const currentIstMinutes = getCurrentIstMinutes();
            const startMinutes = 10 * 60;
            const endMinutes = 13 * 60;

            if (currentIstMinutes < startMinutes || currentIstMinutes > endMinutes) {
                setSnackbar({
                    message: t("settings.mobileLoginRestricted"),
                    severity: "error",
                    open: true,
                });
                return;
            }
        }

        const redirectTo = `${window.location.origin}/auth/google/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo,
            },
        });

        if (error) {
            setSnackbar({ message: error.message, severity: "error", open: true });
        }
    };
    const handleAppleSoon = () => {
        setSnackbar({ message: "Apple Sign-In coming soon.", severity: "info", open: true });
    };

    return (
        <>
            <main className="root x-landing">
                <Box className="x-landing-left">
                    <Stack spacing={3} className="x-landing-stack">
                        <Box className="x-landing-brand">
                            <FaXTwitter />
                        </Box>
                        <Typography component="h1" className="x-landing-title">
                            {t("auth.hero")}
                        </Typography>
                        <Typography component="h2" className="x-landing-subtitle">
                            {t("auth.join")}
                        </Typography>
                        <Stack spacing={1.5} className="x-landing-actions">
                            <Button className="x-btn x-btn-outline" variant="outlined" onClick={handleGoogleLogin}>
                                <FaGoogle />
                                {t("auth.continueWithGoogle")}
                            </Button>
                            <Button className="x-btn x-btn-outline" variant="outlined" onClick={handleAppleSoon}>
                                <FaApple />
                                {t("auth.continueWithApple")}
                            </Button>
                        </Stack>
                        <Divider className="x-divider">
                            <span>{t("auth.or")}</span>
                        </Divider>
                        <form className="x-landing-form" onSubmit={formik.handleSubmit}>
                            <Stack spacing={1.5}>
                                <TextField
                                    fullWidth
                                    name="identifier"
                                    label={t("auth.emailOrUsername")}
                                    placeholder={t("auth.enterEmailOrUsername")}
                                    variant="outlined"
                                    size="medium"
                                    value={formik.values.identifier}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                                    helperText={formik.touched.identifier && formik.errors.identifier}
                                    disabled={loginStep === 2}
                                />
                                {loginStep === 2 && (
                                    <>
                                        <TextField
                                            fullWidth
                                            name="password"
                                            label="Password"
                                            type="password"
                                            variant="outlined"
                                            size="medium"
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.password && Boolean(formik.errors.password)}
                                            helperText={formik.touched.password && formik.errors.password}
                                            autoFocus
                                        />
                                        {pendingOtp && (
                                            <OtpVerificationCard
                                                title="Verify your identity"
                                                subtitle="We've sent a 6-digit verification code to"
                                            destinationValue={pendingOtp}
                                            expiresAt={pendingOtpExpiresAt}
                                            otp={otp}
                                            setOtp={setOtp}
                                            onVerify={handleVerifyOtp}
                                            onCancel={handleBack}
                                            onResend={async () => {
                                                const response = await logIn(JSON.stringify(formik.values));
                                                if (!response.success) {
                                                    setSnackbar({ message: response.message, severity: "error", open: true });
                                                    return;
                                                }
                                                setPendingOtp(response.username ?? formik.values.identifier);
                                                setPendingOtpExpiresAt(new Date(response.expiresAt).getTime());
                                                setOtp("");
                                                setSnackbar({
                                                    message: response.message ?? "New verification code sent.",
                                                    severity: "success",
                                                    open: true,
                                                });
                                            }}
                                            loading={formik.isSubmitting}
                                            verifyLabel="Verify Code"
                                        />
                                    )}
                                    </>
                                )}
                                {loginStep === 2 && (
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => router.push("/forgot-password")}
                                        className="x-forgot-link"
                                        underline="hover"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                                {formik.isSubmitting ? (
                                    <CircularLoading />
                                ) : !pendingOtp ? (
                                    <Stack direction="row" spacing={1.25} className="x-login-actions">
                                        {loginStep === 2 && (
                                            <Button
                                                className="x-btn x-btn-outline x-btn-back"
                                                variant="outlined"
                                                type="button"
                                                onClick={handleBack}
                                            >
                                                Back
                                            </Button>
                                        )}
                                        <Button className="x-btn x-btn-primary" variant="contained" type="submit">
                                            {loginStep === 1 ? t("actions.continue") : t("actions.login")}
                                        </Button>
                                    </Stack>
                                ) : null}
                            </Stack>
                        </form>
                        <Typography component="p" className="x-landing-footer">
                            {t("auth.terms")}
                        </Typography>
                    </Stack>
                </Box>
                <Box className="x-landing-right" aria-hidden="true">
                    <FaXTwitter className="x-watermark" />
                </Box>
            </main>
            <SignUpDialog open={isSignUpOpen} handleSignUpClose={handleSignUpClose} />
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </>
    );
}
