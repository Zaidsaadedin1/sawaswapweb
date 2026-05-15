import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    CheckCircle2,
    CircleAlert,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function normalizeSupabaseUrl(url) {
    return (url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getSupabaseConfig() {
    const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return {
        url,
        anonKey,
        isConfigured: Boolean(url && anonKey),
    };
}

function getAuthPageState() {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const linkType = hashParams.get("type") || queryParams.get("type");
    const token = hashParams.get("access_token") || queryParams.get("access_token") || "";

    return {
        mode: linkType === "recovery" ? "recovery" : "verified",
        accessToken: token,
        isConfigured: getSupabaseConfig().isConfigured,
    };
}

export default function Verified() {
    const { t } = useTranslation();
    const [{ mode, accessToken, isConfigured }] = useState(getAuthPageState);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (window.location.hash) {
            const cleanUrl = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }, []);

    async function handleResetPassword(event) {
        event.preventDefault();

        if (!accessToken) {
            setStatus("error");
            setErrorMessage(t("passwordReset.errors.invalidLink"));
            return;
        }

        if (!isConfigured) {
            setStatus("error");
            setErrorMessage(t("passwordReset.errors.missingConfig"));
            return;
        }

        if (password.length < 6) {
            setStatus("error");
            setErrorMessage(t("passwordReset.errors.shortPassword"));
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setErrorMessage(t("passwordReset.errors.mismatch"));
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const supabaseConfig = getSupabaseConfig();
            const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseConfig.anonKey,
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.msg || payload?.error_description || payload?.error || "");
            }

            setStatus("success");
            setPassword("");
            setConfirmPassword("");
        } catch (error) {
            setStatus("error");
            setErrorMessage(error.message || t("passwordReset.errors.generic"));
        }
    }

    if (mode === "recovery") {
        return (
            <main>
                <section className="verifiedSection">
                    <motion.div
                        className="verifiedCard resetCard"
                        initial={{ opacity: 0, y: 35, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.65 }}
                    >
                        <motion.div
                            className="verifiedIconWrap"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                        >
                            <KeyRound className="verifiedIcon" />
                        </motion.div>

                        <div className="badge verifiedBadge">
                            <ShieldCheck size={16} />
                            {t("passwordReset.badge")}
                        </div>

                        <h1>{t("passwordReset.title")}</h1>

                        <p>{t("passwordReset.text")}</p>

                        {status === "success" ? (
                            <>
                                <div className="authStatus authStatusSuccess">
                                    <CheckCircle2 size={18} />
                                    <span>{t("passwordReset.success")}</span>
                                </div>

                                <div className="verifiedActions">
                                    <Link to="/" className="primaryBtn">
                                        {t("passwordReset.home")}
                                        <ArrowRight size={18} />
                                    </Link>

                                    <Link to="/support" className="secondaryBtn">
                                        {t("passwordReset.support")}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                {status === "error" && errorMessage ? (
                                    <div className="authStatus authStatusError">
                                        <CircleAlert size={18} />
                                        <span>{errorMessage}</span>
                                    </div>
                                ) : null}

                                <form className="resetForm" onSubmit={handleResetPassword}>
                                    <label className="resetField">
                                        <span>{t("passwordReset.passwordLabel")}</span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder={t("passwordReset.passwordPlaceholder")}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </label>

                                    <label className="resetField">
                                        <span>{t("passwordReset.confirmLabel")}</span>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder={t("passwordReset.confirmPlaceholder")}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </label>

                                    <button className="primaryBtn resetSubmitBtn" type="submit" disabled={status === "loading"}>
                                        {status === "loading" ? (
                                            <>
                                                <LoaderCircle size={18} className="spin" />
                                                {t("passwordReset.submitting")}
                                            </>
                                        ) : (
                                            t("passwordReset.submit")
                                        )}
                                    </button>
                                </form>

                                <div className="verifiedActions">
                                    <Link to="/support" className="secondaryBtn">
                                        {t("passwordReset.support")}
                                    </Link>
                                </div>
                            </>
                        )}
                    </motion.div>
                </section>
            </main>
        );
    }

    return (
        <main>
            <section className="verifiedSection">
                <motion.div
                    className="verifiedCard"
                    initial={{ opacity: 0, y: 35, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.65 }}
                >
                    <motion.div
                        className="verifiedIconWrap"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                    >
                        <CheckCircle2 className="verifiedIcon" />
                    </motion.div>

                    <div className="badge verifiedBadge">
                        <ShieldCheck size={16} />
                        {t("verified.badge")}
                    </div>

                    <h1>{t("verified.title")}</h1>

                    <p>{t("verified.text")}</p>

                    <div className="verifiedActions">
                        <Link to="/" className="primaryBtn">
                            {t("verified.home")}
                            <ArrowRight size={18} />
                        </Link>

                        <Link to="/support" className="secondaryBtn">
                            {t("verified.support")}
                        </Link>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
