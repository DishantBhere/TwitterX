"use client";

import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { FaEllipsisH, FaTimes } from "react-icons/fa";

import { AuthContext } from "@/context/AuthContext";
import Search from "../misc/Search";
import WhoToFollow from "../misc/WhoToFollow";
import CompleteProfileReminder from "../misc/CompleteProfileReminder";
import Legal from "../misc/Legal";

const NEWS_ITEMS = [
    {
        titleKey: "sidebar.news.item1.title",
        time: "6 hours ago",
        category: "Entertainment",
        posts: "4,664",
    },
    {
        titleKey: "sidebar.news.item2.title",
        time: "2 days ago",
        category: "Entertainment",
        posts: "38.6K",
    },
    {
        titleKey: "sidebar.news.item3.title",
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
                    <h1>{t("settings.premium")}</h1>
                    <p>{t("sidebar.subscribePremiumDescription")}</p>
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
                        {t("actions.subscribe")}
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
                    <h1>{t("sidebar.todaysNews")}</h1>
                    <Stack className="todays-news-list" spacing={0}>
                        {NEWS_ITEMS.map((item) => (
                            <Box key={item.titleKey} className="news-item">
                                <Box className="news-copy">
                                    <Typography className="news-kicker">
                                        {t(`sidebar.newsCategories.${item.category.toLowerCase()}`)} ·{" "}
                                        {t("sidebar.trending")}
                                    </Typography>
                                    <Typography className="news-headline">{t(item.titleKey)}</Typography>
                                    <Typography component="p" className="news-meta text-muted">
                                        {item.posts} {t("sidebar.posts")}
                                    </Typography>
                                </Box>
                                <IconButton size="small" className="news-menu" aria-label="More options">
                                    <FaEllipsisH size={14} />
                                </IconButton>
                            </Box>
                        ))}
                    </Stack>
                    <Box component="a" href="#" className="news-show-more">
                        {t("actions.showMore")}
                    </Box>
                </div>

                <div className="reminder football-widget">
                    <h1>{t("sidebar.football")}</h1>
                    <Stack className="football-list" spacing={0}>
                        <Box className="football-match football-match-group">
                            <Box className="football-teams">
                                <Box className="football-team">
                                    <img
                                        src="https://flagcdn.com/ar.svg"
                                        alt="Argentina"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.argentina")}</Typography>
                                </Box>
                                <Box className="football-team">
                                    <img
                                        src="https://flagcdn.com/cv.svg"
                                        alt="Cape Verde"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.capeVerde")}</Typography>
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
                                    <img
                                        src="https://flagcdn.com/br.svg"
                                        alt="Brazil"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.brazil")}</Typography>
                                </Box>
                                <Box className="football-team">
                                    <img
                                        src="https://flagcdn.com/fr.svg"
                                        alt="France"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.france")}</Typography>
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
                                    <img
                                        src="https://flagcdn.com/es.svg"
                                        alt="Spain"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.spain")}</Typography>
                                </Box>
                                <Box className="football-team">
                                    <img
                                        src="https://flagcdn.com/pt.svg"
                                        alt="Portugal"
                                        width={18}
                                        height={18}
                                        className="team-flag"
                                    />
                                    <Typography className="team-name">{t("sidebar.teams.portugal")}</Typography>
                                </Box>
                            </Box>
                            <Box className="football-meta">
                                <Typography className="football-status">Tomorrow</Typography>
                                <Typography className="football-score">11:00 PM</Typography>
                            </Box>
                        </Box>
                    </Stack>
                    <Button className="football-more-btn" variant="text">
                        {t("actions.showMore")}
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
