import { randomBytes } from "crypto";

const OTP_TTL_MS = 5 * 60 * 1000;

type PendingForgotPassword = {
    userId: string;
    otp: string;
    expiresAt: number;
    resetToken: string;
};

const globalForForgotPasswordOtp = globalThis as typeof globalThis & {
    forgotPasswordOtpStore?: Map<string, PendingForgotPassword>;
};

const forgotPasswordOtpStore = globalForForgotPasswordOtp.forgotPasswordOtpStore ?? new Map<string, PendingForgotPassword>();
globalForForgotPasswordOtp.forgotPasswordOtpStore = forgotPasswordOtpStore;

export const generateForgotPasswordOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateForgotPasswordToken = () =>
    randomBytes(24)
        .toString("hex")
        .slice(0, 48);

export const saveForgotPasswordOtp = (key: string) => {
    const otp = generateForgotPasswordOtp();
    const resetToken = generateForgotPasswordToken();

    forgotPasswordOtpStore.set(key, {
        userId: key,
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
        resetToken,
    });

    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS), resetToken };
};

export const verifyForgotPasswordOtp = (key: string, otp: string) => {
    const pending = forgotPasswordOtpStore.get(key);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        forgotPasswordOtpStore.delete(key);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.otp !== otp) return { success: false, message: "Incorrect OTP. Please try again." };

    return { success: true as const, pending };
};

export const consumeForgotPasswordToken = (key: string, resetToken: string) => {
    const pending = forgotPasswordOtpStore.get(key);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        forgotPasswordOtpStore.delete(key);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.resetToken !== resetToken) return { success: false, message: "Reset session is invalid." };

    forgotPasswordOtpStore.delete(key);
    return { success: true as const };
};

export const getForgotPasswordPending = (key: string) => forgotPasswordOtpStore.get(key);
