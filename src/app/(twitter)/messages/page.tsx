"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BsEnvelopePlus } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

import NothingToShow from "@/components/misc/NothingToShow";
import NewMessageDialog from "@/components/dialog/NewMessageDialog";
import { AuthContext } from "@/context/AuthContext";
import CircularLoading from "@/components/misc/CircularLoading";
import { getUserMessages } from "@/utilities/fetch";
import Conversation from "@/components/message/Conversation";
import { ConversationResponse, MessageProps } from "@/types/MessageProps";
import Messages from "@/components/message/Messages";

export default function MessagesPage() {
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [isConversationSelected, setIsConversationSelected] = useState({
        selected: false,
        messages: [] as MessageProps[],
        messagedUsername: "",
    });
    const autoOpenedRecipientRef = useRef<string>("");

    const { token, isPending } = useContext(AuthContext);
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const recipient = searchParams.get("recipient") || "";

    const { isLoading, data, isFetched } = useQuery({
        queryKey: ["messages", token && token.username],
        queryFn: () => token && getUserMessages(token.username),
        enabled: !!token,
    });

    const handleNewMessageClose = () => {
        setIsNewMessageOpen(false);
    };

    const handleConversations = (isSelected: boolean, messages: MessageProps[] = [], messagedUsername: string = "") => {
        setIsConversationSelected({ selected: isSelected, messages, messagedUsername });
    };

    const handleStartConversation = (recipient: string) => {
        const existingConversation = data.formattedConversations.find((conversation: ConversationResponse) =>
            conversation.participants.includes(recipient)
        );

        if (existingConversation) {
            handleConversations(true, existingConversation.messages, recipient);
            return;
        }

        handleConversations(true, [], recipient);
    };

    useEffect(() => {
        if (!recipient || !data?.formattedConversations) return;
        if (autoOpenedRecipientRef.current === recipient) return;

        const existingConversation = data.formattedConversations.find((conversation: ConversationResponse) =>
            conversation.participants.includes(recipient)
        );

        if (existingConversation) {
            handleConversations(true, existingConversation.messages, recipient);
        } else {
            handleConversations(true, [], recipient);
        }

        autoOpenedRecipientRef.current = recipient;
    }, [recipient, data, handleConversations]);

    useEffect(() => {
        if (!recipient) {
            autoOpenedRecipientRef.current = "";
        }
    }, [recipient]);

    if (isPending || !token || isLoading) return <CircularLoading />;

    const conversations = data.formattedConversations;

    return (
        <main className="messages-page">
            {isConversationSelected.selected ? (
                <Messages
                    selectedMessages={isConversationSelected.messages}
                    messagedUsername={isConversationSelected.messagedUsername}
                    handleConversations={handleConversations}
                    token={token}
                />
            ) : (
                <>
                    <h1 className="page-name">
                        {t("messages.title")}
                        <button
                            onClick={() => setIsNewMessageOpen(true)}
                            className="btn btn-white icon-hoverable new-message"
                        >
                            <BsEnvelopePlus />
                        </button>
                    </h1>
                    {isFetched && !(conversations.length > 0) && <NothingToShow />}
                    <div>
                        {conversations.map((conversation: ConversationResponse) => {
                            return (
                                <Conversation
                                    key={conversation.participants.join("+")}
                                    conversation={conversation}
                                    token={token}
                                    handleConversations={handleConversations}
                                />
                            );
                        })}
                    </div>
                </>
            )}
            <NewMessageDialog
                handleNewMessageClose={handleNewMessageClose}
                open={isNewMessageOpen}
                token={token}
                onSelectRecipient={handleStartConversation}
            />
        </main>
    );
}
