type PendingSignup = {
    otp: string;
    userData: {
        username: string;
        password: string;
        email: string;
        phone: string;
        name: string | null;
        browserNotificationsEnabled?: boolean;
    };
    expiresAt: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;

const globalForSignupOtp = globalThis as typeof globalThis & {
    signupOtpStore?: Map<string, PendingSignup>;
};

const signupOtpStore = globalForSignupOtp.signupOtpStore ?? new Map<string, PendingSignup>();
globalForSignupOtp.signupOtpStore = signupOtpStore;

export const generateSignupOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const saveSignupOtp = (key: string, userData: PendingSignup["userData"]) => {
    const otp = generateSignupOtp();
    signupOtpStore.set(key, {
        otp,
        userData,
        expiresAt: Date.now() + OTP_TTL_MS,
    });

    return { otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
};

export const verifySignupOtp = (key: string, otp: string) => {
    const pending = signupOtpStore.get(key);
    if (!pending) return { success: false, message: "No pending verification was found." };
    if (pending.expiresAt < Date.now()) {
        signupOtpStore.delete(key);
        return { success: false, message: "The OTP has expired. Please request a new one." };
    }
    if (pending.otp !== otp) return { success: false, message: "Incorrect OTP. Please try again." };

    signupOtpStore.delete(key);
    return { success: true as const, pending };
};
