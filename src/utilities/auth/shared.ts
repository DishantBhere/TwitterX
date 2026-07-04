export type LoginContext = {
    browser: string;
    operatingSystem: string;
    deviceType: string;
    ipAddress: string;
};

export const detectBrowser = (ua: string) => {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/Firefox\//i.test(ua)) return "Firefox";
    if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return "Chrome";
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Safari";
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
    return "Unknown";
};

export const detectOperatingSystem = (ua: string) => {
    if (/Windows NT/i.test(ua)) return "Windows";
    if (/Android/i.test(ua)) return "Android";
    if (/(iPhone|iPad|iPod)/i.test(ua)) return "iOS";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
};

export const detectDeviceType = (ua: string, operatingSystem: string) => {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) return "Mobile";
    if (operatingSystem === "macOS") return "Laptop";
    return "Desktop";
};

export const getLoginContext = (userAgent: string, forwardedFor: string, requestIp?: string | null): LoginContext => {
    const browser = detectBrowser(userAgent);
    const operatingSystem = detectOperatingSystem(userAgent);
    const deviceType = detectDeviceType(userAgent, operatingSystem);
    const ipAddress = forwardedFor.split(",")[0]?.trim() || requestIp || "unknown";

    return {
        browser,
        operatingSystem,
        deviceType,
        ipAddress,
    };
};

