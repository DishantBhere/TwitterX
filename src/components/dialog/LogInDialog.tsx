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

export default function LogInDialog({ open, handleLogInClose }: LogInDialogProps) {
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [pendingOtp, setPendingOtp] = useState<{
        username: string;
        deliveryMethod: string;
        destination: string;
        simulatedOtp: string;
    } | null>(null);
    const [otp, setOtp] = useState("");
    const { t } = useTranslation();

    const router = useRouter();

    const validationSchema = yup.object({
        username: yup
            .string()
            .min(3, "Username should be of minimum 3 characters length.")
            .max(20, "Username should be of maximum 20 characters length.")
            .matches(/^[a-zA-Z0-9_]{1,14}[a-zA-Z0-9]$/, "Username is invalid")
            .required("Username is required."),
        password: yup
            .string()
            .min(8, "Password should be of minimum 8 characters length.")
            .max(100, "Password should be of maximum 100 characters length.")
            .required("Password is required."),
    });

    const formik = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const response = await logIn(JSON.stringify(values));
            if (!response.success) {
                setSnackbar({ message: response.message, severity: "error", open: true });
                return;
            }
            if (response.requiresOtp) {
                setPendingOtp({
                    username: response.username ?? values.username,
                    deliveryMethod: response.deliveryMethod,
                    destination: response.destination,
                    simulatedOtp: response.simulatedOtp,
                });
                setOtp("");
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
            return setSnackbar({ message: response.message, severity: "error", open: true });
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
                                name="username"
                                label={t("auth.username")}
                                placeholder="username"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                                }}
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                error={formik.touched.username && Boolean(formik.errors.username)}
                                helperText={formik.touched.username && formik.errors.username}
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
                        <div className="language-otp">
                            <h2>Verify your login</h2>
                            <p>
                                A 6-digit OTP was sent to your registered {pendingOtp.deliveryMethod}: {pendingOtp.destination}.
                            </p>
                            <p className="simulated-otp">Simulated OTP: {pendingOtp.simulatedOtp}</p>
                            <TextField
                                fullWidth
                                name="otp"
                                label="Enter OTP"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            />
                        </div>
                    )}
                </DialogContent>
                {formik.isSubmitting ? (
                    <CircularLoading />
                ) : pendingOtp ? (
                    <button className="btn btn-dark" type="button" onClick={handleVerifyOtp} disabled={otp.length !== 6}>
                        {t("actions.verify")}
                    </button>
                ) : (
                    <button className="btn btn-dark" type="submit">
                        {t("actions.login")}
                    </button>
                )}
            </form>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </Dialog>
    );
}
