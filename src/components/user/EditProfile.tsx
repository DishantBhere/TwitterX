import { useRef, useState } from "react";
import { useFormik } from "formik";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, TextField, Switch, FormControlLabel } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { FaTwitter } from "react-icons/fa";
import * as yup from "yup";
import Image from "next/image";

import { UserProps } from "@/types/UserProps";
import CircularLoading from "../misc/CircularLoading";
import { uploadFile } from "@/utilities/storage";
import { editUser } from "@/utilities/fetch";
import { getFullURL } from "@/utilities/misc/getFullURL";
import CustomSnackbar from "../misc/CustomSnackbar";
import { SnackbarProps } from "@/types/SnackbarProps";
import { checkBlueFromServer } from "@/utilities/misc/checkBlue";
import LanguageSelector from "../misc/LanguageSelector";

export default function EditProfile({ profile, refreshToken }: { profile: UserProps; refreshToken: () => void }) {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarProps>({ message: "", severity: "success", open: false });
    const [isBlueOpen, setIsBlueOpen] = useState(false);
    const [blueInput, setBlueInput] = useState("");
    const [isBlueLoading, setIsBlueLoading] = useState(false);
    const { t } = useTranslation();

    const headerUploadInputRef = useRef<HTMLInputElement>(null);
    const photoUploadInputRef = useRef<HTMLInputElement>(null);

    const queryClient = useQueryClient();

    const handleHeaderChange = (event: any) => {
        const file = event.target.files[0];
        setHeaderPreview(URL.createObjectURL(file));
        setHeaderFile(file);
    };
    const handleHeaderClick = () => {
        headerUploadInputRef.current?.click();
    };
    const handlePhotoChange = (event: any) => {
        const file = event.target.files[0];
        setPhotoPreview(URL.createObjectURL(file));
        setPhotoFile(file);
    };
    const handlePhotoClick = () => {
        photoUploadInputRef.current?.click();
    };

    const validationSchema = yup.object({
        name: yup.string().max(50, "Name should be of maximum 50 characters length."),
        email: yup.string().email("Email is invalid").required("Email is required."),
        phone: yup.string().required("Phone is required."),
        description: yup.string().max(160, "Description should be of maximum 160 characters length."),
        location: yup.string().max(50, "Location should be of maximum 50 characters length."),
        website: yup.string().max(50, "Website should be of maximum 50 characters length."),
        photoUrl: yup.string(),
        headerUrl: yup.string(),
        browserNotificationsEnabled: yup.boolean(),
    });

    const formik = useFormik({
        initialValues: {
            name: profile.name ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            description: profile.description ?? "",
            location: profile.location ?? "",
            website: profile.website ?? "",
            headerUrl: profile.headerUrl ?? "",
            photoUrl: profile.photoUrl ?? "",
            browserNotificationsEnabled: profile.browserNotificationsEnabled ?? false,
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            if (headerFile) {
                const path: string | void = await uploadFile(headerFile);
                if (!path) throw new Error("Header upload failed.");
                values.headerUrl = path;
            }
            if (photoFile) {
                const path: string | void = await uploadFile(photoFile);
                if (!path) throw new Error("Photo upload failed.");
                values.photoUrl = path;
            }
            const jsonValues = JSON.stringify(values);
            const response = await editUser(jsonValues, profile.username);
            if (!response.success) {
                return setSnackbar({
                    message: t("profile.updateFailed"),
                    severity: "error",
                    open: true,
                });
            }
            setSnackbar({
                message: t("profile.updated"),
                severity: "success",
                open: true,
            });
            refreshToken();
            queryClient.invalidateQueries(["users", profile.username]);
        },
    });

    const handleBlueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blueInput === "") return;
        setIsBlueLoading(true);
        const checkResponse = await checkBlueFromServer(blueInput);
        if (!checkResponse) {
            setIsBlueLoading(false);
            return setSnackbar({ message: t("profile.invalidBlue"), severity: "error", open: true });
        }
        const response = await editUser(JSON.stringify({ isPremium: true }), profile.username);
        if (!response.success) {
            setIsBlueLoading(false);
            return setSnackbar({
                message: t("profile.blueFailed"),
                severity: "error",
                open: true,
            });
        }
        setSnackbar({
            message: t("profile.blueSuccess"),
            severity: "success",
            open: true,
        });
        setIsBlueLoading(false);
        setIsBlueOpen(false);
        refreshToken();
        queryClient.invalidateQueries(["users", profile.username]);
    };

    return (
        <div className="edit-profile">
            <div className="profile-header">
                <div className="get-blue">
                    <button onClick={() => setIsBlueOpen(true)}>
                        {t("profile.twitterBlue")} <FaTwitter />
                    </button>
                </div>
                <Image
                    alt=""
                    src={
                        headerPreview
                            ? headerPreview
                            : profile.headerUrl
                            ? getFullURL(profile.headerUrl)
                            : "/assets/header.jpg"
                    }
                    fill
                />
                <div>
                    <button className="icon-hoverable add-photo" onClick={handleHeaderClick}>
                        <MdOutlineAddAPhoto />
                    </button>
                    <input
                        ref={headerUploadInputRef}
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleHeaderChange}
                    />
                </div>
                <div className="avatar-wrapper">
                    <Avatar
                        className="avatar"
                        sx={{ width: 125, height: 125 }}
                        alt=""
                        src={
                            photoPreview ? photoPreview : profile.photoUrl ? getFullURL(profile.photoUrl) : "/assets/egg.jpg"
                        }
                    />
                    <div>
                        <button className="icon-hoverable add-photo" onClick={handlePhotoClick}>
                            <MdOutlineAddAPhoto />
                        </button>
                        <input
                            ref={photoUploadInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={handlePhotoChange}
                        />
                    </div>
                </div>
            </div>
            <form onSubmit={formik.handleSubmit}>
                <div className="input-group">
                    <h1>{t("profile.editProfile")}</h1>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="name"
                            label={t("profile.name")}
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                        />
                    </div>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="description"
                            label={t("profile.description")}
                            multiline
                            minRows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                        />
                    </div>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="location"
                            label={t("profile.location")}
                            value={formik.values.location}
                            onChange={formik.handleChange}
                            error={formik.touched.location && Boolean(formik.errors.location)}
                            helperText={formik.touched.location && formik.errors.location}
                        />
                    </div>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="website"
                            label={t("profile.website")}
                            value={formik.values.website}
                            onChange={formik.handleChange}
                            error={formik.touched.website && Boolean(formik.errors.website)}
                            helperText={formik.touched.website && formik.errors.website}
                        />
                    </div>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="email"
                            label={t("profile.email")}
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                    </div>
                    <div className="input">
                        <TextField
                            fullWidth
                            name="phone"
                            label={t("profile.phone")}
                            value={formik.values.phone}
                            onChange={formik.handleChange}
                            error={formik.touched.phone && Boolean(formik.errors.phone)}
                            helperText={formik.touched.phone && formik.errors.phone}
                        />
                    </div>
                    <div className="input">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formik.values.browserNotificationsEnabled}
                                    onChange={async (event) => {
                                        const enabled = event.target.checked;
                                        if (enabled && typeof window !== "undefined" && "Notification" in window) {
                                            const permission = await Notification.requestPermission();
                                            if (permission !== "granted") {
                                                formik.setFieldValue("browserNotificationsEnabled", false);
                                                return;
                                            }
                                        }
                                        if (enabled && typeof window !== "undefined" && !("Notification" in window)) {
                                            formik.setFieldValue("browserNotificationsEnabled", false);
                                            return;
                                        }
                                        formik.setFieldValue("browserNotificationsEnabled", enabled);
                                    }}
                                    name="browserNotificationsEnabled"
                                />
                            }
                            label={t("profile.enableBrowserNotifications")}
                        />
                    </div>
                    <div className="input">
                        <LanguageSelector currentLanguage={profile.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                    </div>
                    {formik.isSubmitting ? (
                        <CircularLoading />
                    ) : (
                        <button
                            className={`btn btn-dark save ${formik.isValid ? "" : "disabled"}`}
                            
                            disabled={!formik.isValid}
                            type="submit"
                        >
                            {t("actions.save")}
                        </button>
                    )}
                </div>
            </form>
            {snackbar.open && (
                <CustomSnackbar message={snackbar.message} severity={snackbar.severity} setSnackbar={setSnackbar} />
            )}
            {isBlueOpen && (
                <div className="html-modal-wrapper">
                    <dialog open className="get-blue-modal">
                        {profile.isPremium ? (
                            <div className="blue-user">
                                <Image src="/assets/favicon.png" alt="" width={75} height={75} />
                                <h1>{t("profile.alreadyBlue")}</h1>
                                <p>{t("profile.thanks")}</p>
                                <button
                                    className="btn btn-white"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsBlueOpen(false);
                                    }}
                                >
                                    {t("actions.close")}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1>
                                    {t("profile.wantBlue")} <FaTwitter />
                                </h1>
                                <p>{t("profile.blueDescription")}</p>
                                <p>
                                    {t("profile.blueCodeInfo")}
                                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                                        {" "}
                                        {t("profile.here")}{" "}
                                    </a>
                                    if you want.
                                </p>
                                {isBlueLoading ? (
                                    <CircularLoading />
                                ) : (
                                    <form onSubmit={handleBlueSubmit}>
                                        <input
                                            type="text"
                                            className="blue-input"
                                            onChange={(e) => setBlueInput(e.target.value)}
                                            value={blueInput}
                                            placeholder={t("profile.enterCode")}
                                            autoFocus
                                        />
                                        <button className="btn btn-dark" type="submit">
                                            {t("actions.submit")}
                                        </button>
                                        <button
                                            className="btn btn-white"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsBlueOpen(false);
                                            }}
                                        >
                                            {t("actions.close")}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </dialog>
                </div>
            )}
        </div>
    );
}
