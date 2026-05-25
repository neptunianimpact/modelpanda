"use client";

import styles from "./pricing.module.scss";
import { useAuth } from "../lib/auth-context";
import { useState, useEffect } from "react";
import { IconButton } from "./button";
import Locale from "../locales";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

interface SubscriptionInfo {
  plan: string;
  subscription_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

interface UsageInfo {
  plan: string;
  messagesUsed: number;
  messagesLimit: number;
  messagesRemaining: number;
  allowedModels: string[];
}

export function PricingPage() {
  const { user, session: authSession } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchUsage();
    }
  }, [user]);

  async function fetchSubscription() {
    try {
      const res = await fetch(
        `/api/stripe/subscription?userId=${user?.id}`,
        {
          headers: authSession?.access_token
            ? { Authorization: `Bearer ${authSession.access_token}` }
            : {},
        },
      );
      const data = await res.json();
      setSubscription(data);
    } catch (e) {
      console.error("Failed to fetch subscription:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch(`/api/usage?userId=${user?.id}`, {
        headers: authSession?.access_token
          ? { Authorization: `Bearer ${authSession.access_token}` }
          : {},
      });
      const data = await res.json();
      if (data && !data.error) {
        setUsage(data);
      } else {
        // Default to free plan if API fails
        setUsage({
          plan: "free",
          messagesUsed: 0,
          messagesLimit: 20,
          messagesRemaining: 20,
          allowedModels: [],
        });
      }
    } catch (e) {
      console.error("Failed to fetch usage:", e);
      setUsage({
        plan: "free",
        messagesUsed: 0,
        messagesLimit: 20,
        messagesRemaining: 20,
        allowedModels: [],
      });
    }
  }

  async function handleUpgrade() {
    if (!user) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authSession?.access_token
            ? { Authorization: `Bearer ${authSession.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session. Please try again.");
      }
    } catch (e) {
      console.error("Failed to create checkout:", e);
      alert("Something went wrong. Please try again.");
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancel() {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Pro subscription? You will keep access until the end of your current billing period.",
    );
    if (!confirmed) return;

    setCanceling(true);
    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(authSession?.access_token
            ? { Authorization: `Bearer ${authSession.access_token}` }
            : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          "Your subscription has been canceled. You will keep Pro access until the end of your billing period.",
        );
        fetchSubscription();
      } else {
        alert(data.error || "Failed to cancel subscription.");
      }
    } catch (e) {
      console.error("Failed to cancel:", e);
      alert("Something went wrong. Please try again.");
    } finally {
      setCanceling(false);
    }
  }

  const isPro =
    subscription?.plan === "pro" &&
    (subscription?.subscription_status === "active" ||
      subscription?.subscription_status === "trialing");
  const isCanceling = subscription?.subscription_status === "canceling";

  return (
    <div className={styles["pricing-page"]}>
      <div className={styles["pricing-header"]}>
        <h1>Subscription</h1>
        <p className={styles["pricing-subtitle"]}>
          All the world&apos;s best AI. One panda-sized price.
        </p>
      </div>

      {/* Current Status */}
      {!loading && subscription && (
        <div className={styles["current-plan"]}>
          <div className={styles["plan-badge"]}>
            {isPro ? "Pro" : "Free"}
          </div>
          <div className={styles["plan-details"]}>
            <h3>Current Plan: {isPro ? "Pro" : "Free"}</h3>
            {isPro && subscription.current_period_end && (
              <p>
                {isCanceling ? "Access until: " : "Next billing: "}
                {new Date(
                  subscription.current_period_end,
                ).toLocaleDateString()}
              </p>
            )}
            {isCanceling && (
              <p className={styles["canceling-notice"]}>
                Your subscription is set to cancel at the end of the billing
                period.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usage && (
        <div className={styles["usage-section"]}>
          <h3>Today&apos;s Usage</h3>
          <div className={styles["usage-bar-container"]}>
            <div
              className={styles["usage-bar"]}
              style={{
                width:
                  usage.messagesLimit === -1
                    ? "5%"
                    : `${Math.min(100, (usage.messagesUsed / usage.messagesLimit) * 100)}%`,
              }}
            />
          </div>
          <p className={styles["usage-text"]}>
            {usage.messagesUsed}{" "}
            {usage.messagesLimit === -1
              ? "messages (unlimited)"
              : `/ ${usage.messagesLimit} messages`}
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className={styles["pricing-cards"]}>
        {/* Free Plan */}
        <div
          className={`${styles["pricing-card"]} ${!isPro ? styles["active"] : ""}`}
        >
          <h2>Free</h2>
          <div className={styles["price"]}>
            <span className={styles["amount"]}>$0</span>
            <span className={styles["period"]}>/month</span>
          </div>
          <ul className={styles["features"]}>
            <li>20 messages per day</li>
            <li>3 models (DeepSeek, GPT-4o-mini, Gemini Flash)</li>
            <li>Basic chat features</li>
          </ul>
          {!isPro && (
            <div className={styles["current-badge"]}>Current Plan</div>
          )}
        </div>

        {/* Pro Plan */}
        <div
          className={`${styles["pricing-card"]} ${styles["pro"]} ${isPro ? styles["active"] : ""}`}
        >
          <h2>Pro</h2>
          <div className={styles["price"]}>
            <span className={styles["amount"]}>$12</span>
            <span className={styles["period"]}>/month</span>
          </div>
          <ul className={styles["features"]}>
            <li>Unlimited messages</li>
            <li>All AI models (GPT-4o, DeepSeek, Gemini Pro...)</li>
            <li>Cloud chat history</li>
            <li>Model comparison (coming soon)</li>
            <li>Priority support</li>
          </ul>
          {isPro ? (
            <div className={styles["button-group"]}>
              <div className={styles["current-badge"]}>Current Plan</div>
              {!isCanceling && (
                <button
                  className={styles["cancel-btn"]}
                  onClick={handleCancel}
                  disabled={canceling}
                >
                  {canceling ? "Canceling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          ) : (
            <button
              className={styles["upgrade-btn"]}
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </div>

      <div className={styles["back-button"]}>
        <button onClick={() => navigate(Path.Chat)}>
          ← Back to Chat
        </button>
      </div>
    </div>
  );
}
