"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Box, Button, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { FaArrowLeft, FaXTwitter } from "react-icons/fa6";
import * as yup from "yup";

import CircularLoading from "@/components/misc/CircularLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { forgotPassword } from "@/utilities/fetch";
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";

type ResetStep = 1 | 2 | 3;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const buildRandomPassword = (length = 11) => {
    let password = "";
    for (let index = 0; index < length; index += 1) {
        password += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    return password;
};

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<ResetStep>(1);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [resetToken, setResetToken] = useState("");
    const [resetUserId, setResetUserId] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const router = useRouter();

    const validationSchema = useMemo(
        () =>
            yup.object({
                identifier: yup.string().required("Email or phone is required."),
                otp: step >= 2 ? yup.string().matches(/^\d{6}$/, "Enter the 6-digit OTP.").required("OTP is required.") : yup.string(),
                password:
                    step === 3
                        ? yup.string().min(8, "Password should be at least 8 characters long.").required("New password is required.")
                        : yup.string(),
                confirmPassword:
                    step === 3
                        ? yup
                              .string()
                              .oneOf([yup.ref("password")], "Passwords do not match.")
                              .required("Confirm your password.")
                        : yup.string(),
            }),
        [step]
    );

    const formik = useFormik({
        initialValues: {
            identifier: "",
            otp: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: async (values, { setFieldValue }) => {
            if (step === 1) {
                setIsBusy(true);
                const response = await forgotPassword({
                    action: "request",
                    identifier: values.identifier,
                });
                setIsBusy(false);

                if (!response.success) {
                    setSnackbar({ message: response.message || "Something went wrong. Please try again.", severity: "error", open: true });
                    return;
                }

                setSnackbar({ message: response.message, severity: "success", open: true });
                setStep(2);
                return;
            }

            if (step === 2) {
                setIsBusy(true);
                const response = await forgotPassword({
                    action: "verify",
                    identifier: values.identifier,
                    otp: values.otp,
                });
                setIsBusy(false);

                if (!response.success) {
                    setSnackbar({ message: response.message || "Something went wrong. Please try again.", severity: "error", open: true });
                    return;
                }

                setResetToken(response.resetToken);
                setResetUserId(response.userId);
                setStep(3);
                return;
            }

            const finalPassword = values.password.trim();

            setIsBusy(true);
            const response = await forgotPassword({
                action: "reset",
                identifier: values.identifier,
                resetToken,
                userId: resetUserId,
                newPassword: finalPassword,
            });
            setIsBusy(false);

            if (!response.success) {
                setSnackbar({ message: response.message || "Something went wrong. Please try again.", severity: "error", open: true });
                return;
            }

            setSnackbar({ message: "Password updated successfully.", severity: "success", open: true });
            router.push("/");
        },
    });

    const handleBack = () => {
        if (step === 1) {
            router.push("/");
            return;
        }

        if (step === 3) {
            setStep(2);
            return;
        }

        setStep(1);
    };

    const handleGeneratePassword = () => {
        const password = buildRandomPassword();
        setGeneratedPassword(password);
        formik.setFieldValue("password", password);
        formik.setFieldValue("confirmPassword", password);
        formik.setFieldTouched("password", true, false);
        formik.setFieldTouched("confirmPassword", true, false);
    };

    return (
        <main className="root x-landing">
            <Box className="x-landing-left">
                <Stack spacing={3} className="x-landing-stack">
                    <Box className="x-landing-brand">
                        <FaXTwitter />
                    </Box>
                    <Typography component="h1" className="x-landing-title">
                        Reset password.
                    </Typography>
                    <Typography component="h2" className="x-landing-subtitle">
                        Secure your account in a few steps.
                    </Typography>
                    <Divider className="x-divider">
                        <span>forgot password</span>
                    </Divider>
                    <form className="x-landing-form" onSubmit={formik.handleSubmit}>
                        <Stack spacing={1.5}>
                            {step >= 1 && (
                                <TextField
                                    fullWidth
                                    name="identifier"
                                    label="Email or Phone"
                                    placeholder="Enter email or phone"
                                    variant="outlined"
                                    size="medium"
                                    value={formik.values.identifier}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                                    helperText={formik.touched.identifier && formik.errors.identifier}
                                    disabled={step > 1}
                                />
                            )}
                            {step >= 2 && (
                                <OtpVerificationCard
                                    title="Verify your identity"
                                    subtitle="We've sent a 6-digit verification code to"
                                    destinationValue={formik.values.identifier}
                                    otp={formik.values.otp}
                                    setOtp={(value) => formik.setFieldValue("otp", value)}
                                    onVerify={formik.handleSubmit}
                                    loading={isBusy}
                                    verifyLabel="Verify Code"
                                    cancelLabel="Cancel"
                                    onCancel={handleBack}
                                />
                            )}
                            {step === 3 && (
                                <>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        label="New Password"
                                        type="password"
                                        variant="outlined"
                                        size="medium"
                                        value={formik.values.password}
                                        onChange={(event) => {
                                            formik.handleChange(event);
                                        }}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.password && Boolean(formik.errors.password)}
                                        helperText={formik.touched.password && formik.errors.password}
                                        autoFocus
                                    />
                                    <TextField
                                        fullWidth
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        type="password"
                                        variant="outlined"
                                        size="medium"
                                        value={formik.values.confirmPassword}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                    />
                                    <Link
                                        component="button"
                                        type="button"
                                        className="x-forgot-link"
                                        underline="hover"
                                        onClick={handleGeneratePassword}
                                    >
                                        Generate Password
                                    </Link>
                                    {generatedPassword && (
                                        <Typography className="x-generated-password">
                                            Generated password ready to use.
                                        </Typography>
                                    )}
                                </>
                            )}
                            {step !== 2 && (
                                <Stack direction="row" spacing={1.25} className="x-login-actions">
                                    <Button
                                        className="x-btn x-btn-outline x-btn-back"
                                        variant="outlined"
                                        type="button"
                                        onClick={handleBack}
                                    >
                                        <FaArrowLeft />
                                        Back
                                    </Button>
                                    {isBusy ? (
                                        <CircularLoading />
                                    ) : step === 1 ? (
                                        <Button className="x-btn x-btn-primary" variant="contained" type="submit">
                                            Send OTP
                                        </Button>
                                    ) : (
                                        <Button className="x-btn x-btn-primary" variant="contained" type="submit">
                                            Save Password
                                        </Button>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    </form>
                </Stack>
            </Box>
            <Box className="x-landing-right" aria-hidden="true">
                <FaXTwitter className="x-watermark" />
            </Box>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </main>
    );
}
