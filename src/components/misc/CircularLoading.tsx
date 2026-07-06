import { CircularProgress } from "@mui/material";

export default function CircularLoading() {
    return (
        <div className="loading-wrapper" aria-live="polite">
            <div className="loading-skeleton">
                <div className="loading-skeleton-avatar" />
                <div className="loading-skeleton-content">
                    <div className="loading-skeleton-line short" />
                    <div className="loading-skeleton-line medium" />
                    <div className="loading-skeleton-line" />
                </div>
            </div>
        </div>
    );
}
