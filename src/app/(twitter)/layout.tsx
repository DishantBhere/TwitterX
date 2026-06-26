"use client";

import { createContext, useEffect } from "react";
import i18n from "@/i18n";

import Footer from "@/components/layout/Footer";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { AuthProps } from "@/types/TokenProps";
import useAuth from "@/hooks/useAuth";

const AuthContext = createContext<AuthProps>({ token: null, isPending: true, refreshToken: () => Promise.resolve() });

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    useEffect(() => {
        const preferredLanguage = auth.token?.preferredLanguage ?? localStorage.getItem("preferredLanguage") ?? "en";
        i18n.changeLanguage(preferredLanguage);
    }, [auth.token?.preferredLanguage]);

    return (
        <AuthContext.Provider value={auth}>
            <div className="layout">
                <LeftSidebar />
                {children}
                <RightSidebar />
                <Footer />
            </div>
        </AuthContext.Provider>
    );
}

export { AuthContext };
