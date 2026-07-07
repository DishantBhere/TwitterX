import { randomBytes } from "crypto";

const OTP_TTL_MS = 5 * 60 * 1000;

type PendingForgotPassword = {
    userId: string;
    otp: string;
    expiresAt: number;
    resetToken: string;
    identifier: string;
    requestedAt: number;
};

const globalForForgotPasswordOtp = globalThis as typeof globalThis & {
    forgotPasswordOtpStore?: Map<string, PendingForgotPassword>;
    forgotPasswordDailyRequestStore?: Map<string, number>;
};

const forgotPasswordOtpStore = globalForForgotPasswordOtp.forgotPasswordOtpStore ?? new Map<string, PendingForgotPassword>();
globalForForgotPasswordOtp.forgotPasswordOtpStore = forgotPasswordOtpStore;

const forgotPasswordDailyRequestStore =
    globalForForgotPasswordOtp.forgotPasswordDailyRequestStore ?? new Map<string, number>();
globalForForgotPasswordOtp.forgotPasswordDailyRequestStore = forgotPasswordDailyRequestStore;

const isSameCalendarDay = (firstTimestamp: number, secondTimestamp: number) => {
    const firstDate = new Date(firstTimestamp);
    const secondDate = new Date(secondTimestamp);

    return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
    );
};

export const generateForgotPasswordOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateForgotPasswordToken = () =>
    randomBytes(24)
        .toString("hex")
        .slice(0, 48);

export const saveForgotPasswordOtp = (key: string, userId: string, options?: { otp?: string }) => {
    const otp = options?.otp ?? generateForgotPasswordOtp();
    const resetToken = generateForgotPasswordToken();
    const requestedAt = Date.now();

    forgotPasswordOtpStore.set(key, {
        userId,
        otp,
        expiresAt: requestedAt + OTP_TTL_MS,
        resetToken,
        identifier: key,
        requestedAt,
    });

    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS), resetToken };
};

export const canRequestForgotPasswordOtp = (key: string) => {
    const firstRequestedAt = forgotPasswordDailyRequestStore.get(key);
    if (!firstRequestedAt) return { success: true as const };

    const now = Date.now();
    if (isSameCalendarDay(firstRequestedAt, now)) {
        return { success: false as const, message: "You can use this option only one time per day." };
    }

    forgotPasswordDailyRequestStore.delete(key);
    return { success: true as const };
};

export const recordForgotPasswordDailyRequest = (key: string) => {
    const existing = forgotPasswordDailyRequestStore.get(key);
    if (existing && isSameCalendarDay(existing, Date.now())) return;
    forgotPasswordDailyRequestStore.set(key, Date.now());
};

export const getForgotPasswordDailyRequestAt = (key: string) => forgotPasswordDailyRequestStore.get(key);

export const removeForgotPasswordOtp = (key: string) => {
    forgotPasswordOtpStore.delete(key);
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
