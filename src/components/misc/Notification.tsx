"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { FaHeart, FaRegComment, FaRegEnvelope, FaRegClock } from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";
import { RiChatFollowUpLine } from "react-icons/ri";
import { Avatar, Popover } from "@mui/material";

import { NotificationProps } from "@/types/NotificationProps";
import { getFullURL } from "@/utilities/misc/getFullURL";
import RetweetIcon from "./RetweetIcon";
import ProfileCard from "../user/ProfileCard";
import { UserProps } from "@/types/UserProps";

export default function Notification({ notification, token }: { notification: NotificationProps; token: UserProps }) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const content = JSON.parse(notification.content);
    const createdAt = new Date(notification.createdAt);
    const formattedTime = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(createdAt);

    const tweetUrl = `/${notification.user.username}/tweets/${content?.content?.id}`;
    const profileUrl = `/${content?.sender.username}`;

    const iconColors: Record<string, { bg: string; fg: string }> = {
        message: { bg: "rgba(29,155,240,0.14)", fg: "#1d9bf0" },
        follow: { bg: "rgba(29,155,240,0.14)", fg: "#1d9bf0" },
        like: { bg: "rgba(249,24,128,0.14)", fg: "#f91880" },
        reply: { bg: "rgba(255,173,31,0.14)", fg: "#ffad1f" },
        retweet: { bg: "rgba(0,186,124,0.14)", fg: "#00ba7c" },
        welcome: { bg: "rgba(29,155,240,0.14)", fg: "#1d9bf0" },
    };

    const currentIconColor = iconColors[notification.type] ?? iconColors.welcome;

    const senderName = content?.sender.name !== "" ? content?.sender.name : content?.sender.username;

    const popoverJSX = (
        <Popover
            sx={{
                pointerEvents: "none",
            }}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: "top",
                horizontal: "center",
            }}
            transformOrigin={{
                vertical: "bottom",
                horizontal: "center",
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
        >
            <ProfileCard username={content?.sender.username} token={token} />
        </Popover>
    );

    const sharedJSX = (
        <div className="notification-sender" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Link
                href={profileUrl}
                className="avatar-wrapper"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, textDecoration: "none" }}
            >
                <Avatar
                    sx={{ width: 42, height: 42, flexShrink: 0, border: "2px solid rgba(255,255,255,0.08)" }}
                    alt=""
                    src={content?.sender.photoUrl ? getFullURL(content?.sender.photoUrl) : "/assets/egg.jpg"}
                />
                <div className="profile-info-main" style={{ minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 15, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {senderName} <span className="text-muted">(@{content?.sender.username})</span>
                    </h1>
                </div>
            </Link>
            {popoverJSX}
        </div>
    );

    const cardStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr)",
        gap: 14,
        alignItems: "start",
        padding: "16px 18px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "transform 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
    };

    if (notification.type === "message") {
        return (
            <div className="notification" style={cardStyle}>
                <div className="icon-div message" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <FaRegEnvelope />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }}>
                                <span className={!notification.isRead ? "bold" : ""}>Sent you a direct message.</span>{" "}
                                <Link className={`notification-link ${!notification.isRead ? "bold" : ""}`} href="/messages">
                                    Check it out!
                                </Link>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (notification.type === "follow") {
        return (
            <div className="notification" style={cardStyle}>
                <div className="icon-div follow" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <RiChatFollowUpLine />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }}>
                                <span className={!notification.isRead ? "bold" : ""}>
                                    Started following you. Stay connected and discover their updates!
                                </span>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (notification.type === "like") {
        return (
            <div className="notification" style={cardStyle}>
                <div className="icon-div like" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <FaHeart />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }}>
                                <span className={!notification.isRead ? "bold" : ""}>Liked your</span>{" "}
                                <Link className={`notification-link ${!notification.isRead ? "bold" : ""}`} href={tweetUrl}>
                                    tweet.
                                </Link>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (notification.type === "reply") {
        return (
            <div className="notification " style={cardStyle}>
                <div className="icon-div reply" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <FaRegComment />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }}>
                                <span className={!notification.isRead ? "bold" : ""}>Replied to your</span>{" "}
                                <Link className={`notification-link ${!notification.isRead ? "bold" : ""}`} href={tweetUrl}>
                                    tweet.
                                </Link>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (notification.type === "retweet") {
        return (
            <div className="notification" style={cardStyle}>
                <div className="icon-div retweet" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <RetweetIcon />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }}>
                                <span className={!notification.isRead ? "bold" : ""}>Retweeted your</span>{" "}
                                <Link className={`notification-link ${!notification.isRead ? "bold" : ""}`} href={tweetUrl}>
                                    tweet.
                                </Link>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="notification" style={cardStyle}>
                <div className="icon-div welcome" style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: currentIconColor.bg, color: currentIconColor.fg, fontSize: 18 }}>
                    <GiPartyPopper />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                            {sharedJSX}
                            <div style={{ marginTop: 8, color: "#e7e9ea", lineHeight: 1.5 }} className={!notification.isRead ? "bold" : ""}>
                                Welcome to the Twitter! Start exploring and sharing your thoughts with the world.
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#71767b", fontSize: 12, flexShrink: 0 }}>
                            <FaRegClock size={12} />
                            <span>{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
