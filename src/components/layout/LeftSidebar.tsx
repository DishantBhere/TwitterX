"use client";

import Link from "next/link";
import { useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Menu, MenuItem } from "@mui/material";
import {
    RiTwitterXFill,
    RiHome5Line,
    RiHashtag,
    RiNotification3Line,
    RiMailLine,
    RiUser3Line,
    RiSettings5Line,
    RiEdit2Line,
    RiLogoutBoxRLine,
} from "react-icons/ri";
import { FaEllipsisH } from "react-icons/fa";
import { AiFillTwitterCircle } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import NewTweetDialog from "../dialog/NewTweetDialog";
import LogOutDialog from "../dialog/LogOutDialog";
import { logout } from "@/utilities/fetch";
import { AuthContext } from "@/context/AuthContext";
import { getFullURL } from "@/utilities/misc/getFullURL";
import UnreadNotificationsBadge from "../misc/UnreadNotificationsBadge";

export default function LeftSidebar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isNewTweetOpen, setIsNewTweetOpen] = useState(false);
    const [isLogOutOpen, setIsLogOutOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { token } = useContext(AuthContext);
    const { t } = useTranslation();

    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        router.push("/");
    };

    const handleAnchorClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handleAnchorClose = () => {
        setAnchorEl(null);
    };
    const handleNewTweetClick = () => {
        setIsNewTweetOpen(true);
    };
    const handleNewTweetClose = () => {
        setIsNewTweetOpen(false);
    };
    const handleLogOutClick = () => {
        handleAnchorClose();
        setIsLogOutOpen(true);
    };
    const handleLogOutClose = () => {
        setIsLogOutOpen(false);
    };

    return (
        <>
            <aside className="left-sidebar">
                <div className="fixed">
                    <div className="sidebar-content">
                        <Link href="/explore" className="twitter-icon">
                            <RiTwitterXFill aria-hidden="true" focusable="false" />
                        </Link>
                        <nav>
                            <ul>
                                {token && (
                                    <li>
                                        <Link href="/home">
                                            <div className={`nav-link ${pathname.startsWith("/home") ? "active" : ""}`}>
                                                <RiHome5Line /> <span className="nav-title">{t("nav.home")}</span>
                                            </div>
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link href="/explore">
                                        <div className={`nav-link ${pathname.startsWith("/explore") ? "active" : ""}`}>
                                            <RiHashtag /> <span className="nav-title">{t("nav.explore")}</span>
                                        </div>
                                    </Link>
                                </li>
                                {token && (
                                    <>
                                        <li>
                                            <Link href="/notifications">
                                                <div
                                                    className={`nav-link ${
                                                        pathname.startsWith("/notifications") ? "active" : ""
                                                    }`}
                                                >
                                                    <div className="badge-wrapper">
                                                        <RiNotification3Line /> <UnreadNotificationsBadge />
                                                    </div>
                                                    <span className="nav-title">{t("nav.notifications")}</span>
                                                </div>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/messages">
                                                <div className={`nav-link ${pathname.startsWith("/messages") ? "active" : ""}`}>
                                                    <RiMailLine /> <span className="nav-title">{t("nav.messages")}</span>
                                                </div>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={`/${token.username}`}>
                                                <div
                                                    className={`nav-link ${
                                                        pathname.startsWith(`/${token.username}`) ? "active" : ""
                                                    }`}
                                                >
                                                    <RiUser3Line /> <span className="nav-title">{t("nav.profile")}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                <li>
                                    <Link href="/settings">
                                        <div className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`}>
                                            <RiSettings5Line /> <span className="nav-title">{t("nav.settings")}</span>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        {token && (
                            <>
                                <button onClick={handleNewTweetClick} className="btn btn-tweet">
                                    {t("actions.tweet")}
                                </button>
                                <button onClick={handleAnchorClick} className="side-profile">
                                    <div>
                                        <Avatar
                                            className="avatar"
                                            alt=""
                                            src={token.photoUrl ? getFullURL(token.photoUrl) : "/assets/egg.jpg"}
                                        />
                                    </div>
                                    <div>
                                        <div className="token-name">
                                            {token.name !== "" ? token.name : token.username}
                                            {token.isPremium && (
                                                <span className="blue-tick" data-blue="Verified Blue">
                                                    <AiFillTwitterCircle />
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted token-username">@{token.username}</div>
                                    </div>
                                    <div className="three-dots">
                                        <FaEllipsisH />
                                    </div>
                                </button>
                                <Menu
                                    anchorEl={anchorEl}
                                    onClose={handleAnchorClose}
                                    open={Boolean(anchorEl)}
                                    classes={{ paper: "profile-menu-paper", list: "profile-menu-list" }}
                                    MenuListProps={{ disablePadding: true }}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                >
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}>
                                        <Link className="profile-menu-link" href={`/${token.username}`}>
                                            <RiUser3Line />
                                            <span>{t("nav.profile")}</span>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}>
                                        <Link className="profile-menu-link" href={`/${token.username}/edit`}>
                                            <RiEdit2Line />
                                            <span>{t("nav.editProfile")}</span>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem className="profile-menu-item" onClick={handleAnchorClose}>
                                        <Link className="profile-menu-link" href="/settings">
                                            <RiSettings5Line />
                                            <span>{t("nav.settings")}</span>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem className="profile-menu-item logout" onClick={handleLogOutClick}>
                                        <RiLogoutBoxRLine />
                                        <span>{t("nav.logout")}</span>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </div>
                </div>
            </aside>
            {token && (
                <>
                    <NewTweetDialog open={isNewTweetOpen} handleNewTweetClose={handleNewTweetClose} token={token} />
                    <LogOutDialog
                        open={isLogOutOpen}
                        handleLogOutClose={handleLogOutClose}
                        logout={handleLogout}
                        isLoggingOut={isLoggingOut}
                    />
                </>
            )}
        </>
    );
}
