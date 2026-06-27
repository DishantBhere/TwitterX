import { generateOtp } from "@/utilities/language/otp";

type PendingAudioOtp = {
    otp: string;
    expiresAt: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const globalForAudioOtp = globalThis as typeof globalThis & {
    audioOtpStore?: Map<string, PendingAudioOtp>;
};

const audioOtpStore = globalForAudioOtp.audioOtpStore ?? new Map<string, PendingAudioOtp>();
globalForAudioOtp.audioOtpStore = audioOtpStore;

export const saveAudioOtp = (userId: string) => {
    const otp = generateOtp();
    audioOtpStore.set(userId, {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
    });
    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
};

export const verifyAudioOtp = (userId: string, otp: string) => {
    const pending = audioOtpStore.get(userId);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        audioOtpStore.delete(userId);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.otp !== otp) return { success: false, message: "Incorrect OTP. Please try again." };
    audioOtpStore.delete(userId);
    return { success: true };
};
