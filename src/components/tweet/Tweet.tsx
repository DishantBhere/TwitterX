import { Avatar, Popover, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AiFillTwitterCircle } from "react-icons/ai";

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

export default function Tweet({ tweet }: { tweet: TweetProps }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [hoveredProfile, setHoveredProfile] = useState("");

    const { token } = useContext(AuthContext);
    const router = useRouter();

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
                    sx={{ width: 48, height: 48 }}
                    alt=""
                    src={displayedTweet.author.photoUrl ? getFullURL(displayedTweet.author.photoUrl) : "/assets/egg.jpg"}
                />
            </Link>
            <div className="tweet-main x-tweet-main">
                <section className="tweet-author-section x-tweet-author-section">
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
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(239, 243, 244, 0.15);
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                }
                .x-tweet:hover {
                    background-color: rgba(231, 233, 234, 0.06);
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
                }
                .x-tweet-author {
                    font-weight: 700;
                }
                .x-tweet-handle,
                .x-tweet-date {
                    font-weight: 400;
                }
                .x-tweet-text {
                    margin-top: 2px;
                    font-size: 15px;
                    line-height: 20px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .x-tweet-image {
                    margin-top: 10px;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid rgba(239, 243, 244, 0.15);
                }
                .x-tweet-audio {
                    margin-top: 10px;
                    padding: 8px 0;
                }
                .x-tweet-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    max-width: 425px;
                    margin-top: 8px;
                }
            `}</style>
        </motion.div>
    );
}