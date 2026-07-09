import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, TextField, InputAdornment } from "@mui/material";
import Image from "next/image";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import { LogInDialogProps } from "@/types/DialogProps";
import { logIn, verifyLoginOtp } from "@/utilities/fetch";
import CircularLoading from "../misc/CircularLoading";
import { SnackbarProps } from "@/types/SnackbarProps";
import CustomSnackbar from "../misc/CustomSnackbar";
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";

export default function LogInDialog({ open, handleLogInClose }: LogInDialogProps) {
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [pendingOtp, setPendingOtp] = useState<{
        username: string;
        expiresAt?: number;
    } | null>(null);
    const [otp, setOtp] = useState("");
    const { t } = useTranslation();

    const router = useRouter();
    const mapMobileLoginRestrictionMessage = (message?: string) =>
        message === "Mobile login is allowed only between 10:00 AM and 1:00 PM IST."
            ? t("settings.mobileLoginRestricted")
            : message ?? "";

    const validationSchema = yup.object({
        identifier: yup
            .string()
            .required("Email or username is required."),
        password: yup
            .string()
            .min(8, "Password should be of minimum 8 characters length.")
            .max(100, "Password should be of maximum 100 characters length.")
            .required("Password is required."),
    });

    const formik = useFormik({
        initialValues: {
            identifier: "",
            password: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const response = await logIn(JSON.stringify(values));
            if (!response.success) {
                setSnackbar({ message: mapMobileLoginRestrictionMessage(response.message), severity: "error", open: true });
                return;
            }
            if (response.requiresOtp) {
                setPendingOtp({
                    username: response.username ?? values.identifier,
                    expiresAt: response.expiresAt,
                });
                setOtp("");
                setSnackbar({
                    message: response.message ?? "A verification code has been sent to your registered email.",
                    severity: "success",
                    open: true,
                });
                return;
            }
            resetForm();
            handleLogInClose();
            router.push("/explore");
        },
    });

    const handleVerifyOtp = async () => {
        if (!pendingOtp) return;

        formik.setSubmitting(true);
        const response = await verifyLoginOtp(pendingOtp.username, otp);
        formik.setSubmitting(false);

        if (!response.success) {
            return setSnackbar({ message: mapMobileLoginRestrictionMessage(response.message), severity: "error", open: true });
        }

        setPendingOtp(null);
        setOtp("");
        formik.resetForm();
        handleLogInClose();
        router.push("/explore");
    };

    return (
        <Dialog className="dialog" open={open} onClose={handleLogInClose}>
            <Image className="dialog-icon" src="/assets/favicon.png" alt="" width={40} height={40} />
            <DialogTitle className="title">{t("auth.loginTitle")}</DialogTitle>
            <form className="dialog-form" onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <div className="input-group">
                        <div className="input">
                            <TextField
                                fullWidth
                                name="identifier"
                                label="Email or Username"
                                placeholder="email or username"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                                }}
                                value={formik.values.identifier}
                                onChange={formik.handleChange}
                                error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                                helperText={formik.touched.identifier && formik.errors.identifier}
                                autoFocus
                            />
                        </div>
                        <div className="input">
                            <TextField
                                fullWidth
                                name="password"
                                label={t("auth.password")}
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                            />
                        </div>
                    </div>
                    {pendingOtp && (
                        <OtpVerificationCard
                            title="Verify your identity"
                            subtitle="We've sent a 6-digit verification code to"
                            destinationValue={pendingOtp.username}
                            expiresAt={pendingOtp.expiresAt}
                            otp={otp}
                            setOtp={setOtp}
                            onVerify={handleVerifyOtp}
                            onCancel={() => {
                                setPendingOtp(null);
                                setOtp("");
                                formik.setFieldValue("password", "");
                            }}
                            loading={formik.isSubmitting}
                            verifyLabel="Verify Code"
                            onResend={async () => {
                                const response = await logIn(JSON.stringify(formik.values));
                                if (!response.success) {
                                    setSnackbar({
                                        message: mapMobileLoginRestrictionMessage(response.message),
                                        severity: "error",
                                        open: true,
                                    });
                                    return;
                                }
                                setPendingOtp({
                                    username: response.username ?? formik.values.identifier,
                                    expiresAt: response.expiresAt,
                                });
                                setOtp("");
                                setSnackbar({ message: response.message ?? "New verification code sent.", severity: "success", open: true });
                            }}
                        />
                    )}
                </DialogContent>
                {formik.isSubmitting ? (
                    <CircularLoading />
                ) : !pendingOtp ? (
                    <button className="btn btn-dark" type="submit">
                        {t("actions.login")}
                    </button>
                ) : null}
            </form>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </Dialog>
    );
}
