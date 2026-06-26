"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import GlobalLoading from "@/components/misc/GlobalLoading";
import i18n from "@/i18n";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

export const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export default function Providers({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState("loading");

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            setTheme("light");
        }
    }, []);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
        }
    }, [theme]);

    const muiTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: theme === "light" ? "light" : "dark",
                },
            }),
        [theme]
    );

    if (theme === "loading") return <GlobalLoading />;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ThemeProvider theme={muiTheme}>
                <I18nextProvider i18n={i18n}>
                    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                </I18nextProvider>
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}
