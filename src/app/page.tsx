"use client";

import { useState } from "react";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { FaApple, FaGoogle, FaPhone, FaXTwitter } from "react-icons/fa6";

import SignUpDialog from "@/components/dialog/SignUpDialog";
import LogInDialog from "@/components/dialog/LogInDialog";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { supabase } from "@/utilities/storage";

export default function RootPage() {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [isLogInOpen, setIsLogInOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

    const handleSignUpClick = () => {
        setIsSignUpOpen(true);
    };
    const handleSignUpClose = () => {
        setIsSignUpOpen(false);
    };
    const handleLogInClick = () => {
        setIsLogInOpen(true);
    };
    const handleLogInClose = () => {
        setIsLogInOpen(false);
    };
    const handleGoogleLogin = async () => {
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
                            Happening now.
                        </Typography>
                        <Typography component="h2" className="x-landing-subtitle">
                            Join today.
                        </Typography>
                        <Stack spacing={1.5} className="x-landing-actions">
                            <Button className="x-btn x-btn-outline" variant="outlined" onClick={handleGoogleLogin}>
                                <FaGoogle />
                                Continue with Google
                            </Button>
                            <Button className="x-btn x-btn-outline" variant="outlined" onClick={handleAppleSoon}>
                                <FaApple />
                                Continue with Apple
                            </Button>
                        </Stack>
                        <Divider className="x-divider">
                            <span>or</span>
                        </Divider>
                        <Stack spacing={1.5} className="x-landing-form">
                            <TextField
                                fullWidth
                                label="Email or Username"
                                placeholder="Enter email or username"
                                variant="outlined"
                                size="medium"
                            />
                            <Button className="x-btn x-btn-primary" variant="contained" onClick={handleLogInClick}>
                                Continue
                            </Button>
                        </Stack>
                        <Typography component="p" className="x-landing-footer">
                            By signing up, you agree to the Terms of Service and Privacy Policy, including Cookie Use.
                        </Typography>
                    </Stack>
                </Box>
                <Box className="x-landing-right" aria-hidden="true">
                    <FaXTwitter className="x-watermark" />
                </Box>
            </main>
            <SignUpDialog open={isSignUpOpen} handleSignUpClose={handleSignUpClose} />
            <LogInDialog open={isLogInOpen} handleLogInClose={handleLogInClose} />
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </>
    );
}
