"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Box, Button, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { FaArrowLeft, FaXTwitter } from "react-icons/fa6";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import CircularLoading from "@/components/misc/CircularLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { forgotPassword } from "@/utilities/fetch";
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";

type ResetStep = 1 | 2 | 3;

const OTP_DURATION_SECONDS = 5 * 60;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const buildRandomPassword = (length = 12) => {
    let password = "";
    for (let index = 0; index < length; index += 1) {
        password += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    return password;
};

const isEmail = (value: string) => value.includes("@");

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<ResetStep>(1);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [resetToken, setResetToken] = useState("");
    const [resetUserId, setResetUserId] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [otpRequestedAt, setOtpRequestedAt] = useState(0);
    const { t } = useTranslation();
    const router = useRouter();

    const validationSchema = useMemo(
        () =>
            yup.object({
                identifier: yup.string().required(t("auth.forgotPasswordRequired")),
                otp:
                    step >= 2
                        ? yup.string().matches(/^\d{6}$/, t("auth.enterOtp")).required(t("auth.otpRequired"))
                        : yup.string(),
                password:
                    step === 3
                        ? yup
                              .string()
                              .min(12, t("auth.passwordLength"))
                              .required(t("auth.newPasswordRequired"))
                        : yup.string(),
                confirmPassword:
                    step === 3
                        ? yup
                              .string()
                              .oneOf([yup.ref("password")], t("auth.passwordsDoNotMatch"))
                              .required(t("auth.confirmPasswordRequired"))
                        : yup.string(),
            }),
        [step, t]
    );

    const formik = useFormik({
        initialValues: {
            identifier: "",
            otp: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: async (values) => {
            if (step === 1) {
                setIsBusy(true);
                const response = await forgotPassword({
                    action: "request",
                    identifier: values.identifier,
                });
                setIsBusy(false);

                if (!response.success) {
                    setSnackbar({ message: response.message || t("auth.genericFailed"), severity: "error", open: true });
                    return;
                }

                setSnackbar({ message: response.message, severity: "success", open: true });
                setOtpRequestedAt(Date.now());
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
                    setSnackbar({ message: response.message || t("auth.genericFailed"), severity: "error", open: true });
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
                setSnackbar({ message: response.message || t("auth.genericFailed"), severity: "error", open: true });
                return;
            }

            setSnackbar({ message: t("auth.passwordUpdated"), severity: "success", open: true });
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
        setOtpRequestedAt(0);
        formik.setFieldValue("otp", "");
    };

    const handleGeneratePassword = () => {
        const password = buildRandomPassword();
        setGeneratedPassword(password);
        formik.setFieldValue("password", password);
        formik.setFieldValue("confirmPassword", password);
        formik.setFieldTouched("password", true, false);
        formik.setFieldTouched("confirmPassword", true, false);
    };

    const handleResendOtp = async () => {
        const response = await forgotPassword({
            action: "request",
            identifier: formik.values.identifier,
            resend: true,
        });

        if (!response.success) {
            setSnackbar({ message: response.message || t("auth.genericFailed"), severity: "error", open: true });
            return;
        }

        formik.setFieldValue("otp", "");
        setOtpRequestedAt(Date.now());
        setSnackbar({ message: t("auth.newOtpSent"), severity: "success", open: true });
    };

    const destinationMethod = isEmail(formik.values.identifier) ? "email" : "phone";

    return (
        <main className="root x-landing x-forgot-password">
            <Box className="x-landing-left">
                <Stack spacing={3} className="x-landing-stack x-forgot-stack">
                    <Box className="x-landing-brand">
                        <FaXTwitter />
                    </Box>
                    <Typography component="h1" className="x-landing-title">
                        {t("auth.forgotPasswordTitle")}
                    </Typography>
                    <Typography component="h2" className="x-landing-subtitle">
                        {t("auth.forgotPasswordSubtitle")}
                    </Typography>
                    <Divider className="x-divider">
                        <span>{t("auth.forgotPasswordDivider")}</span>
                    </Divider>
                    <form className="x-landing-form" onSubmit={formik.handleSubmit}>
                        <Stack spacing={1.5}>
                            {step >= 1 && (
                                <TextField
                                    fullWidth
                                    name="identifier"
                                    label={t("auth.emailOrPhone")}
                                    placeholder={t("auth.enterEmailOrPhone")}
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
                                    title={t("auth.verifyIdentity")}
                                    subtitle={t("auth.verifyIdentitySubtitle", { method: t(`auth.${destinationMethod}`) })}
                                    destinationValue={formik.values.identifier}
                                    destinationType={destinationMethod}
                                    otp={formik.values.otp}
                                    setOtp={(value) => formik.setFieldValue("otp", value)}
                                    onVerify={formik.handleSubmit}
                                    onResend={handleResendOtp}
                                    loading={isBusy}
                                    verifyLabel={t("actions.verify")}
                                    cancelLabel={t("actions.cancel")}
                                    onCancel={handleBack}
                                    expiredLabel={t("auth.otpExpired")}
                                    expiresInLabel={t("auth.otpExpiresIn")}
                                    expiresAt={otpRequestedAt ? otpRequestedAt + OTP_DURATION_SECONDS * 1000 : undefined}
                                    demoOtp={destinationMethod === "phone" && process.env.NODE_ENV !== "production" ? "123456" : undefined}
                                    compact
                                />
                            )}
                            {step === 3 && (
                                <>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        label={t("auth.newPassword")}
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
                                    <TextField
                                        fullWidth
                                        name="confirmPassword"
                                        label={t("auth.confirmPassword")}
                                        type="password"
                                        variant="outlined"
                                        size="medium"
                                        value={formik.values.confirmPassword}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                    />
                                    <Link component="button" type="button" className="x-forgot-link" underline="hover" onClick={handleGeneratePassword}>
                                        {t("auth.generatePassword")}
                                    </Link>
                                    {generatedPassword && (
                                        <Typography className="x-generated-password">
                                            {t("auth.generatedPasswordReady")}
                                        </Typography>
                                    )}
                                </>
                            )}
                            {step !== 2 && (
                                <Stack direction="row" spacing={1.25} className="x-login-actions">
                                    <Button className="x-btn x-btn-outline x-btn-back" variant="outlined" type="button" onClick={handleBack}>
                                        <FaArrowLeft />
                                        {t("actions.back")}
                                    </Button>
                                    {isBusy ? (
                                        <CircularLoading />
                                    ) : step === 1 ? (
                                        <Button className="x-btn x-btn-primary" variant="contained" type="submit">
                                            {t("actions.sendOtp")}
                                        </Button>
                                    ) : (
                                        <Button className="x-btn x-btn-primary" variant="contained" type="submit">
                                            {t("auth.savePassword")}
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
            {snackbar.open && <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />}
        </main>
    );
}
