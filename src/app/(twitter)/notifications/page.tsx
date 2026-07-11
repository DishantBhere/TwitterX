"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AuthContext } from "@/context/AuthContext";
import { getNotifications, markNotificationsRead } from "@/utilities/fetch";
import CircularLoading from "@/components/misc/CircularLoading";
import NothingToShow from "@/components/misc/NothingToShow";
import { NotificationProps } from "@/types/NotificationProps";
import Notification from "@/components/misc/Notification";

export default function NotificationsPage() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();

    const queryClient = useQueryClient();

    const { isLoading, data, isFetched } = useQuery({
        queryKey: ["notifications", token?.id],
        queryFn: getNotifications,
        enabled: !!token,
    });

    const mutation = useMutation({
        mutationFn: markNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
        },
        onError: (error) => console.log(error),
    });

    const handleNotificationsRead = () => {
        mutation.mutate();
    };

    useEffect(() => {
        if (isFetched && data?.notifications?.filter((notification: NotificationProps) => !notification.isRead).length > 0) {
            const countdownForMarkAsRead = setTimeout(() => {
                handleNotificationsRead();
            }, 1000);

            return () => {
                clearTimeout(countdownForMarkAsRead);
            };
        }
    }, []);

    const notifications = data?.notifications ?? [];
    const unreadCount = useMemo(
        () => notifications.filter((notification: NotificationProps) => !notification.isRead).length,
        [notifications]
    );

    if (isPending || !token || isLoading) return <CircularLoading />;

    return (
        <main className="notifications-page">
            <div className="notifications-header">
                <div>
                    <h1 className="page-name">{t("notifications.title")}</h1>
                    <p className="notifications-subtitle">Stay on top of likes, replies, follows, and retweets in one place.</p>
                </div>
                <div className="notifications-badge">{unreadCount} unread</div>
            </div>
            {isFetched && notifications.length === 0 ? (
                <NothingToShow />
            ) : (
                <div className="notifications-wrapper">
                    {notifications.map((notification: NotificationProps) => (
                        <Notification key={notification.id} notification={notification} token={token} />
                    ))}
                </div>
            )}
        </main>
    );
}
