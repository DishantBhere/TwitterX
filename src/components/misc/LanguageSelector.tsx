"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import { requestLanguageOtp, verifyLanguageOtp } from "@/utilities/fetch";
import { languageLabels, SupportedLanguage, supportedLanguages } from "@/utilities/language";
import CustomSnackbar from "./CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import OtpVerificationCard from "@/components/auth/OtpVerificationCard";

type PendingOtp = {
    language: SupportedLanguage;
    deliveryMethod: "email" | "phone";
    destination: string;
    simulatedOtp: string;
    expiresAt: number;
};

export default function LanguageSelector({
    currentLanguage,
    refreshToken,
}: {
    currentLanguage: string;
    refreshToken: () => void | Promise<void>;
}) {
    const { t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage as SupportedLanguage);
    const [pendingOtp, setPendingOtp] = useState<PendingOtp | null>(null);
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

    const handleLanguageChange = async (language: SupportedLanguage) => {
        setSelectedLanguage(language);
        setOtp("");
        if (language === currentLanguage) {
            setPendingOtp(null);
            return setSnackbar({ message: t("settings.alreadySelected"), severity: "info", open: true });
        }

        setIsLoading(true);
        const response = await requestLanguageOtp(language);
        console.log("OTP RESPONSE", response);
        setIsLoading(false);

        if (!response.success) {
            setSelectedLanguage(currentLanguage as SupportedLanguage);
            return setSnackbar({
                message: response.message ?? t("settings.requestFailed"),
                severity: "error",
                open: true,
            });
        }

        const nextPendingOtp = {
            language,
            deliveryMethod: response.deliveryMethod,
            destination: response.destination,
            simulatedOtp: response.simulatedOtp,
            expiresAt: new Date(response.expiresAt).getTime(),
        };
        console.log("PENDING OTP TO SET", nextPendingOtp);
        setPendingOtp(nextPendingOtp);
    };

    const handleVerify = async () => {
        console.log("STEP 1 - Verify clicked");
        if (!pendingOtp) return;

        setIsLoading(true);
        const response = await verifyLanguageOtp(pendingOtp.language, otp);
       console.log("STEP 2 - API Response", response);
        setIsLoading(false);

        if (!response.success) {
            return setSnackbar({ message: response.message ?? t("settings.verifyFailed"), severity: "error", open: true });
        }

        const nextLanguage = pendingOtp.language;
        setSelectedLanguage(nextLanguage);
        localStorage.setItem("preferredLanguage", nextLanguage);
        void i18n.changeLanguage(nextLanguage);
        await refreshToken();
        console.log("STEP 3 - Refresh finished");
        setPendingOtp(null);
        setOtp("");
        setSnackbar({ message: t("settings.changed"), severity: "success", open: true });
    };

    return (
        <div className="language-selector">
            <FormControl fullWidth>
                <InputLabel id="language-select-label">{t("settings.preferredLanguage")}</InputLabel>
                <Select
                    labelId="language-select-label"
                    label={t("settings.preferredLanguage")}
                    value={selectedLanguage}
                    onChange={(event) => handleLanguageChange(event.target.value as SupportedLanguage)}
                >
                    {supportedLanguages.map((language) => (
                        <MenuItem key={language} value={language}>
                            {languageLabels[language]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {console.log("PENDING OTP BEFORE RENDER", pendingOtp)}
            {pendingOtp && (
                <OtpVerificationCard
                    title={t("settings.otpTitle")}
                    subtitle={t("settings.otpSent", {
                        method: pendingOtp.deliveryMethod,
                        destination: pendingOtp.destination,
                    })}
                    destinationType={pendingOtp.deliveryMethod}
                    destinationValue={pendingOtp.destination}
                    expiresAt={pendingOtp.expiresAt}
                    otp={otp}
                    setOtp={setOtp}
                    onVerify={handleVerify}
                    onCancel={() => {
                        setSelectedLanguage(currentLanguage as SupportedLanguage);
                        setPendingOtp(null);
                        setOtp("");
                    }}
                    onResend={async () => {
                        setIsLoading(true);
                        const response = await requestLanguageOtp(pendingOtp.language);
                        setIsLoading(false);

                        if (!response.success) {
                            return setSnackbar({ message: response.message ?? t("settings.requestFailed"), severity: "error", open: true });
                        }

                        setPendingOtp({
                            language: pendingOtp.language,
                            deliveryMethod: response.deliveryMethod,
                            destination: response.destination,
                            simulatedOtp: response.simulatedOtp,
                            expiresAt: new Date(response.expiresAt).getTime(),
                        });
                        setOtp("");
                        setSnackbar({ message: t("settings.resendSuccess"), severity: "success", open: true });
                    }}
                    loading={isLoading}
                    verifyLabel={t("actions.verify")}
                    successMessage=""
                    demoOtp={pendingOtp.deliveryMethod === "phone" && process.env.NODE_ENV !== "production" ? pendingOtp.simulatedOtp : undefined}
                    compact
                />
            )}
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
        </div>
    );
}
