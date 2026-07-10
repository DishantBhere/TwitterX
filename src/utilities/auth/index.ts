const verifyTokenFromServer = async (token: string, origin?: string) => {
    const response = await fetch(origin ? new URL("/api/auth/verify", origin) : "/api/auth/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(token),
    });
    return response.json();
};

export const getJwtSecretKey = () => {
    const key = process.env.JWT_SECRET_KEY;
    if (!key) throw new Error("No JWT secret key");
    return new TextEncoder().encode(key);
};

export const verifyJwtToken = async (token: string, origin?: string) => {
    const response = await verifyTokenFromServer(token, origin);
    if (!response) return null;
    return response;
};
