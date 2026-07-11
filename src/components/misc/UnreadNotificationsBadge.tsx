import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useContext } from "react";

import { AuthContext } from "@/context/AuthContext";
import { getNotifications } from "@/utilities/fetch";
import { NotificationProps } from "@/types/NotificationProps";

export default function UnreadNotificationsBadge() {
    const { token } = useContext(AuthContext);
    const { data } = useQuery(["notifications", token?.id], getNotifications, { enabled: !!token });

    const lengthOfUnreadNotifications =
        data?.notifications?.filter((notification: NotificationProps) => !notification.isRead)?.length ?? 0;

    const animationVariants = {
        initial: { opacity: 0, scale: 0 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0 },
    };

    return (
        <>
            {lengthOfUnreadNotifications > 0 && (
                <motion.span className="badge" variants={animationVariants} initial="initial" animate="animate" exit="exit">
                    {lengthOfUnreadNotifications}
                </motion.span>
            )}
        </>
    );
}
