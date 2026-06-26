"use client";

import { useContext } from "react";
import { Switch } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "../layout";
import LanguageSelector from "@/components/misc/LanguageSelector";

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();

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
        </main>
    );
}
