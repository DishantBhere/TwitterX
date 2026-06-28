"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AuthContext } from "@/context/AuthContext";
import Search from "../misc/Search";
import WhoToFollow from "../misc/WhoToFollow";
import CompleteProfileReminder from "../misc/CompleteProfileReminder";
import Legal from "../misc/Legal";

export default function RightSidebar() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();

    return (
        <aside className="right-sidebar">
            <div className="fixed">
                <Search />
                {token && <WhoToFollow />}
                {token && <CompleteProfileReminder token={token} />}
                {!isPending && !token && (
                    <div className="reminder">
                        <h1>{t("sidebar.dontMiss")}</h1>
                        <p>{t("sidebar.firstToKnow")}</p>
                        <div className="reminder-buttons">
                            <Link href="/" className="btn btn-white">
                                {t("actions.login")}
                            </Link>
                            <Link href="/" className="btn btn-dark">
                                {t("actions.signup")}
                            </Link>
                        </div>
                    </div>
                )}
                <Legal />
            </div>
        </aside>
    );
}
