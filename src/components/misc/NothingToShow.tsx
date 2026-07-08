import { useTranslation } from "react-i18next";
import { RiSparkling2Line } from "react-icons/ri";

export default function NothingToShow() {
    const { t } = useTranslation();

    return (
        <div className="nothing-to-show" role="status">
            <div className="nothing-icon" aria-hidden="true">
                <RiSparkling2Line />
            </div>
            <h1>{t("misc.nothingToShow")}</h1>
            <p>{t("misc.emptyDescription")}</p>
        </div>
    );
}
