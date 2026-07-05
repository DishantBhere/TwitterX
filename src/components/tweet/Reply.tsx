import { FaRegComment } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
                    <FaRegComment />
                </span>
                {tweet.replies.length === 0 ? null : <span className="count x-action-count">{tweet.replies.length}</span>}
            </button>
            <style jsx>{`
                .x-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    color: rgb(113, 118, 123);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                .x-icon-circle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    font-size: 18px;
                    transition: background-color 150ms ease, color 150ms ease;
                }
                .x-action-count {
                    font-size: 13px;
                    transition: color 150ms ease;
                }
                .reply:hover .x-icon-circle {
                    background-color: rgba(29, 155, 240, 0.1);
                    color: rgb(29, 155, 240);
                }
                .reply:hover .x-action-count {
                    color: rgb(29, 155, 240);
                }
            `}</style>
        </>
    );
}