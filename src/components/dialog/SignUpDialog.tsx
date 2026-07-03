import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { Dialog, DialogContent, DialogTitle, InputAdornment, TextField } from "@mui/material";
import * as yup from "yup";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import { SignUpDialogProps } from "@/types/DialogProps";
import { checkUserExists, createUser } from "@/utilities/fetch";
import CircularLoading from "../misc/CircularLoading";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function SignUpDialog({ open, handleSignUpClose }: SignUpDialogProps) {
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [pendingSignup, setPendingSignup] = useState<{
        username: string;
        password: string;
        email: string;
        phone: string;
        name: string;
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
            .required("Username is required.")
            .test("checkUserExists", "User already exists.", async (value) => {
                if (value) {
                    const response = await checkUserExists(value);
                    if (response.success) return false;
                }
                return true;
            }),
        password: yup
            .string()
            .min(8, "Password should be of minimum 8 characters length.")
            .max(100, "Password should be of maximum 100 characters length.")
            .required("Password is required."),
        email: yup.string().email("Email is invalid").required("Email is required."),
        phone: yup.string().required("Phone is required."),
        name: yup.string().max(50, "Name should be of maximum 50 characters length."),
    });

    const formik = useFormik({
        initialValues: {
            username: "",
            password: "",
            email: "",
            phone: "",
            name: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const response = await createUser(JSON.stringify(values));
            if (!response.success) {
                return setSnackbar({
                    message: response.message ?? t("auth.genericFailed"),
                    severity: "error",
                    open: true,
                });
            }
            if (response.requiresOtp) {
                setPendingSignup(values);
                setOtp("");
                return setSnackbar({
                    message: response.message ?? "A verification code has been sent to your email.",
                    severity: "success",
                    open: true,
                });
            }
            resetForm();
            setPendingSignup(null);
            setOtp("");
            handleSignUpClose();
            router.push("/explore");
        },
    });

    const handleVerifySignupOtp = async () => {
        if (!pendingSignup) return;

        formik.setSubmitting(true);
        const response = await createUser(JSON.stringify({ ...pendingSignup, otp }));
        formik.setSubmitting(false);

        if (!response.success) {
            return setSnackbar({
                message: response.message ?? t("auth.genericFailed"),
                severity: "error",
                open: true,
            });
        }

        formik.resetForm();
        setPendingSignup(null);
        setOtp("");
        handleSignUpClose();
        router.push("/explore");
    };

    return (
        <Dialog className="dialog" open={open} onClose={handleSignUpClose}>
            <Image className="dialog-icon" src="/assets/favicon.png" alt="" width={40} height={40} />
            <DialogTitle className="title">{t("auth.signupTitle")}</DialogTitle>
            <form className="dialog-form" onSubmit={formik.handleSubmit}>
                <DialogContent>
                    {pendingSignup ? (
                        <div className="input-group">
                            <div className="input">
                                <div className="info">A verification code has been sent to your email.</div>
                                <TextField
                                    fullWidth
                                    name="otp"
                                    label="Enter OTP"
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                    autoFocus
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="input-group">
                            <div className="input">
                                <div className="info">{t("auth.loginInfo")}</div>
                                <TextField
                                    required
                                    fullWidth
                                    name="username"
                                    label={t("auth.username")}
                                    placeholder="username"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">@</InputAdornment>,
                                    }}
                                    value={formik.values.username}
                                    onChange={formik.handleChange}
                                    error={Boolean(formik.errors.username)}
                                    helperText={formik.errors.username}
                                    autoFocus
                                />
                            </div>
                            <div className="input">
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label={t("auth.password")}
                                    type="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={Boolean(formik.errors.password)}
                                    helperText={formik.errors.password}
                                />
                            </div>
                            <div className="input">
                                <TextField
                                    required
                                    fullWidth
                                    name="email"
                                    label={t("auth.email")}
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={Boolean(formik.errors.email)}
                                    helperText={formik.errors.email}
                                />
                            </div>
                            <div className="input">
                                <TextField
                                    required
                                    fullWidth
                                    name="phone"
                                    label={t("auth.phone")}
                                    value={formik.values.phone}
                                    onChange={formik.handleChange}
                                    error={Boolean(formik.errors.phone)}
                                    helperText={formik.errors.phone}
                                />
                            </div>
                            <div className="input">
                                <div className="info">{t("auth.publicName")}</div>
                                <TextField
                                    fullWidth
                                    name="name"
                                    label={t("auth.name")}
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
                {pendingSignup ? (
                    formik.isSubmitting ? (
                        <CircularLoading />
                    ) : (
                        <button
                            className={`btn btn-dark ${otp.length === 6 ? "" : "disabled"}`}
                            type="button"
                            onClick={handleVerifySignupOtp}
                            disabled={otp.length !== 6}
                        >
                            {t("actions.verify")}
                        </button>
                    )
                ) : formik.isSubmitting ? (
                    <CircularLoading />
                ) : (
                    <button
                        className={`btn btn-dark ${formik.isValid ? "" : "disabled"}`}
                        type="submit"
                        disabled={!formik.isValid}
                    >
                        {t("actions.create")}
                    </button>
                )}
            </form>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </Dialog>
    );
}
