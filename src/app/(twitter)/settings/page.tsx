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
    Stack,
    Switch,
    Typography,
} from "@mui/material";
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

export default function SettingsPage() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { token, refreshToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [paymentMessage, setPaymentMessage] = useState("");
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
            setSelectedPlan("FREE");
            return;
        }

        if (token.subscriptionPlan === plan) {
            setPaymentMessage(`You are already on the ${plan} plan.`);
            setSelectedPlan(plan);
            return;
        }

        setIsCheckoutLoading(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setPaymentMessage("Unable to load Razorpay checkout.");
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
        } finally {
            setIsCheckoutLoading(false);
        }
    };

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
                                                onClick={() => handleChoosePlan(plan.key)}
                                                disabled={isCheckoutLoading && selectedPlan === plan.key}
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
            <Dialog open={!!activatedSubscription} onClose={() => setActivatedSubscription(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                        Subscription Activated
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25} sx={{ pt: 1 }}>
                        <Typography variant="body1">
                            Your {activatedSubscription?.plan} subscription has been activated successfully.
                        </Typography>
                        <Typography variant="body1">
                            Your invoice has been emailed to:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {activatedSubscription?.email || token?.email || ""}
                        </Typography>
                        <Typography variant="body1">Enjoy TwitterX Premium!</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button variant="contained" onClick={() => setActivatedSubscription(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}
