"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AuthContext } from "@/context/AuthContext";

export default function Footer() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();

    if (isPending) return null;

    if (!token)
        return (
            <footer className="footer">
                <div className="footer-div">
                    <h1>{t("sidebar.dontMiss")}</h1>
                    <p>{t("sidebar.firstToKnow")}</p>
                </div>
                <div>
                    <Link href="/" className="btn ">
                        {t("actions.login")}
                    </Link>
                    <Link href="/" className="btn btn-light">
                        {t("actions.signup")}
                    </Link>
                </div>
            </footer>
        );

    return null;
}
