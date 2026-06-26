import { SupportedLanguage } from ".";

type PendingLanguageOtp = {
    otp: string;
    language: SupportedLanguage;
    expiresAt: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const globalForLanguageOtp = globalThis as typeof globalThis & {
    languageOtpStore?: Map<string, PendingLanguageOtp>;
};

const languageOtpStore = globalForLanguageOtp.languageOtpStore ?? new Map<string, PendingLanguageOtp>();
globalForLanguageOtp.languageOtpStore = languageOtpStore;

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const saveLanguageOtp = (userId: string, language: SupportedLanguage) => {
    const otp = generateOtp();
    languageOtpStore.set(userId, {
        otp,
        language,
        expiresAt: Date.now() + OTP_TTL_MS,
    });
    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
};

export const verifyLanguageOtp = (userId: string, otp: string, language: SupportedLanguage) => {
    const pending = languageOtpStore.get(userId);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        languageOtpStore.delete(userId);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.language !== language) return { success: false, message: "The pending language does not match." };
    if (pending.otp !== otp) return { success: false, message: "Incorrect OTP. Please try again." };
    languageOtpStore.delete(userId);
    return { success: true };
};
