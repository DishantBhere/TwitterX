"use client";

import { useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Switch,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "@/app/providers";
import { AuthContext } from "../layout";
import LanguageSelector from "@/components/misc/LanguageSelector";
import CircularLoading from "@/components/misc/CircularLoading";
import { formatDateExtended } from "@/utilities/date";
import { getLoginHistory } from "@/utilities/fetch";
import { LoginHistoryProps } from "@/types/LoginHistoryProps";
import { SubscriptionPlan } from "@/types/UserProps";

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const { isLoading, data } = useQuery({
        queryKey: ["login-history"],
        queryFn: getLoginHistory,
        enabled: !!token,
    });

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
    const selectedPlanLabel = subscriptionPlans.find((plan) => plan.key === selectedPlan)?.name ?? "";

    return (
        <main>
            <h1 className="page-name">{t("settings.title")}</h1>
            <div className="color-theme-switch">
                <h1>{t("settings.colorTheme")}</h1>
                <Switch checked={theme === "dark"} onChange={toggleTheme} />
                <div className="label">{theme === "dark" ? t("settings.lightsOut") : t("settings.defaultTheme")}</div>
            </div>
            {token && (
                <div className="settings-language">
                    <h1>{t("settings.language")}</h1>
                    <LanguageSelector currentLanguage={token.preferredLanguage ?? "en"} refreshToken={refreshToken} />
                </div>
            )}
            {token && (
                <div className="settings-language">
                    <h1>Subscription</h1>
                    <Grid container spacing={2}>
                        {subscriptionPlans.map((plan) => {
                            const isCurrentPlan = token.subscriptionPlan === plan.key;
                            return (
                                <Grid item xs={12} sm={6} md={3} key={plan.key}>
                                    <Card
                                        sx={{
                                            height: "100%",
                                            border: isCurrentPlan ? "2px solid #1d9bf0" : "1px solid rgba(0,0,0,0.12)",
                                            boxShadow: isCurrentPlan ? "0 0 0 1px rgba(29,155,240,0.2)" : "none",
                                            background: isCurrentPlan ? "rgba(29,155,240,0.06)" : "inherit",
                                        }}
                                    >
                                        <CardContent>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                <Typography variant="h6" component="h2">
                                                    {plan.name}
                                                </Typography>
                                                {isCurrentPlan && <Chip size="small" color="primary" label="Current plan" />}
                                            </div>
                                            <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                                                {plan.price}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {plan.tweets}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ px: 2, pb: 2 }}>
                                            <Button
                                                variant={isCurrentPlan ? "outlined" : "contained"}
                                                fullWidth
                                                onClick={() => setSelectedPlan(plan.key)}
                                            >
                                                Choose Plan
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </div>
            )}
            {token && (
                <div className="settings-language">
                    <h1>Login History</h1>
                    {isLoading ? (
                        <CircularLoading />
                    ) : loginHistory.length === 0 ? (
                        <p className="text-muted">No login history available.</p>
                    ) : (
                        <div className="login-history-list">
                            {loginHistory.map((entry, index) => (
                                <div className="login-history-item" key={`${entry.loginTime}-${index}`}>
                                    <div>
                                        <strong>Browser:</strong> {entry.browser}
                                    </div>
                                    <div>
                                        <strong>Operating System:</strong> {entry.operatingSystem}
                                    </div>
                                    <div>
                                        <strong>Device Type:</strong> {entry.deviceType}
                                    </div>
                                    <div>
                                        <strong>IP Address:</strong> {entry.ipAddress}
                                    </div>
                                    <div>
                                        <strong>Login Time:</strong> {formatDateExtended(entry.loginTime)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <Dialog open={!!selectedPlan} onClose={() => setSelectedPlan(null)} fullWidth maxWidth="xs">
                <DialogTitle>Subscription Placeholder</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        You selected {selectedPlanLabel} plan. Payment is not implemented yet.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedPlan(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}
