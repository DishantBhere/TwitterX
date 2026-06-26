import Image from "next/image";
import { Dialog, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LogOutDialogProps } from "@/types/DialogProps";
import CircularLoading from "../misc/CircularLoading";

export default function LogOutDialog({ open, handleLogOutClose, logout, isLoggingOut }: LogOutDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog className="dialog" open={open} onClose={handleLogOutClose}>
            <Image className="dialog-icon" src="/assets/favicon.png" alt="" width={40} height={40} />
            <DialogTitle className="title">{isLoggingOut ? t("auth.loggingOut") : t("auth.logoutTitle")}</DialogTitle>
            <DialogContent>
                <DialogContentText className="text-muted">{t("auth.logoutHelp")}</DialogContentText>
            </DialogContent>
            {isLoggingOut ? (
                <CircularLoading />
            ) : (
                <div className="logout-buttons button-group">
                    <button className="btn btn-dark" onClick={logout} autoFocus>
                        {t("nav.logout")}
                    </button>
                    <button className="btn btn-white" onClick={handleLogOutClose}>
                        {t("actions.cancel")}
                    </button>
                </div>
            )}
        </Dialog>
    );
}
