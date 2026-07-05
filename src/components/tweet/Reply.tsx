import { useRouter } from "next/navigation";
import { RiReplyLine } from "react-icons/ri";

import { TweetProps } from "@/types/TweetProps";

export default function Reply({ tweet }: { tweet: TweetProps }) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/${tweet.author.username}/tweets/${tweet.id}`);
    };

    return (
        <>
            <button className="icon reply x-action-btn" onClick={handleClick}>
                <span className="x-icon-circle">
                    <RiReplyLine />
                </span>
                {tweet.replies.length === 0 ? null : <span className="count x-action-count">{tweet.replies.length}</span>}
            </button>
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
                .reply:hover .x-icon-circle {
                    background-color: rgba(29, 155, 240, 0.12);
                    color: rgb(29, 155, 240);
                }
                .reply:hover .x-action-count {
                    color: rgb(29, 155, 240);
                }
            `}</style>
        </>
    );
}
