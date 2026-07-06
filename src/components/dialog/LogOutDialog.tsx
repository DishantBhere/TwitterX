import { Dialog } from "@mui/material";
import { useTranslation } from "react-i18next";
import { RiTwitterXFill } from "react-icons/ri";

import { LogOutDialogProps } from "@/types/DialogProps";
import CircularLoading from "../misc/CircularLoading";

export default function LogOutDialog({ open, handleLogOutClose, logout, isLoggingOut }: LogOutDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog className="dialog logout-dialog" open={open} onClose={handleLogOutClose} fullWidth>
            <div className="logout-dialog-content">
                <div className="logout-dialog-logo">
                    <RiTwitterXFill aria-hidden="true" focusable="false" />
                </div>
                <h2 className="logout-dialog-title">{isLoggingOut ? t("auth.loggingOut") : t("auth.logoutTitle")}</h2>
                <p className="logout-dialog-text">{t("auth.logoutHelp")}</p>
                {isLoggingOut ? (
                    <CircularLoading />
                ) : (
                    <div className="logout-dialog-actions">
                        <button className="btn btn-dark logout-primary" onClick={logout} autoFocus>
                            {t("nav.logout")}
                        </button>
                        <button className="btn btn-white logout-secondary" onClick={handleLogOutClose}>
                            {t("actions.cancel")}
                        </button>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
