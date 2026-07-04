"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Avatar, Box, Button, Divider, IconButton, Stack, Typography } from "@mui/material";
import { FaTimes } from "react-icons/fa";

import { AuthContext } from "@/context/AuthContext";
import Search from "../misc/Search";
import WhoToFollow from "../misc/WhoToFollow";
import CompleteProfileReminder from "../misc/CompleteProfileReminder";
import Legal from "../misc/Legal";

const NEWS_ITEMS = [
    {
        title: "4K Re-Release of Telugu Film Arya Starring Allu Arjun Scheduled for July 23",
        time: "6 hours ago",
        category: "Entertainment",
        posts: "4,664",
    },
    {
        title: "National Film Awards Announcement Delayed, Fans Keep Waiting",
        time: "2 days ago",
        category: "Entertainment",
        posts: "38.6K",
    },
    {
        title: "Morocco Faces Canada in FIFA World Cup 2026 Round of 16 Match in Houston, Texas",
        time: "5 hours ago",
        category: "Sports",
        posts: "39.3K",
    },
];

export default function RightSidebar() {
    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();

    return (
        <aside className="right-sidebar" style={{ alignSelf: "flex-start" }}>
            <div
                className="fixed"
                style={{
                    position: "sticky",
                    top: "1rem",
                    overflow: "visible",
                }}
            >
                <Search />

                <div className="reminder">
                    <h1>Subscribe to Premium</h1>
                    <p>Get rid of ads, see your analytics, boost your replies and unlock 20+ features.</p>
                    <Button
                        component={Link}
                        href="/settings"
                        variant="contained"
                        disableElevation
                        sx={{
                            alignSelf: "flex-start",
                            backgroundColor: "var(--twitter-blue)",
                            color: "#fff",
                            borderRadius: "9999px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            padding: "0.5rem 1.25rem",
                            "&:hover": {
                                backgroundColor: "var(--twitter-dark-blue)",
                            },
                        }}
                    >
                        Subscribe
                    </Button>
                </div>

                <div className="reminder" style={{ position: "relative" }}>
                    <IconButton
                        size="small"
                        aria-label="dismiss"
                        sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            color: "var(--twitter-muted)",
                            padding: "0.4rem",
                            "&:hover": { backgroundColor: "var(--hover)" },
                        }}
                    >
                        <FaTimes size={14} />
                    </IconButton>
                    <h1>Today&apos;s News</h1>
                    <Stack spacing={1.25}>
                        {NEWS_ITEMS.map((item, index) => (
                            <Box
                                key={item.title}
                                sx={{
                                    display: "flex",
                                    gap: 1.1,
                                    alignItems: "flex-start",
                                }}
                            >
                                <Avatar
                                    src={`https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=96&q=60&sig=${index}`}
                                    alt=""
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        flexShrink: 0,
                                        borderRadius: 2,
                                    }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        sx={{
                                            fontSize: "0.92rem",
                                            fontWeight: 700,
                                            lineHeight: 1.25,
                                            color: "var(--twitter-black)",
                                            mb: 0.35,
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                    <Typography
                                        component="p"
                                        className="text-muted"
                                        sx={{
                                            fontSize: "0.78rem",
                                            lineHeight: 1.35,
                                        }}
                                    >
                                        {item.time} <span className="middle-dot">{"·"}</span> {item.category}{" "}
                                        <span className="middle-dot">{"·"}</span> {item.posts} posts
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </div>

                <div className="reminder">
                    <h1>Football</h1>
                    <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>{"\uD83C\uDDE6\uD83C\uDDF7"}</Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.96rem",
                                        color: "var(--twitter-black)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Argentina
                                </Typography>
                            </Stack>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: "1.45rem",
                                    lineHeight: 1,
                                    color: "var(--twitter-black)",
                                }}
                            >
                                2
                            </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>{"\uD83C\uDDE8\uD83C\uDDFB"}</Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.96rem",
                                        color: "var(--twitter-black)",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Cape Verde
                                </Typography>
                            </Stack>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    fontSize: "1.45rem",
                                    lineHeight: 1,
                                    color: "var(--twitter-black)",
                                }}
                            >
                                0
                            </Typography>
                        </Stack>
                    </Stack>
                    <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.4rem" }}>
                        FT
                    </p>

                    <Divider sx={{ my: 1.5, borderColor: "var(--border-color)" }} />

                    <Stack spacing={1.2}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--twitter-black)" }}>
                                Brazil vs France
                            </Typography>
                            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.1rem" }}>
                                Tomorrow {"·"} 8:30 PM
                            </p>
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--twitter-black)" }}>
                                Spain vs Portugal
                            </Typography>
                            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.1rem" }}>
                                Tomorrow {"·"} 11:00 PM
                            </p>
                        </Box>
                    </Stack>
                </div>

                {token && <WhoToFollow />}
                {token && <CompleteProfileReminder token={token} />}
                {!isPending && !token && (
                    <div className="reminder">
                        <h1>{t("sidebar.dontMiss")}</h1>
                        <p>{t("sidebar.firstToKnow")}</p>
                        <div className="reminder-buttons">
                            <Link href="/" className="btn btn-white">
                                {t("actions.login")}
                            </Link>
                            <Link href="/" className="btn btn-dark">
                                {t("actions.signup")}
                            </Link>
                        </div>
                    </div>
                )}
                <Legal />
            </div>
        </aside>
    );
}
