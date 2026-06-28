"use client";

import { createContext } from "react";

import { AuthProps } from "@/types/TokenProps";

export const AuthContext = createContext<AuthProps>({ token: null, isPending: true, refreshToken: () => Promise.resolve() });
