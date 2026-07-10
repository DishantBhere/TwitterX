"use client";

import { useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getUserTweet } from "@/utilities/fetch";
import SingleTweet from "@/components/tweet/SingleTweet";
import CircularLoading from "@/components/misc/CircularLoading";
import { AuthContext } from "@/context/AuthContext";
import NotFound from "@/app/not-found";
import BackToArrow from "@/components/misc/BackToArrow";

export default function SingleTweetPage({
    params: { username, tweetId },
}: {
    params: { username: string; tweetId: string };
}) {
    const queryKey = ["tweets", username, tweetId];

    const { token, isPending } = useContext(AuthContext);
    const router = useRouter();
    const hasLoadedTweetRef = useRef(false);
    const { isLoading, data, isFetched } = useQuery({
        queryKey: queryKey,
        queryFn: () => getUserTweet(tweetId, username),
    });

    if (data?.tweet) {
        hasLoadedTweetRef.current = true;
    }

    useEffect(() => {
        if (!isLoading && isFetched && hasLoadedTweetRef.current && !data?.tweet) {
            router.replace(`/${username}`);
        }
    }, [data?.tweet, isFetched, isLoading, router, username]);

    if (!isLoading && !data?.tweet) {
        return hasLoadedTweetRef.current ? null : NotFound();
    }

    let backToProps = {
        title: username,
        url: `/${username}`,
    };

    if (isFetched && data.tweet.isReply) {
        backToProps = {
            title: "Tweet",
            url: `/${data.tweet.repliedTo.author.username}/tweets/${data.tweet.repliedTo.id}`,
        };
    }

    return (
        <div>
            {isFetched && <BackToArrow title={backToProps.title} url={backToProps.url} />}
            {isLoading || isPending ? <CircularLoading /> : <SingleTweet tweet={data.tweet} token={token} />}
        </div>
    );
}
