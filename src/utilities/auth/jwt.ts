import { SignJWT } from "jose";

import { getJwtSecretKey } from ".";

type JwtUser = {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    description: string | null;
    location: string | null;
    website: string | null;
    isPremium: boolean;
    browserNotificationsEnabled: boolean;
    preferredLanguage: string;
    createdAt: Date;
    photoUrl: string | null;
    headerUrl: string | null;
};

export const createUserToken = async (user: JwtUser) => {
    return new SignJWT({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        name: user.name,
        description: user.description,
        location: user.location,
        website: user.website,
        isPremium: user.isPremium,
        browserNotificationsEnabled: user.browserNotificationsEnabled,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
        photoUrl: user.photoUrl,
        headerUrl: user.headerUrl,
    })
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(getJwtSecretKey());
};
