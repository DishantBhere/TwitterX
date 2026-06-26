"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";
import { FaArrowRight } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import SignUpDialog from "@/components/dialog/SignUpDialog";
import LogInDialog from "@/components/dialog/LogInDialog";
import { logInAsTest } from "@/utilities/fetch";
import GlobalLoading from "@/components/misc/GlobalLoading";
import CustomSnackbar from "@/components/misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function RootPage() {
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [isLogInOpen, setIsLogInOpen] = useState(false);
    const [isLoggingAsTest, setIsLoggingAsTest] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const { t } = useTranslation();

    const router = useRouter();

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
    const handleTestLogin = async () => {
        setIsLoggingAsTest(true);
        const response = await logInAsTest();
        if (!response.success) {
            setIsLoggingAsTest(false);
            setSnackbar({ message: t("auth.genericFailed"), severity: "error", open: true });
            return;
        }
        router.push("/explore");
    };

    if (isLoggingAsTest) return <GlobalLoading />;

    return (
        <>
            <main className="root">
                <div className="root-left">
                    <Image src="/assets/root.png" alt="" fill />
                    <div className="root-left-logo">
                        <Image src="/assets/favicon-white.png" alt="" width={140} height={140} />
                    </div>
                </div>
                <div className="root-right">
                    <Image src="/assets/favicon.png" alt="" width={40} height={40} />
                    <h1>{t("auth.hero")}</h1>
                    <p>{t("auth.join")}</p>
                    <div className="button-group">
                        <button className="btn" onClick={handleSignUpClick}>
                            {t("actions.createAccount")}
                        </button>
                        <button className="btn btn-light" onClick={handleLogInClick}>
                            {t("actions.signin")}
                        </button>
                        <Tooltip
                            title={t("auth.testTooltip")}
                            placement="bottom"
                        >
                            <button onClick={handleTestLogin} className="btn btn-light">
                                <span>{t("auth.testAccount")}</span>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </main>
            <SignUpDialog open={isSignUpOpen} handleSignUpClose={handleSignUpClose} />
            <LogInDialog open={isLogInOpen} handleLogInClose={handleLogInClose} />
            <Link className="fixed-link text-muted" href="/explore">
                {t("auth.exploreWithoutLogin")} <FaArrowRight />
            </Link>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </>
    );
}
