"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Avatar, Box, Button, IconButton, Stack, Typography } from "@mui/material";
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

                <div className="reminder todays-news-widget" style={{ position: "relative" }}>
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
                    <Stack className="todays-news-list" spacing={0}>
                        {NEWS_ITEMS.map((item, index) => (
                            <Box key={item.title} className="news-item">
                                <Avatar
                                    src={`https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=120&q=60&sig=${index}`}
                                    alt=""
                                    className="news-thumb"
                                />
                                <Box className="news-copy">
                                    <Typography className="news-kicker">{item.category} · Trending</Typography>
                                    <Typography className="news-headline">{item.title}</Typography>
                                    <Typography component="p" className="news-meta text-muted">
                                        {item.time} <span className="middle-dot">·</span> {item.category}{" "}
                                        <span className="middle-dot">·</span> {item.posts} posts
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </div>

                <div className="reminder football-widget">
                    <h1>Football</h1>
                    <Stack className="football-list" spacing={0}>
                        <Box className="football-match football-match-group">
                            <Box className="football-teams">
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇦🇷
                                    </span>
                                    <Typography className="team-name">Argentina</Typography>
                                </Box>
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇨🇻
                                    </span>
                                    <Typography className="team-name">Cape Verde</Typography>
                                </Box>
                            </Box>
                            <Box className="football-meta">
                                <Typography className="football-status">FT</Typography>
                                <Typography className="football-score">2-0</Typography>
                            </Box>
                        </Box>
                        <Box className="football-match">
                            <Box className="football-teams">
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇧🇷
                                    </span>
                                    <Typography className="team-name">Brazil</Typography>
                                </Box>
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇫🇷
                                    </span>
                                    <Typography className="team-name">France</Typography>
                                </Box>
                            </Box>
                            <Box className="football-meta">
                                <Typography className="football-status">Tomorrow</Typography>
                                <Typography className="football-score">8:30 PM</Typography>
                            </Box>
                        </Box>
                        <Box className="football-match">
                            <Box className="football-teams">
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇪🇸
                                    </span>
                                    <Typography className="team-name">Spain</Typography>
                                </Box>
                                <Box className="football-team">
                                    <span className="team-flag" aria-hidden="true">
                                        🇵🇹
                                    </span>
                                    <Typography className="team-name">Portugal</Typography>
                                </Box>
                            </Box>
                            <Box className="football-meta">
                                <Typography className="football-status">Tomorrow</Typography>
                                <Typography className="football-score">11:00 PM</Typography>
                            </Box>
                        </Box>
                    </Stack>
                    <Button className="football-more-btn" variant="text">
                        Show more
                    </Button>
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
