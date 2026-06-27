type PendingLoginOtp = {
    otp: string;
    userId: string;
    expiresAt: number;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const globalForLoginOtp = globalThis as typeof globalThis & {
    loginOtpStore?: Map<string, PendingLoginOtp>;
};

const loginOtpStore = globalForLoginOtp.loginOtpStore ?? new Map<string, PendingLoginOtp>();
globalForLoginOtp.loginOtpStore = loginOtpStore;

export const generateLoginOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const saveLoginOtp = (payload: {
    userId: string;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
}) => {
    const otp = generateLoginOtp();
    loginOtpStore.set(payload.userId, {
        otp,
        userId: payload.userId,
        expiresAt: Date.now() + OTP_TTL_MS,
        browser: payload.browser,
        operatingSystem: payload.operatingSystem,
        deviceType: payload.deviceType,
        ipAddress: payload.ipAddress,
    });

    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
};

export const verifyLoginOtp = (userId: string, otp: string) => {
    const pending = loginOtpStore.get(userId);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        loginOtpStore.delete(userId);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.otp !== otp) return { success: false, message: "Incorrect OTP. Please try again." };

    loginOtpStore.delete(userId);
    return { success: true as const, pending };
};

export type VerifiedLoginOtp = {
    userId: string;
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
};
