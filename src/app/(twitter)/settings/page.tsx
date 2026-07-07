"use client";

import { useContext, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Stack,
    Switch,
    TextField,
    Snackbar,
    Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { FaChevronRight, FaArrowLeft } from "react-icons/fa6";
import { MdSearch } from "react-icons/md";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "@/context/AuthContext";
import LanguageSelector from "@/components/misc/LanguageSelector";
import CircularLoading from "@/components/misc/CircularLoading";
import { formatDateExtended } from "@/utilities/date";
import { activateSubscription, createSubscriptionOrder, getLoginHistory } from "@/utilities/fetch";
import { LoginHistoryProps } from "@/types/LoginHistoryProps";
import { SubscriptionPlan } from "@/types/UserProps";

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
        };
    }
}

type SettingsSection = "theme" | "language" | "subscription" | "loginHistory";

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentToastOpen, setPaymentToastOpen] = useState(false);
    const [activatedSubscription, setActivatedSubscription] = useState<{
        plan: SubscriptionPlan;
        email: string;
    } | null>(null);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const { isLoading, data } = useQuery({
        queryKey: ["login-history"],
        queryFn: getLoginHistory,
        enabled: !!token,
    });

    // UI-only state for the nested X-style settings navigation. No backend/logic impact.
    const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const loginHistory: LoginHistoryProps[] = data?.loginHistory ?? [];
    const subscriptionPlans = useMemo(
        () => [
            { key: "FREE" as const, name: "Free", price: "₹0/month", tweets: "1 tweet" },
            { key: "BRONZE" as const, name: "Bronze", price: "₹100/month", tweets: "3 tweets" },
            { key: "SILVER" as const, name: "Silver", price: "₹300/month", tweets: "5 tweets" },
            { key: "GOLD" as const, name: "Gold", price: "₹1000/month", tweets: "Unlimited tweets" },
        ],
        []
    );
    const loadRazorpayScript = () => {
        return new Promise<boolean>((resolve) => {
            if (window.Razorpay) return resolve(true);

            const existingScript = document.querySelector<HTMLScriptElement>("script[src='https://checkout.razorpay.com/v1/checkout.js']");
            if (existingScript) {
                existingScript.addEventListener("load", () => resolve(true));
                existingScript.addEventListener("error", () => resolve(false));
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleChoosePlan = async (plan: SubscriptionPlan) => {
        if (!token) return;

        if (plan === "FREE") {
            setPaymentMessage("Free plan does not require payment.");
            setPaymentToastOpen(true);
            setSelectedPlan("FREE");
            return;
        }

        if (token.subscriptionPlan === plan) {
            setPaymentMessage(`You are already on the ${plan} plan.`);
            setPaymentToastOpen(true);
            setSelectedPlan(plan);
            return;
        }

        setIsCheckoutLoading(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setPaymentMessage("Unable to load Razorpay checkout.");
                setPaymentToastOpen(true);
                setSelectedPlan(plan);
                return;
            }

            const response = await createSubscriptionOrder(plan);
            const planName = subscriptionPlans.find((item) => item.key === plan)?.name ?? plan;
            const options = {
                key: response.keyId,
                amount: response.order.amount,
                currency: response.order.currency,
                name: "Twitter Subscription",
                description: `${planName} subscription`,
                order_id: response.order.id,
                handler: (razorpayResponse: Record<string, string>) => {
                    void (async () => {
                        const activation = await activateSubscription(plan, {
                            razorpayPaymentId: razorpayResponse.razorpay_payment_id ?? "",
                            razorpayOrderId: razorpayResponse.razorpay_order_id ?? response.order.id,
                            razorpaySignature: razorpayResponse.razorpay_signature ?? "",
                        });

                        await refreshToken();
                        setSelectedPlan(plan);
                        setActivatedSubscription({
                            plan,
                            email: token.email ?? "",
                        });
                        setPaymentMessage(`Subscription activated successfully for ${planName} plan.`);
                    })().catch((error: unknown) => {
                        setActivatedSubscription(null);
                        setPaymentMessage(error instanceof Error ? error.message : "Something went wrong.");
                    });
                },
                prefill: {
                    name: token.name ?? token.username,
                    email: token.email ?? "",
                    contact: token.phone ?? "",
                },
                notes: {
                    username: token.username,
                    plan,
                },
                theme: {
                    color: "#1d9bf0",
                },
            };

            setSelectedPlan(plan);
            const Razorpay = window.Razorpay;
            if (!Razorpay) {
                throw new Error("Razorpay checkout is unavailable.");
            }
            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            setSelectedPlan(plan);
            setActivatedSubscription(null);
            setPaymentMessage(error instanceof Error ? error.message : "Something went wrong.");
            setPaymentToastOpen(true);
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    // ---- UI-only helpers (no logic/state impact beyond navigation) ----

    const currentPlanName =
        subscriptionPlans.find((p) => p.key === token?.subscriptionPlan)?.name ?? "Free";

    type Row = { key: SettingsSection; title: string; subtitle: string; visible: boolean };

    const rows: Row[] = [
        {
            key: "theme",
            title: t("settings.colorTheme"),
            subtitle: theme === "dark" ? t("settings.lightsOut") : t("settings.defaultTheme"),
            visible: true,
        },
        {
            key: "language",
            title: t("settings.language"),
            subtitle: "Manage the language Twitter displays to you",
            visible: !!token,
        },
        {
            key: "subscription",
            title: "Premium",
            subtitle: `Current plan: ${currentPlanName}`,
            visible: !!token,
        },
        {
            key: "loginHistory",
            title: "Login History",
            subtitle: "See your recent account activity",
            visible: !!token,
        },
    ];

    const filteredRows = rows.filter(
        (row) => row.visible && row.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const sectionTitles: Record<SettingsSection, string> = {
        theme: t("settings.colorTheme"),
        language: t("settings.language"),
        subscription: "Premium",
        loginHistory: "Login History",
    };

    const renderRow = (row: Row) => (
        <ListItemButton
            key={row.key}
            selected={activeSection === row.key}
            onClick={() => setActiveSection(row.key)}
            sx={{
                px: 2,
                py: 1.5,
                borderRadius: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                "&.Mui-selected": {
                    backgroundColor: (muiTheme: Theme) => (muiTheme.palette.mode === "dark" ? "rgba(231,233,234,0.1)" : "rgba(15,20,25,0.06)"),
                },
                "&.Mui-selected:hover": {
                    backgroundColor: (muiTheme: Theme) => (muiTheme.palette.mode === "dark" ? "rgba(231,233,234,0.1)" : "rgba(15,20,25,0.06)"),
                },
                "&:hover": {
                    backgroundColor: (muiTheme: Theme) => (muiTheme.palette.mode === "dark" ? "rgba(231,233,234,0.1)" : "rgba(15,20,25,0.06)"),
                },
                transition: "background-color 0.15s ease-in-out",
            }}
        >
            <ListItemText
                primary={row.title}
                secondary={row.subtitle}
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.98rem" }}
                secondaryTypographyProps={{ fontSize: "0.85rem" }}
            />
            <FaChevronRight style={{ flexShrink: 0, opacity: 0.6, fontSize: "0.85rem" }} />
        </ListItemButton>
    );

    const renderThemePanel = () => (
        <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
                Choose how Twitter looks to you. This setting applies to this browser only.
            </Typography>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    px: 2.5,
                    py: 2,
                }}
            >
                <Stack>
                    <Typography fontWeight={700}>Dark mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {theme === "dark" ? t("settings.lightsOut") : t("settings.defaultTheme")}
                    </Typography>
                </Stack>
                <Switch
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    sx={{
                        width: 58,
                        height: 34,
                        p: 0,
                        "& .MuiSwitch-switchBase": {
                            p: "6px",
                            "&.Mui-checked": {
                                transform: "translateX(24px)",
                                color: "#fff",
                                "& + .MuiSwitch-track": {
                                    backgroundColor: "#1d9bf0",
                                    opacity: 1,
                                },
                            },
                        },
                        "& .MuiSwitch-thumb": {
                            width: 22,
                            height: 22,
                            boxShadow: "none",
                        },
                        "& .MuiSwitch-track": {
                            borderRadius: 17,
                            backgroundColor: "#71767b",
                            opacity: 1,
                            transition: "background-color 0.2s ease-in-out",
                        },
                    }}
                />
            </Stack>
        </Stack>
    );

    const renderLanguagePanel = () => (
        <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
                Manage which language Twitter displays to you.
            </Typography>
            <Stack
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    px: 2.5,
                    py: 2.5,
                }}
            >
                {token && (
                    <LanguageSelector currentLanguage={token.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                )}
            </Stack>
        </Stack>
    );

    const renderSubscriptionPanel = () => (
        <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
                Upgrade your account to unlock more daily tweets and premium perks.
            </Typography>
            <Grid container spacing={2}>
                {subscriptionPlans.map((plan) => {
                    const isCurrentPlan = token?.subscriptionPlan === plan.key;
                    const planStyles = {
                        FREE: {
                            accent: "#1d9bf0",
                            border: "1px solid rgba(29,155,240,0.45)",
                            background: "linear-gradient(135deg, rgba(29,155,240,0.10), rgba(255,255,255,0.96))",
                            glow: "0 10px 30px rgba(29,155,240,0.16)",
                            title: "#1d9bf0",
                            description: "rgba(20,20,20,0.75)",
                            button: {
                                background: "linear-gradient(135deg, #1d9bf0 0%, #4ba3ff 100%)",
                                hover: "linear-gradient(135deg, #1a8cd8 0%, #3b95ea 100%)",
                                color: "#fff",
                            },
                        },
                        BRONZE: {
                            accent: "#a45f1d",
                            border: "1px solid rgba(164,95,29,0.45)",
                            background: "linear-gradient(135deg, rgba(255,232,206,0.95), rgba(255,248,239,0.96))",
                            glow: "0 12px 34px rgba(164,95,29,0.16)",
                            title: "#8c4512",
                            description: "rgba(60,35,15,0.75)",
                            button: {
                                background: "linear-gradient(135deg, #a45f1d 0%, #c27a35 100%)",
                                hover: "linear-gradient(135deg, #8f4d18 0%, #ad6b2b 100%)",
                                color: "#fff",
                            },
                        },
                        SILVER: {
                            accent: "#8d98a2",
                            border: "1px solid rgba(255,255,255,0.9)",
                            background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(232,236,240,0.92))",
                            glow: "0 16px 42px rgba(141,152,162,0.24)",
                            title: "#5f6870",
                            description: "rgba(55,55,55,0.75)",
                            button: {
                                background: "linear-gradient(135deg, #ffffff 0%, #e8ebef 100%)",
                                hover: "linear-gradient(135deg, #f5f7fa 0%, #dde3ea 100%)",
                                color: "#0f1419",
                            },
                        },
                        GOLD: {
                            accent: "#caa24f",
                            border: "1px solid rgba(202,162,79,0.55)",
                            background: "linear-gradient(135deg, rgba(255,248,214,0.96), rgba(255,236,172,0.92))",
                            glow: "0 16px 42px rgba(202,162,79,0.24)",
                            title: "#a47b1d",
                            description: "rgba(90,70,0,0.8)",
                            button: {
                                background: "linear-gradient(135deg, #d8b14a 0%, #f1c75d 100%)",
                                hover: "linear-gradient(135deg, #c59c2c 0%, #dfb12d 100%)",
                                color: "#221404",
                            },
                        },
                    }[plan.key];
                    return (
                        <Grid item xs={12} sm={6} key={plan.key}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: "100%",
                                    borderRadius: 3.5,
                                    border: planStyles.border,
                                    boxShadow: isCurrentPlan ? planStyles.glow : "0 6px 18px rgba(15,20,25,0.06)",
                                    background: planStyles.background,
                                    position: "relative",
                                    overflow: "hidden",
                                    transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
                                    transform: "translateY(0)",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: planStyles.glow,
                                    },
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        background: plan.key === "SILVER"
                                            ? "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 40%, transparent 75%)"
                                            : "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.38) 40%, transparent 75%)",
                                        pointerEvents: "none",
                                        transform: "translateX(-100%)",
                                        transition: "transform 220ms ease",
                                    },
                                    "&:hover::before": {
                                        transform: "translateX(100%)",
                                    },
                                }}
                            >
                                <CardContent sx={{ position: "relative", zIndex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            fontWeight={800}
                                            sx={{ color: planStyles.title }}
                                        >
                                            {plan.name}
                                        </Typography>
                                        {isCurrentPlan && (
                                            <Chip
                                                size="small"
                                                label="Current"
                                                sx={{
                                                    background: plan.key === "SILVER"
                                                        ? "linear-gradient(135deg, #f5f7fa 0%, #dae1e8 100%)"
                                                        : plan.key === "GOLD"
                                                          ? "linear-gradient(135deg, #d8b14a 0%, #f1c75d 100%)"
                                                          : plan.key === "BRONZE"
                                                            ? "linear-gradient(135deg, #a45f1d 0%, #c27a35 100%)"
                                                            : "linear-gradient(135deg, #1d9bf0 0%, #4ba3ff 100%)",
                                                    color: plan.key === "SILVER" ? "#0f1419" : "#fff",
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    boxShadow: plan.key === "SILVER" ? "0 6px 18px rgba(141,152,162,0.16)" : "none",
                                                }}
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="h5" sx={{ mt: 1, fontWeight: 800, color: "#0f1419" }}>
                                        {plan.price}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 0.5,
                                            fontSize: "0.95rem",
                                            fontWeight: 600,
                                            color: planStyles.description,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {plan.tweets}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2, position: "relative", zIndex: 1 }}>
                                    <Button
                                        variant={isCurrentPlan ? "outlined" : "contained"}
                                        fullWidth
                                        onClick={() => handleChoosePlan(plan.key)}
                                        disabled={isCheckoutLoading && selectedPlan === plan.key}
                                        sx={{
                                            borderRadius: 999,
                                            fontWeight: 700,
                                            textTransform: "none",
                                            borderColor: planStyles.accent,
                                            color: isCurrentPlan ? planStyles.title : planStyles.button.color,
                                            background: isCurrentPlan ? "rgba(255,255,255,0.9)" : planStyles.button.background,
                                            boxShadow: isCurrentPlan ? "none" : `0 8px 22px ${planStyles.accent}22`,
                                            transition: "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
                                            "&:hover": {
                                                background: isCurrentPlan ? "rgba(255,255,255,0.95)" : planStyles.button.hover,
                                                transform: "translateY(-2px)",
                                                boxShadow: isCurrentPlan ? "0 8px 18px rgba(15,20,25,0.08)" : `0 10px 24px ${planStyles.accent}33`,
                                            },
                                        }}
                                    >
                                        Choose Plan
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
            {paymentMessage && (
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    {paymentMessage}
                </Typography>
            )}
        </Stack>
    );

    const renderLoginHistoryPanel = () => (
        <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
                Where you&apos;re logged in. See all the devices and locations linked to your account.
            </Typography>
            {isLoading ? (
                <CircularLoading />
            ) : loginHistory.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
                    No login history available.
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {loginHistory.map((entry, index) => (
                        <Stack
                            key={`${entry.loginTime}-${index}`}
                            spacing={0.75}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                px: 2.5,
                                py: 2,
                            }}
                        >
                            <Typography fontWeight={700} fontSize="0.95rem">
                                {entry.browser} · {entry.operatingSystem}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {entry.deviceType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {entry.ipAddress}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDateExtended(entry.loginTime)}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            )}
        </Stack>
    );

    const renderActivePanel = () => {
        switch (activeSection) {
            case "theme":
                return renderThemePanel();
            case "language":
                return renderLanguagePanel();
            case "subscription":
                return renderSubscriptionPanel();
            case "loginHistory":
                return renderLoginHistoryPanel();
            default:
                return (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", px: 3, py: 8 }}>
                        <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                            Select a setting on the left to view options here.
                        </Typography>
                    </Stack>
                );
        }
    };

    return (
        <main className="x-settings-shell">
            {/*
              Layout-only fix: the app's outer .layout grid caps the middle
              column at minmax(500px,600px), which squeezed this page's own
              menu+detail split into a tiny inner area (looked like a popup).
              This widens ONLY the middle track, ONLY while this page is
              mounted, so the left nav (280px) and right Trends/News sidebar
              (290-350px) stay exactly the widths they already are.
            */}
            <style>{`
                .layout:has(.x-settings-shell) {
                    grid-template-columns: 280px minmax(500px, 1fr) minmax(290px, 350px);
                }
            `}</style>
            <Stack
                direction="row"
                sx={{
                    height: "100%",
                    minHeight: "100vh",
                    width: "100%",
                }}
            >
                {/* LEFT PANEL */}
                <Stack
                    sx={{
                        width: { xs: "100%", md: 360 },
                        flexShrink: 0,
                        borderRight: { md: "1px solid" },
                        borderColor: "divider",
                        display: { xs: activeSection ? "none" : "flex", md: "flex" },
                    }}
                >
                    <Typography
                        component="h1"
                        className="page-name"
                        sx={{ fontWeight: 800, fontSize: "1.25rem" }}
                    >
                        {t("settings.title")}
                    </Typography>

                    <TextField
                        placeholder="Search settings"
                        size="small"
                        value={searchQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        sx={{
                            px: 2,
                            pt: 1.5,
                            pb: 1,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 999,
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MdSearch style={{ opacity: 0.6, fontSize: "1.1rem" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <List sx={{ py: 0 }}>
                        <ListSubheader sx={{ fontWeight: 700, lineHeight: 2.4, backgroundColor: "transparent" }}>
                            Accessibility, display, and languages
                        </ListSubheader>
                        {filteredRows.filter((r) => r.key === "theme" || r.key === "language").map(renderRow)}

                        {filteredRows.some((r) => r.key === "subscription") && (
                            <>
                                <ListSubheader sx={{ fontWeight: 700, lineHeight: 2.4, backgroundColor: "transparent" }}>
                                    Premium
                                </ListSubheader>
                                {filteredRows.filter((r) => r.key === "subscription").map(renderRow)}
                            </>
                        )}

                        {filteredRows.some((r) => r.key === "loginHistory") && (
                            <>
                                <ListSubheader sx={{ fontWeight: 700, lineHeight: 2.4, backgroundColor: "transparent" }}>
                                    Security and account access
                                </ListSubheader>
                                {filteredRows.filter((r) => r.key === "loginHistory").map(renderRow)}
                            </>
                        )}
                    </List>
                </Stack>

                {/* RIGHT PANEL — fills all remaining space, no fixed/max width */}
                <Stack
                    sx={{
                        flex: 1,
                        width: "100%",
                        display: { xs: activeSection ? "flex" : "none", md: "flex" },
                        minWidth: 0,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        className="page-name"
                        sx={{ display: { xs: "flex", md: activeSection ? "flex" : "none" } }}
                    >
                        <Button
                            onClick={() => setActiveSection(null)}
                            sx={{
                                display: { xs: "inline-flex", md: "none" },
                                minWidth: 0,
                                p: 1,
                                borderRadius: 999,
                                color: "inherit",
                            }}
                        >
                            <FaArrowLeft />
                        </Button>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                            {activeSection ? sectionTitles[activeSection] : ""}
                        </Typography>
                    </Stack>

                    {renderActivePanel()}
                </Stack>
            </Stack>

            <Dialog
                open={!!activatedSubscription}
                onClose={() => setActivatedSubscription(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        overflow: "hidden",
                        color: "#f7f9f9",
                        background: "linear-gradient(180deg, rgba(15,20,25,0.98), rgba(15,20,25,0.92))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
                        backdropFilter: "blur(24px)",
                    },
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(3,8,20,0.65)",
                        backdropFilter: "blur(10px)",
                    },
                }}
            >
                <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                        <Stack
                            sx={{
                                width: 68,
                                height: 68,
                                borderRadius: "22px",
                                display: "grid",
                                placeItems: "center",
                                background: "linear-gradient(135deg, rgba(19,206,102,0.24), rgba(29,155,240,0.18))",
                                boxShadow: "0 12px 32px rgba(19,206,102,0.18)",
                                color: "#13ce66",
                                fontSize: 34,
                            }}
                        >
                            ✓
                        </Stack>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Subscription Activated!
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 1.5 }}>
                    <Stack spacing={2}>
                        <Stack
                            spacing={1.5}
                            sx={{
                                borderRadius: "20px",
                                p: 2,
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" gap={2}>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                                    Plan Name
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                    {activatedSubscription?.plan}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" gap={2}>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                                    Invoice sent to
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, wordBreak: "break-word", textAlign: "right" }}>
                                    {activatedSubscription?.email || token?.email || ""}
                                </Typography>
                            </Stack>
                        </Stack>
                        <Typography
                            variant="body1"
                            sx={{
                                textAlign: "center",
                                color: "rgba(255,255,255,0.9)",
                                fontWeight: 500,
                            }}
                        >
                            Enjoy all Premium features.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setActivatedSubscription(null)}
                        sx={{
                            borderRadius: "999px",
                            py: 1.15,
                            fontWeight: 800,
                            textTransform: "none",
                            background: "linear-gradient(135deg, #4f7cff 0%, #7c4dff 100%)",
                            boxShadow: "0 14px 32px rgba(95,103,255,0.28)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #3f6df2 0%, #6c3eff 100%)",
                            },
                        }}
                    >
                        Continue
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setActivatedSubscription(null)}
                        sx={{
                            borderRadius: "999px",
                            py: 1.15,
                            fontWeight: 800,
                            textTransform: "none",
                            borderColor: "rgba(255,255,255,0.16)",
                            color: "#f7f9f9",
                            "&:hover": {
                                borderColor: "rgba(255,255,255,0.28)",
                                backgroundColor: "rgba(255,255,255,0.06)",
                            },
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={paymentToastOpen && Boolean(paymentMessage)}
                autoHideDuration={4200}
                onClose={() => setPaymentToastOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                TransitionProps={{ appear: true }}
            >
                <Alert
                    onClose={() => setPaymentToastOpen(false)}
                    severity="error"
                    variant="filled"
                    sx={{
                        borderRadius: "18px",
                        alignItems: "center",
                        boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
                    }}
                >
                    {paymentMessage}
                </Alert>
            </Snackbar>
        </main>
    );
}
