import { useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import { RiCloseLine, RiTwitterXFill } from "react-icons/ri";

import { NewTweetDialogProps } from "@/types/DialogProps";
import NewTweet from "../tweet/NewTweet";

export default function NewTweetDialog({ open, handleNewTweetClose, token }: NewTweetDialogProps) {
    const [isSubmitted, setIsSubmited] = useState(false);

    const handleSubmit = () => {
        setIsSubmited(!isSubmitted);
    };

    useEffect(() => {
        handleNewTweetClose();
    }, [isSubmitted]);

    return (
        <Dialog
            className="dialog new-tweet-dialog"
            open={open}
            onClose={handleNewTweetClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: "new-tweet-dialog-paper" }}
        >
            <div className="new-tweet-wrapper">
                <div className="composer-modal-header">
                    <div className="composer-modal-header-left">
                        <RiTwitterXFill className="composer-modal-icon" aria-hidden="true" />
                        <span className="composer-modal-label">Post</span>
                    </div>
                    <button type="button" className="composer-modal-close" onClick={handleNewTweetClose} aria-label="Close">
                        <RiCloseLine />
                    </button>
                </div>
                <NewTweet token={token} handleSubmit={handleSubmit} />
            </div>
        </Dialog>
    );
}
