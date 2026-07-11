import { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { Avatar } from "@mui/material";

import Message from "./Message";
import NewMessageBox from "./NewMessageBox";
import { MessageProps, MessagesProps } from "@/types/MessageProps";
import { getFullURL } from "@/utilities/misc/getFullURL";

export default function Messages({ selectedMessages, messagedUsername, handleConversations, token }: MessagesProps) {
    const [freshMessages, setFreshMessages] = useState([] as MessageProps[]);

    const messagesWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFreshMessages(selectedMessages);
    }, [selectedMessages]);

    const latestMessage = selectedMessages[selectedMessages.length - 1];
    const conversationUser =
        latestMessage?.sender.username === token.username ? latestMessage.recipient : latestMessage?.sender;

    useEffect(() => {
        const messagesWrapper = messagesWrapperRef.current;
        messagesWrapper?.scrollTo({
            top: messagesWrapper.scrollHeight,
            behavior: "smooth",
        });
    }, [freshMessages]);

    return (
        <main className="messages-container">
            <div className="back-to messages-header">
                <button className="icon-hoverable btn btn-white" onClick={() => handleConversations(false)}>
                    <FaArrowLeft />
                </button>
                <Link className="messages-user" href={`/${messagedUsername}`}>
                    <Avatar
                        className="avatar"
                        sx={{ width: 42, height: 42 }}
                        alt=""
                        src={conversationUser?.photoUrl ? getFullURL(conversationUser.photoUrl) : "/assets/egg.jpg"}
                    />
                    <div className="messages-user-copy">
                        <span className="messages-display-name">{conversationUser?.name || messagedUsername}</span>
                        <span className="messages-username text-muted">@{messagedUsername}</span>
                    </div>
                </Link>
                <div className="messages-header-spacer" />
                <div className="top">
                    <span className="top-title" aria-hidden="true">
                        {messagedUsername}
                    </span>
                </div>
            </div>
            <div className="messages-wrapper" ref={messagesWrapperRef}>
                {freshMessages.length > 0 &&
                    freshMessages.map((message: MessageProps) => (
                        <Message key={message.id} message={message} messagedUsername={messagedUsername} />
                    ))}
            </div>
            <NewMessageBox
                messagedUsername={messagedUsername}
                token={token}
                setFreshMessages={setFreshMessages}
                freshMessages={freshMessages}
            />
        </main>
    );
}
