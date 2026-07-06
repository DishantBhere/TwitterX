"use client";

import { useEffect, useState } from "react";
import { RiTwitterXFill } from "react-icons/ri";

export default function GlobalLoading() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const updateTheme = () => {
            const storedTheme = window.localStorage.getItem("theme");
            const darkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const isDark = storedTheme === "dark" || (!storedTheme && darkPreferred);
            setTheme(isDark ? "dark" : "light");
        };

        updateTheme();

        const observer = new MutationObserver(() => {
            updateTheme();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div
            className="global-loading-wrapper"
            style={{
                backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
                color: theme === "dark" ? "#ffffff" : "#000000",
            }}
        >
            <RiTwitterXFill className="x-logo" aria-hidden="true" />
        </div>
    );
}
