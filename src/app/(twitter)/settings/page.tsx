"use client";

import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "../layout";
import LanguageSelector from "@/components/misc/LanguageSelector";
import CircularLoading from "@/components/misc/CircularLoading";
import { formatDateExtended } from "@/utilities/date";
import { getLoginHistory } from "@/utilities/fetch";
import { LoginHistoryProps } from "@/types/LoginHistoryProps";

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const { isLoading, data } = useQuery({
        queryKey: ["login-history"],
        queryFn: getLoginHistory,
        enabled: !!token,
    });

    const loginHistory: LoginHistoryProps[] = data?.loginHistory ?? [];

    return (
        <main>
            <h1 className="page-name">{t("settings.title")}</h1>
            <div className="color-theme-switch">
                <h1>{t("settings.colorTheme")}</h1>
                <Switch checked={theme === "dark" ? true : false} onChange={toggleTheme} />
                <div className="label">{theme === "dark" ? t("settings.lightsOut") : t("settings.defaultTheme")}</div>
            </div>
            {token && (
                <div className="settings-language">
                    <h1>{t("settings.language")}</h1>
                    <LanguageSelector currentLanguage={token.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                </div>
            )}
            {token && (
                <div className="settings-language">
                    <h1>Login History</h1>
                    {isLoading ? (
                        <CircularLoading />
                    ) : loginHistory.length === 0 ? (
                        <p className="text-muted">No login history available.</p>
                    ) : (
                        <div className="login-history-list">
                            {loginHistory.map((entry, index) => (
                                <div className="login-history-item" key={`${entry.loginTime}-${index}`}>
                                    <div><strong>Browser:</strong> {entry.browser}</div>
                                    <div><strong>Operating System:</strong> {entry.operatingSystem}</div>
                                    <div><strong>Device Type:</strong> {entry.deviceType}</div>
                                    <div><strong>IP Address:</strong> {entry.ipAddress}</div>
                                    <div><strong>Login Time:</strong> {formatDateExtended(entry.loginTime)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
