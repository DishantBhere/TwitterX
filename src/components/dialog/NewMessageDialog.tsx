import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Dialog, DialogContent, DialogTitle, TextField } from "@mui/material";
import { FaSearch } from "react-icons/fa";

import { NewMessageDialogProps } from "@/types/DialogProps";
import CircularLoading from "../misc/CircularLoading";
import { getUser } from "@/utilities/fetch";
import { getFullURL } from "@/utilities/misc/getFullURL";
import { UserProps } from "@/types/UserProps";

export default function NewMessageDialog({ open, handleNewMessageClose, token, onSelectRecipient }: NewMessageDialogProps) {
    const [search, setSearch] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["new-message-following", token.username],
        queryFn: () => getUser(token.username),
        enabled: open,
    });

    const following = (data?.user?.following || []) as UserProps[];

    const filteredFollowing = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return following;
        return following.filter((user) => user.name.toLowerCase().includes(query) || user.username.toLowerCase().includes(query));
    }, [following, search]);

    const handleSelect = (username: string) => {
        onSelectRecipient?.(username);
        handleNewMessageClose();
    };

    return (
        <Dialog className="dialog new-message-starter-dialog" open={open} onClose={handleNewMessageClose} fullWidth maxWidth="sm">
            <DialogTitle className="title">
                <div className="new-message-starter-title">
                    <span>New message</span>
                    <span className="text-muted">Start a conversation with someone you follow</span>
                </div>
            </DialogTitle>
            <DialogContent className="new-message-starter-content">
                <div className="new-message-search">
                    <FaSearch />
                    <TextField
                        hiddenLabel
                        fullWidth
                        placeholder="Search following"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="new-message-following-list">
                    {isLoading ? (
                        <CircularLoading />
                    ) : filteredFollowing.length > 0 ? (
                        filteredFollowing.map((user) => (
                            <button key={user.id} type="button" className="new-message-user-row" onClick={() => handleSelect(user.username)}>
                                <Avatar className="avatar" sx={{ width: 48, height: 48 }} alt="" src={user.photoUrl ? getFullURL(user.photoUrl) : "/assets/egg.jpg"} />
                                <div className="new-message-user-copy">
                                    <span className="new-message-user-name">{user.name || user.username}</span>
                                    <span className="new-message-user-handle text-muted">@{user.username}</span>
                                </div>
                                <span className="btn btn-dark new-message-user-button">Message</span>
                            </button>
                        ))
                    ) : (
                        <div className="new-message-empty text-muted">No matching accounts found.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
