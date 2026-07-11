import React, { useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, Menu, MenuItem, Popover, Tooltip, useTheme } from "@mui/material";
import { FaTrashAlt } from "react-icons/fa";
import { RxDotsHorizontal } from "react-icons/rx";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getFullURL } from "@/utilities/misc/getFullURL";
import { formatDate, formatDateExtended } from "@/utilities/date";
import ProfileCard from "../user/ProfileCard";
import { ConversationProps } from "@/types/MessageProps";
import CircularLoading from "../misc/CircularLoading";
import { deleteConversation } from "@/utilities/fetch";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";

export default function Conversation({ conversation, token, handleConversations }: ConversationProps) {
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorMenuEl, setAnchorMenuEl] = useState<HTMLElement | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const pendingConfirmationOpenRef = useRef<number | null>(null);
    const { t } = useTranslation();
    const theme = useTheme();

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (tokenOwnerId: string) => deleteConversation(conversation.participants, tokenOwnerId),
        onError: () => {
            setSnackbar({
                message: t("messages.deleteConversationFailed"),
                severity: "error",
                open: true,
            });
        },
    });

    const messagedUsername = conversation.participants.find((user: string) => user !== token.username);

    const { name, username, photoUrl, isPremium } =
        conversation.messages[conversation.messages.length - 1].recipient.username === messagedUsername
            ? conversation.messages[conversation.messages.length - 1].recipient
            : conversation.messages[conversation.messages.length - 1].sender;

    const lastMessage = conversation.messages[conversation.messages.length - 1];

    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };
    const handleConversationClick = () => {
        handleConversations(true, conversation.messages, messagedUsername);
    };
    const handleConfirmationClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pendingConfirmationOpenRef.current !== null) {
            window.cancelAnimationFrame(pendingConfirmationOpenRef.current);
            pendingConfirmationOpenRef.current = null;
        }

        setAnchorMenuEl(null);
        pendingConfirmationOpenRef.current = window.requestAnimationFrame(() => {
            setIsConfirmationOpen(true);
            pendingConfirmationOpenRef.current = null;
        });
    };
    const handleThreeDotsClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchorMenuEl(e.currentTarget);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handlePopoverClose();
        setIsDeleting(true);
        try {
            const jsonId = JSON.stringify(token.id);
            await mutation.mutateAsync(jsonId);
            setIsConfirmationOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["messages", token.username] });
        } catch (error) {
            console.log(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmationClose = () => {
        if (!isDeleting) {
            setIsConfirmationOpen(false);
        }
    };

    return (
        <div className="conversation" onClick={handleConversationClick}>
            <Link href={`/${username}`} onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose}>
                <Avatar
                    className="avatar"
                    sx={{ width: 50, height: 50 }}
                    alt=""
                    src={photoUrl ? getFullURL(photoUrl) : "/assets/egg.jpg"}
                />
            </Link>
            <div className="user-wrapper">
                <section className="user-section">
                    <Link
                        className="user-name-link"
                        href={`/${username}`}
                        onMouseEnter={handlePopoverOpen}
                        onMouseLeave={handlePopoverClose}
                    >
                        <span className="user-name">
                            {name !== "" ? name : username}
                            {isPremium && (
                                <span className="blue-tick" data-blue="Verified Blue">
                                    <img className="premium-badge" src="/icons/twitter-verified.svg" alt="" aria-hidden="true" />
                                </span>
                            )}
                        </span>
                        <span className="text-muted">@{username}</span>
                    </Link>
                    <Tooltip title={formatDateExtended(lastMessage.createdAt)} placement="top">
                        <span className="text-muted date">
                            <span className="middle-dot">·</span>
                            {formatDate(lastMessage.createdAt)}
                        </span>
                    </Tooltip>
                </section>
                <div className="last-message text-muted">{lastMessage.text}</div>
            </div>
            <>
                <button type="button" className="three-dots icon-hoverable" onClick={handleThreeDotsClick}>
                    <RxDotsHorizontal />
                </button>
                <Menu anchorEl={anchorMenuEl} onClose={() => setAnchorMenuEl(null)} open={Boolean(anchorMenuEl)} transitionDuration={0}>
                    <MenuItem onClick={handleConfirmationClick} className="delete">
                        {t("actions.delete")}
                    </MenuItem>
                </Menu>
            </>
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
                <ProfileCard username={username} token={token} />
                </Popover>
            <Dialog
                className="dialog delete-conversation-dialog"
                open={isConfirmationOpen}
                onClose={handleConfirmationClose}
                fullWidth
                maxWidth={false}
                TransitionProps={{ appear: true }}
                PaperProps={{
                    sx: {
                        width: { xs: "calc(100vw - 32px)", sm: 500 },
                        maxWidth: { xs: 420, sm: 500 },
                        borderRadius: "20px",
                        border: theme.palette.mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,20,25,0.08)",
                        backgroundColor: theme.palette.mode === "dark" ? "#16181C" : "#fff",
                        boxShadow:
                            theme.palette.mode === "dark"
                                ? "0 20px 60px rgba(0,0,0,0.45)"
                                : "0 18px 50px rgba(15,20,25,0.12)",
                        px: 0,
                        overflow: "hidden",
                    },
                }}
            >
                <DialogContent
                    sx={{
                        pt: 4,
                        pb: 2.5,
                        px: { xs: 3, sm: 4 },
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                                theme.palette.mode === "dark" ? "rgba(244, 33, 46, 0.14)" : "rgba(244, 33, 46, 0.1)",
                            color: "#f4212e",
                            flexShrink: 0,
                        }}
                    >
                        <FaTrashAlt size={24} />
                    </div>
                    <DialogTitle
                        sx={{
                            p: 0,
                            fontSize: "28px",
                            lineHeight: 1.15,
                            fontWeight: 800,
                            color: theme.palette.mode === "dark" ? "#E7E9EA" : "#0F1419",
                        }}
                    >
                        {t("messages.deleteConversationTitle")}
                    </DialogTitle>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            lineHeight: 1.6,
                            color: theme.palette.mode === "dark" ? "#71767B" : "#536471",
                            maxWidth: 380,
                        }}
                    >
                        {t("messages.deleteConversationDescription")}
                    </p>
                    {isDeleting && <CircularLoading />}
                </DialogContent>
                <DialogActions
                    sx={{
                        px: { xs: 3, sm: 4 },
                        pb: 4,
                        gap: 1.5,
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "stretch",
                        "& > *": {
                            width: "100%",
                        },
                        "@media (min-width:420px)": {
                            flexDirection: "row",
                            "& > *": {
                                width: "50%",
                            },
                        },
                    }}
                >
                    <Button
                        type="button"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        fullWidth
                        sx={{
                            minHeight: 44,
                            borderRadius: 999,
                            backgroundColor: "#f4212e",
                            color: "#fff",
                            textTransform: "none",
                            fontWeight: 700,
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#e61d2b",
                                boxShadow: "none",
                            },
                            "&.Mui-disabled": {
                                color: "rgba(255,255,255,0.8)",
                            },
                        }}
                    >
                        {isDeleting ? t("messages.deleteConversationDeleting") : t("actions.delete")}
                    </Button>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isDeleting) {
                                setIsConfirmationOpen(false);
                            }
                        }}
                        disabled={isDeleting}
                        fullWidth
                        sx={{
                            minHeight: 44,
                            borderRadius: 999,
                            borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(15,20,25,0.18)",
                            color: theme.palette.mode === "dark" ? "#E7E9EA" : "#0F1419",
                            textTransform: "none",
                            fontWeight: 700,
                            "&:hover": {
                                borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(15,20,25,0.3)",
                                backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(15,20,25,0.04)",
                            },
                        }}
                    >
                        {t("actions.cancel")}
                    </Button>
                </DialogActions>
            </Dialog>
            {snackbar.open && <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />}
        </div>
    );
}
