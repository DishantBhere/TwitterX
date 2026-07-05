import { useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RiHeart3Line, RiHeart3Fill } from "react-icons/ri";

import { TweetOptionsProps, TweetResponse } from "@/types/TweetProps";
import { getUserTweet, updateTweetLikes } from "@/utilities/fetch";
import { AuthContext } from "@/context/AuthContext";
import { SnackbarProps } from "@/types/SnackbarProps";
import CustomSnackbar from "../misc/CustomSnackbar";
import { UserProps } from "@/types/UserProps";

export default function Like({ tweetId, tweetAuthor }: TweetOptionsProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

    const { token, isPending } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const queryKey = ["tweets", tweetAuthor, tweetId];

    const { isFetched, data } = useQuery({
        queryKey: queryKey,
        queryFn: () => getUserTweet(tweetId, tweetAuthor),
    });

    const likeMutation = useMutation({
        mutationFn: (tokenOwnerId: string) => updateTweetLikes(tweetId, tweetAuthor, tokenOwnerId, false),
        onMutate: async (tokenOwnerId: string) => {
            setIsButtonDisabled(true);
            await queryClient.cancelQueries({ queryKey: queryKey });
            const previousTweet = queryClient.getQueryData<TweetResponse>(queryKey);
            setIsLiked(true);
            if (previousTweet) {
                queryClient.setQueryData(queryKey, {
                    ...previousTweet,
                    tweet: {
                        ...previousTweet.tweet,
                        likedBy: [...previousTweet.tweet.likedBy, tokenOwnerId],
                    },
                });
            }
            return { previousTweet };
        },
        onError: (err, variables, context) => {
            if (context?.previousTweet) {
                queryClient.setQueryData<TweetResponse>(queryKey, context.previousTweet);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey });
        },
    });

    const unlikeMutation = useMutation({
        mutationFn: (tokenOwnerId) => updateTweetLikes(tweetId, tweetAuthor, tokenOwnerId, true),
        onMutate: async (tokenOwnerId: string) => {
            setIsButtonDisabled(true);
            await queryClient.cancelQueries({ queryKey: queryKey });
            const previous = queryClient.getQueryData<TweetResponse>(queryKey);
            setIsLiked(false);
            if (previous) {
                queryClient.setQueryData(queryKey, {
                    ...previous,
                    tweet: {
                        ...previous.tweet,
                        likedBy: previous.tweet.likedBy.filter(
                            (user: UserProps) => JSON.stringify(user.id) !== tokenOwnerId
                        ),
                    },
                });
            }
            return { previous };
        },
        onError: (err, variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData<TweetResponse>(queryKey, context.previous);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey });
        },
    });

    const handleLike = () => {
        if (!token) {
            return setSnackbar({
                message: "You need to login to like a tweet.",
                severity: "info",
                open: true,
            });
        }

        const tokenOwnerId = JSON.stringify(token.id);
        const likedBy = data.tweet?.likedBy;
        const isLikedByTokenOwner = likedBy.some((user: { id: string }) => JSON.stringify(user.id) === tokenOwnerId);

        if (!likeMutation.isLoading && !unlikeMutation.isLoading) {
            if (isLikedByTokenOwner) {
                unlikeMutation.mutate(tokenOwnerId);
            } else {
                likeMutation.mutate(tokenOwnerId);
            }
        }
    };

    useEffect(() => {
        if (!isPending && isFetched) {
            const tokenOwnerId = JSON.stringify(token?.id);
            const likedBy = data?.tweet?.likedBy;
            const isLikedByTokenOwner = likedBy?.some((user: { id: string }) => JSON.stringify(user.id) === tokenOwnerId);
            setIsLiked(isLikedByTokenOwner);
        }
    }, [isPending, isFetched]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsButtonDisabled(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [isButtonDisabled]);

    return (
        <>
            <motion.button
                className={`icon like x-action-btn ${isLiked ? "active" : ""}`}
                onClick={handleLike}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: isLiked ? [1, 1.5, 1.2, 1] : 1 }}
                transition={{ duration: 0.25 }}
                disabled={isButtonDisabled}
            >
                <span className="x-icon-circle">
                    {isLiked ? (
                        <motion.span animate={{ scale: [1, 1.5, 1.2, 1] }} transition={{ duration: 0.25 }}>
                            <RiHeart3Fill />
                        </motion.span>
                    ) : (
                        <motion.span animate={{ scale: [1, 0.8, 1] }} transition={{ duration: 0.25 }}>
                            <RiHeart3Line />
                        </motion.span>
                    )}
                </span>
                <motion.span animate={{ scale: isLiked ? [0, 1.2, 1] : 0 }} transition={{ duration: 0.25 }} />
                {data?.tweet?.likedBy?.length === 0 ? null : <span className="count x-action-count">{data?.tweet?.likedBy?.length}</span>}
            </motion.button>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
            <style jsx>{`
                .x-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: rgb(113, 118, 123);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    min-height: 34px;
                }
                .x-icon-circle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    font-size: 19px;
                    transition: background-color 150ms ease, color 150ms ease;
                }
                .x-action-count {
                    font-size: 13px;
                    font-weight: 500;
                    transition: color 150ms ease;
                }
                .like:hover .x-icon-circle {
                    background-color: rgba(249, 24, 128, 0.12);
                    color: rgb(249, 24, 128);
                }
                .like:hover .x-action-count {
                    color: rgb(249, 24, 128);
                }
                .like.active .x-icon-circle,
                .like.active .x-action-count {
                    color: rgb(249, 24, 128);
                }
            `}</style>
        </>
    );
}
