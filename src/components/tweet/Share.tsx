import { useState } from "react";
import { RiUpload2Line } from "react-icons/ri";

import { SnackbarProps } from "@/types/SnackbarProps";
import CustomSnackbar from "../misc/CustomSnackbar";

export default function Share({ tweetUrl }: { tweetUrl: string }) {
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });

    const handleCopy = () => {
        try {
            navigator.clipboard.writeText(tweetUrl);
            setSnackbar({ message: "Tweet link is copied to the clipboard.", severity: "success", open: true });
        } catch (error) {
            return console.log(error);
        }
    };

    return (
        <>
            <button className="icon share x-action-btn" onClick={handleCopy}>
                <span className="x-icon-circle">
                    <RiUpload2Line />
                </span>
            </button>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
            <style jsx>{`
                .x-action-btn {
                    display: flex;
                    align-items: center;
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
                .share:hover .x-icon-circle {
                    background-color: rgba(29, 155, 240, 0.12);
                    color: rgb(29, 155, 240);
                }
            `}</style>
        </>
    );
}
