export type SubscriptionPlan = "FREE" | "BRONZE" | "SILVER" | "GOLD";

export type UserProps = {
    id: string;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    description: string;
    location: string;
    website: string;
    isPremium: boolean;
    browserNotificationsEnabled?: boolean;
    preferredLanguage: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionExpiry: Date | null;
    monthlyTweetCount: number;
    createdAt: Date;
    updatedAt: Date;
    photoUrl: string;
    headerUrl: string;
    followers: UserProps[];
    following: UserProps[];
};

export type UserResponse = {
    success: boolean;
    user: UserProps;
};
