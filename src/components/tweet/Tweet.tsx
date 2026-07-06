import { Avatar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, Popover, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AiFillTwitterCircle } from "react-icons/ai";
import { RiBarChart2Line, RiBookmarkLine } from "react-icons/ri";
import { RxDotsHorizontal } from "react-icons/rx";

import { TweetProps } from "@/types/TweetProps";
import { formatDate, formatDateExtended } from "@/utilities/date";
import { shimmer } from "@/utilities/misc/shimmer";
import Reply from "./Reply";
import Retweet from "./Retweet";
import Like from "./Like";
import Share from "./Share";
import PreviewDialog from "../dialog/PreviewDialog";
import { getFullURL } from "@/utilities/misc/getFullURL";
import { AuthContext } from "@/context/AuthContext";
import RetweetIcon from "../misc/RetweetIcon";
import ProfileCard from "../user/ProfileCard";
import { deleteTweet } from "@/utilities/fetch";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function Tweet({ tweet }: { tweet: TweetProps }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [hoveredProfile, setHoveredProfile] = useState("");
    const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

    const { token } = useContext(AuthContext);
    const router = useRouter();
    const queryClient = useQueryClient();

    let displayedTweet = tweet;

    if (tweet.isRetweet) {
        displayedTweet = tweet.retweetOf;
    }

    const handleTweetClick = () => {
        router.push(`/${displayedTweet.author.username}/tweets/${displayedTweet.id}`);
    };
    const handlePropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };
    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handlePreviewClick();
    };
    const handlePreviewClick = () => {
        setIsPreviewOpen(true);
    };
    const handlePreviewClose = () => {
        setIsPreviewOpen(false);
    };
    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>, type: "default" | "mention" | "retweet" = "default") => {
        if (type === "mention") {
            setHoveredProfile(displayedTweet.repliedTo.author.username);
        }
        if (type === "retweet") {
            setHoveredProfile(tweet.author.username);
        }
        if (type === "default") {
            setHoveredProfile(displayedTweet.author.username);
        }
        setAnchorEl(e.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };
    const handleDeleteMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsDeleteMenuOpen(true);
        setAnchorEl(e.currentTarget);
    };
    const handleDeleteMenuClose = () => {
        setIsDeleteMenuOpen(false);
        setAnchorEl(null);
    };
    const handleDeleteDialogOpen = () => {
        handleDeleteMenuClose();
        setIsDeleteDialogOpen(true);
    };
    const mutation = useMutation({
        mutationFn: (jsonId: string) => deleteTweet(tweet.id, tweet.author.username, jsonId),
        onSuccess: () => {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setIsDeleted(true);
            setSnackbar({ message: "Tweet deleted.", severity: "success", open: true });
            queryClient.invalidateQueries({ queryKey: ["tweets"] });
        },
        onError: () => {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setIsDeleted(false);
            setSnackbar({ message: "Could not delete tweet. Please try again.", severity: "error", open: true });
        },
    });
    const handleDeleteConfirm = () => {
        if (!token) {
            setSnackbar({ message: "You need to be signed in to delete this tweet.", severity: "info", open: true });
            return;
        }

        setIsDeleting(true);
        setIsDeleteDialogOpen(false);
        setIsDeleted(true);
        mutation.mutate(JSON.stringify(token.id));
    };

    if (isDeleted) {
        return <>{snackbar.open && <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />}</>;
    }

    return (
        <motion.div
            onClick={handleTweetClick}
            className={`tweet x-tweet div-link ${tweet.isRetweet && "retweet"} ${displayedTweet.isReply && "reply"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Link
                onClick={handlePropagation}
                className="tweet-avatar"
                href={`/${displayedTweet.author.username}`}
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
            >
                <Avatar
                    className="avatar x-tweet-avatar"
                    sx={{ width: 40, height: 40 }}
                    alt=""
                    src={displayedTweet.author.photoUrl ? getFullURL(displayedTweet.author.photoUrl) : "/assets/egg.jpg"}
                />
            </Link>
            <div className="tweet-main x-tweet-main">
                <section className="tweet-author-section x-tweet-author-section">
                    {token?.username === tweet.author.username && (
                        <div className="x-tweet-more-wrap">
                            <button type="button" className="x-tweet-more" aria-label="More tweet actions" onClick={handleDeleteMenuOpen}>
                                <RxDotsHorizontal />
                            </button>
                            <Menu anchorEl={anchorEl} open={isDeleteMenuOpen} onClose={handleDeleteMenuClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                                <MenuItem onClick={handleDeleteDialogOpen} sx={{ color: "#f4212e", gap: 1, py: 1.25 }}>
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                        </svg>
                                    </span>
                                    Delete Tweet
                                </MenuItem>
                            </Menu>
                        </div>
                    )}
                    <Link
                        onClick={handlePropagation}
                        className="tweet-author-link"
                        href={`/${displayedTweet.author.username}`}
                        onMouseEnter={handlePopoverOpen}
                        onMouseLeave={handlePopoverClose}
                    >
                        <span className="tweet-author x-tweet-author">
                            {displayedTweet.author.name !== "" ? displayedTweet.author.name : displayedTweet.author.username}
                            {displayedTweet.author.isPremium && (
                                <span className="blue-tick" data-blue="Verified Blue">
                                    <AiFillTwitterCircle />
                                </span>
                            )}
                        </span>
                        <span className="text-muted x-tweet-handle">@{displayedTweet.author.username}</span>
                    </Link>
                    <Tooltip title={formatDateExtended(displayedTweet.createdAt)} placement="top">
                        <span className="text-muted date x-tweet-date">
                            <span className="middle-dot">·</span>
                            {formatDate(displayedTweet.createdAt)}
                        </span>
                    </Tooltip>
                </section>
                <div className="tweet-text x-tweet-text">
                    {displayedTweet.isReply && (
                        <Link
                            onClick={handlePropagation}
                            href={`/${displayedTweet.repliedTo.author.username}`}
                            className="reply-to"
                        >
                            <span
                                className="mention"
                                onMouseEnter={(e) => handlePopoverOpen(e, "mention")}
                                onMouseLeave={handlePopoverClose}
                            >
                                @{displayedTweet.repliedTo.author.username}
                            </span>
                        </Link>
                    )}{" "}
                    {displayedTweet.text}
                </div>
                {displayedTweet.photoUrl && (
                    <div onClick={handlePropagation}>
                        <div className="tweet-image x-tweet-image">
                            <Image
                                onClick={handleImageClick}
                                src={getFullURL(displayedTweet.photoUrl)}
                                alt="tweet image"
                                placeholder="blur"
                                blurDataURL={shimmer(500, 500)}
                                height={500}
                                width={500}
                            />
                        </div>
                        <PreviewDialog
                            open={isPreviewOpen}
                            handlePreviewClose={handlePreviewClose}
                            url={displayedTweet.photoUrl}
                        />
                    </div>
                )}
                {displayedTweet.audioUrl && (
                    <div onClick={handlePropagation} className="tweet-audio x-tweet-audio">
                        <audio controls src={getFullURL(displayedTweet.audioUrl)} />
                    </div>
                )}
                <div onClick={handlePropagation} className="tweet-bottom x-tweet-bottom">
                    <Reply tweet={displayedTweet} />
                    <Retweet tweetId={displayedTweet.id} tweetAuthor={displayedTweet.author.username} />
                    <Like tweetId={displayedTweet.id} tweetAuthor={displayedTweet.author.username} />
                    <button className="icon views x-extra-action" aria-label="Views">
                        <span className="x-icon-circle">
                            <RiBarChart2Line />
                        </span>
                    </button>
                    <button className="icon bookmark x-extra-action" aria-label="Bookmark">
                        <span className="x-icon-circle">
                            <RiBookmarkLine />
                        </span>
                    </button>
                    <Share
                        tweetUrl={`https://${window.location.hostname}/${displayedTweet.author.username}/tweets/${displayedTweet.id}`}
                    />
                </div>
            </div>
            {tweet.isRetweet &&
                (token?.username === tweet.author.username ? (
                    <Link onClick={handlePropagation} href={`/${token?.username}`} className="retweeted-by">
                        <RetweetIcon /> You retweeted.
                    </Link>
                ) : (
                    <Link
                        onClick={handlePropagation}
                        href={`/${tweet.author.username}`}
                        className="retweeted-by"
                        onMouseEnter={(e) => handlePopoverOpen(e, "retweet")}
                        onMouseLeave={handlePopoverClose}
                    >
                        <RetweetIcon /> {`${tweet.author.name ? tweet.author.name : tweet.author.username} retweeted.`}
                    </Link>
                ))}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0.5 }}>Delete post?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: "rgb(83, 100, 113)", fontSize: 15, lineHeight: 1.5 }}>
                        This can’t be undone and it will be removed from your profile, timelines, bookmarks and search results.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <button className="btn btn-white x-delete-cancel" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                    </button>
                    <button className="btn btn-danger x-delete-confirm" onClick={handleDeleteConfirm} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </DialogActions>
            </Dialog>
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
                <ProfileCard username={hoveredProfile} token={token} />
            </Popover>
            <style jsx>{`
                .x-tweet {
                    display: flex;
                    gap: 12px;
                    padding: 14px 16px 12px;
                    border-bottom: 1px solid rgba(15, 20, 25, 0.12);
                    cursor: pointer;
                    transition: background-color 0.16s ease, transform 0.16s ease;
                }
                .x-tweet:hover {
                    background-color: rgba(15, 20, 25, 0.03);
                    transform: translateY(-1px);
                }
                .x-tweet-avatar {
                    flex-shrink: 0;
                }
                .x-tweet-main {
                    flex: 1;
                    min-width: 0;
                }
                .x-tweet-author-section {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-wrap: wrap;
                    line-height: 1.15;
                    margin-top: 1px;
                    position: relative;
                }
                .x-tweet-more-wrap {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                }
                .x-tweet-more {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    color: rgb(83, 100, 113);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background-color 0.15s ease, color 0.15s ease;
                }
                .x-tweet-more:hover {
                    background-color: rgba(29, 155, 240, 0.1);
                    color: rgb(29, 155, 240);
                }
                .x-delete-cancel,
                .x-delete-confirm {
                    min-height: 36px;
                    border-radius: 9999px;
                    padding: 0 16px;
                    font-weight: 700;
                }
                .x-delete-confirm {
                    background-color: #f4212e;
                    color: white;
                }
                .x-delete-confirm:hover {
                    background-color: #e0245e;
                }
                .x-tweet-author {
                    font-weight: 700;
                    font-size: 0.95rem;
                }
                .x-tweet-handle,
                .x-tweet-date {
                    font-weight: 400;
                    font-size: 0.9rem;
                    color: rgb(83, 100, 113);
                }
                .x-tweet-text {
                    margin-top: 2px;
                    font-size: 0.98rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    color: rgb(15, 20, 25);
                }
                .x-tweet-text .mention {
                    font-weight: 600;
                }
                .x-tweet-image {
                    margin-top: 10px;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid rgba(15, 20, 25, 0.08);
                    width: 100%;
                    box-shadow: 0 6px 18px rgba(15, 20, 25, 0.04);
                }
                .x-tweet-audio {
                    margin-top: 10px;
                    padding: 0;
                    display: flex;
                    justify-content: flex-start;
                    max-width: 340px;
                    width: 100%;
                }
                .x-tweet-audio audio {
                    width: 100%;
                    max-width: 340px;
                    height: 36px;
                }
                .x-tweet-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    max-width: 500px;
                    margin-top: 10px;
                    padding-right: 0;
                    gap: 4px;
                }
                .x-tweet .x-action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    color: rgb(83, 100, 113);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    min-height: 36px;
                    min-width: 36px;
                }
                .x-tweet .x-icon-circle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 18px;
                    transition: background-color 150ms ease, color 150ms ease;
                    flex-shrink: 0;
                }
                .x-tweet .x-action-count {
                    font-size: 13px;
                    font-weight: 500;
                    line-height: 1;
                    margin-left: 1px;
                }
                .x-tweet .reply:hover .x-icon-circle {
                    background-color: rgba(29, 155, 240, 0.12);
                    color: rgb(29, 155, 240);
                }
                .x-tweet .reply:hover .x-action-count {
                    color: rgb(29, 155, 240);
                }
                .x-tweet .retweet:hover .x-icon-circle {
                    background-color: rgba(0, 186, 124, 0.12);
                    color: rgb(0, 186, 124);
                }
                .x-tweet .retweet:hover .x-action-count {
                    color: rgb(0, 186, 124);
                }
                .x-tweet .retweet.active .x-icon-circle,
                .x-tweet .retweet.active .x-action-count {
                    color: rgb(0, 186, 124);
                }
                .x-tweet .like:hover .x-icon-circle {
                    background-color: rgba(249, 24, 128, 0.12);
                    color: rgb(249, 24, 128);
                }
                .x-tweet .like:hover .x-action-count {
                    color: rgb(249, 24, 128);
                }
                .x-tweet .like.active .x-icon-circle,
                .x-tweet .like.active .x-action-count {
                    color: rgb(249, 24, 128);
                }
                .x-tweet .share:hover .x-icon-circle,
                .x-tweet .x-extra-action:hover .x-icon-circle {
                    background-color: rgba(29, 155, 240, 0.12);
                    color: rgb(29, 155, 240);
                }
                .x-tweet .x-extra-action {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgb(83, 100, 113);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    min-height: 36px;
                    min-width: 36px;
                }
                .x-tweet .views,
                .x-tweet .bookmark {
                    min-width: 36px;
                }
            `}</style>
        </motion.div>
    );
}
