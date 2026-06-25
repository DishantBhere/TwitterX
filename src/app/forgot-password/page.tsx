"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, TextField } from "@mui/material";
import * as yup from "yup";
import Image from "next/image";

import { forgotPassword } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function ForgotPasswordPage() {
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const validationSchema = yup.object({
        identifier: yup.string().required("Email or phone is required."),
    });

    const formik = useFormik({
        initialValues: {
            identifier: "",
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            setIsSubmitting(true);
            setGeneratedPassword(null);
            const response = await forgotPassword(values.identifier);
            setIsSubmitting(false);

            if (!response.success) {
                setSnackbar({ message: response.message || "Something went wrong. Please try again.", severity: "error", open: true });
                return;
            }

            setGeneratedPassword(response.password);
            resetForm();
        },
    });

    return (
        <main className="root">
            <div className="root-left">
                <Image src="/assets/root.png" alt="" fill />
                <div className="root-left-logo">
                    <Image src="/assets/favicon-white.png" alt="" width={140} height={140} />
                </div>
            </div>
            <div className="root-right">
                <Image src="/assets/favicon.png" alt="" width={40} height={40} />
                <h1>Reset your password</h1>
                <p>Enter your registered email or phone.</p>
                <Dialog className="dialog" open>
                    <Image className="dialog-icon" src="/assets/favicon.png" alt="" width={40} height={40} />
                    <DialogTitle className="title">Password reset</DialogTitle>
                    <form className="dialog-form" onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <div className="input-group">
                                <div className="input">
                                    <TextField
                                        required
                                        fullWidth
                                        name="identifier"
                                        label="Email or phone"
                                        placeholder="Enter email or phone"
                                        value={formik.values.identifier}
                                        onChange={formik.handleChange}
                                        error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                                        helperText={formik.touched.identifier && formik.errors.identifier}
                                        autoFocus
                                    />
                                </div>
                                {generatedPassword && (
                                    <div className="input">
                                        <div className="info">Your new password</div>
                                        <TextField
                                            fullWidth
                                            value={generatedPassword}
                                            InputProps={{ readOnly: true }}
                                        />
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                        {isSubmitting ? (
                            <CircularLoading />
                        ) : (
                            <div className="button-group">
                                <button className="btn btn-dark" type="submit">
                                    Reset password
                                </button>
                                <button className="btn btn-white" type="button" onClick={() => router.push("/")}>
                                    Back
                                </button>
                            </div>
                        )}
                    </form>
                </Dialog>
            </div>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </main>
    );
}
