import { RiSparkling2Line } from "react-icons/ri";

export default function NothingToShow() {
    return (
        <div className="nothing-to-show" role="status">
            <div className="nothing-icon" aria-hidden="true">
                <RiSparkling2Line />
            </div>
            <h1>Nothing to see here.</h1>
            <p>There is nothing in this timeline yet. Try refreshing or creating a fresh post to get things started.</p>
        </div>
    );
}
