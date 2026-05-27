"use client";
import styles from "./landing.module.scss";
import { useAuth } from "../lib/auth-context";
import BotIcon from "../icons/bot.svg";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

export function LandingPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, loading } = useAuth();
  const landingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer for scroll-based fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles["animate-in"]);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    const elements = landingRef.current?.querySelectorAll(
      `.${styles["animate-on-scroll"]}`,
    );
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    const target = landingRef.current?.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={styles["landing-page"]} ref={landingRef}>
      {/* Navigation */}
      <nav className={styles["nav"]}>
        <div className={styles["nav-inner"]}>
          <div className={styles["nav-brand"]}>
            <div className={clsx("no-dark", styles["nav-logo"])}>
              <BotIcon />
            </div>
            <span className={styles["nav-name"]}>ModelPanda</span>
          </div>
          <div className={styles["nav-links"]}>
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
            >
              Pricing
            </a>
            <a href="#faq" onClick={(e) => handleSmoothScroll(e, "#faq")}>
              FAQ
            </a>
          </div>
          <button
            className={styles["nav-cta"]}
            onClick={signInWithGoogle}
            disabled={loading}
          >
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles["hero"]}>
        <div className={clsx(styles["hero-content"], styles["hero-animate"])}>
          <div className={styles["hero-badge"]}>
            <span className={styles["badge-dot"]}></span>
            Now available — 6 AI models in one place
          </div>
          <h1 className={styles["hero-title"]}>
            All the world&apos;s best AI.
            <br />
            <span className={styles["hero-gradient"]}>
              One simple subscription.
            </span>
          </h1>
          <p className={styles["hero-subtitle"]}>
            Access GPT-4o, DeepSeek, Gemini, and more top AI models through a
            single, beautifully designed interface. No more juggling multiple
            subscriptions.
          </p>
          <div className={styles["hero-actions"]}>
            <button
              className={styles["hero-btn-primary"]}
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#fff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#fff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#fff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Join Pro Waitlist
            </button>
            <a
              href="#pricing"
              className={styles["hero-btn-secondary"]}
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
            >
              View Pricing
            </a>
          </div>
          <p className={styles["hero-note"]}>
            Free tier includes 20 messages/day. No credit card required.
          </p>
        </div>
        <div
          className={clsx(styles["hero-visual"], styles["hero-animate-delay"])}
        >
          <div className={styles["hero-mockup"]}>
            <div className={styles["mockup-header"]}>
              <div className={styles["mockup-dots"]}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles["mockup-title"]}>ModelPanda</span>
            </div>
            <div className={styles["mockup-body"]}>
              <div className={styles["mockup-message-user"]}>
                <span>Explain quantum computing in simple terms</span>
              </div>
              <div className={styles["mockup-message-ai"]}>
                <div className={styles["mockup-ai-badge"]}>GPT-4o</div>
                <span>
                  Think of quantum computing like a maze. A classical computer
                  tries one path at a time. A quantum computer explores all
                  paths simultaneously...
                </span>
              </div>
              <div className={styles["mockup-models"]}>
                <span className={styles["model-chip"]}>GPT-4o</span>
                <span className={styles["model-chip"]}>DeepSeek</span>
                <span className={styles["model-chip"]}>Gemini</span>
                <span className={styles["model-chip"]}>+3 more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Social Proof */}
      <section
        className={clsx(styles["social-proof"], styles["animate-on-scroll"])}
      >
        <p className={styles["social-proof-text"]}>
          Powered by the world&apos;s leading AI models
        </p>
        <div className={styles["logo-row"]}>
          <span className={styles["logo-item"]}>OpenAI</span>
          <span className={styles["logo-item"]}>DeepSeek</span>
          <span className={styles["logo-item"]}>Google</span>
          <span className={styles["logo-item"]}>Anthropic</span>
          <span className={styles["logo-item"]}>Meta</span>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles["features"]} id="features">
        <div
          className={clsx(
            styles["section-header"],
            styles["animate-on-scroll"],
          )}
        >
          <h2 className={styles["section-title"]}>Why ModelPanda?</h2>
          <p className={styles["section-subtitle"]}>
            One subscription to rule them all. Switch between the best AI models
            instantly.
          </p>
        </div>
        <div className={styles["features-grid"]}>
          <div
            className={clsx(
              styles["feature-card"],
              styles["feature-card-1"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className={styles["feature-title"]}>
              6 Top Models, One Interface
            </h3>
            <p className={styles["feature-desc"]}>
              Access GPT-4o, DeepSeek R1, Gemini 2.5 Flash, and more. Switch
              models mid-conversation to find the perfect answer.
            </p>
          </div>
          <div
            className={clsx(
              styles["feature-card"],
              styles["feature-card-2"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3 className={styles["feature-title"]}>
              Lightning Fast Streaming
            </h3>
            <p className={styles["feature-desc"]}>
              Real-time streaming responses with minimal latency. Watch answers
              appear word by word as the AI thinks.
            </p>
          </div>
          <div
            className={clsx(
              styles["feature-card"],
              styles["feature-card-3"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3 className={styles["feature-title"]}>Privacy First</h3>
            <p className={styles["feature-desc"]}>
              Your conversations stay private. We don&apos;t train on your data
              or share it with third parties.
            </p>
          </div>
          <div
            className={clsx(
              styles["feature-card"],
              styles["feature-card-4"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <h3 className={styles["feature-title"]}>Works Everywhere</h3>
            <p className={styles["feature-desc"]}>
              Beautiful responsive design that works on desktop, tablet, and
              mobile. Dark mode included.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles["pricing"]} id="pricing">
        <div
          className={clsx(
            styles["section-header"],
            styles["animate-on-scroll"],
          )}
        >
          <h2 className={styles["section-title"]}>
            Simple, Transparent Pricing
          </h2>
          <p className={styles["section-subtitle"]}>
            Start free, upgrade when you need more. Cancel anytime.
          </p>
        </div>
        <div className={styles["pricing-grid"]}>
          <div
            className={clsx(
              styles["pricing-card"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["pricing-card-header"]}>
              <h3 className={styles["pricing-plan-name"]}>Free</h3>
              <div className={styles["pricing-amount"]}>
                <span className={styles["pricing-currency"]}>$</span>
                <span className={styles["pricing-number"]}>0</span>
                <span className={styles["pricing-period"]}>/month</span>
              </div>
              <p className={styles["pricing-desc"]}>
                Perfect for trying out AI models
              </p>
            </div>
            <ul className={styles["pricing-features"]}>
              <li>20 messages per day</li>
              <li>Access to all 6 AI models</li>
              <li>Basic chat features</li>
              <li>Dark mode</li>
              <li>Local conversation history</li>
            </ul>
            <button
              className={styles["pricing-btn-free"]}
              onClick={signInWithGoogle}
              disabled={loading}
            >
              Start for Free
            </button>
          </div>
          <div
            className={clsx(
              styles["pricing-card"],
              styles["pricing-card-pro"],
              styles["animate-on-scroll"],
            )}
          >
            <div className={styles["pricing-popular"]}>Most Popular</div>
            <div className={styles["pricing-card-header"]}>
              <h3 className={styles["pricing-plan-name"]}>Pro</h3>
              <div className={styles["pricing-amount"]}>
                <span className={styles["pricing-currency"]}>$</span>
                <span className={styles["pricing-number"]}>12</span>
                <span className={styles["pricing-period"]}>/month</span>
              </div>
              <p className={styles["pricing-desc"]}>
                For power users who need unlimited access
              </p>
            </div>
            <ul className={styles["pricing-features"]}>
              <li>
                <strong>Unlimited</strong> messages
              </li>
              <li>All 6 AI models (GPT-4o, DeepSeek, Gemini...)</li>
              <li>Priority response speed</li>
              <li>Cloud conversation sync</li>
              <li>Early access to new models</li>
              <li>Priority support</li>
            </ul>
            <button
              className={styles["pricing-btn-pro"]}
              onClick={signInWithGoogle}
              disabled={loading}
            >
              Join Waitlist
            </button>
          </div>
        </div>
        <p
          className={clsx(
            styles["pricing-compare"],
            styles["animate-on-scroll"],
          )}
        >
          Compare: ChatGPT Plus is $20/mo for one model. ModelPanda Pro gives
          you 6 models for $12/mo.
        </p>
      </section>

      {/* FAQ Section */}
      <section className={styles["faq"]} id="faq">
        <div
          className={clsx(
            styles["section-header"],
            styles["animate-on-scroll"],
          )}
        >
          <h2 className={styles["section-title"]}>
            Frequently Asked Questions
          </h2>
        </div>
        <div className={styles["faq-list"]}>
          <details
            className={clsx(styles["faq-item"], styles["animate-on-scroll"])}
          >
            <summary>How is ModelPanda different from ChatGPT?</summary>
            <p>
              ChatGPT only gives you access to OpenAI models. ModelPanda
              integrates GPT-4o, DeepSeek, Gemini, and more — all in one
              interface. You can switch models mid-conversation to compare
              answers or find the best response for your specific task.
            </p>
          </details>
          <details
            className={clsx(styles["faq-item"], styles["animate-on-scroll"])}
          >
            <summary>What AI models are available?</summary>
            <p>
              Currently we offer GPT-4o, GPT-4o Mini, DeepSeek R1, DeepSeek V3,
              Gemini 2.5 Flash, and Gemini 2.0 Flash. We continuously add new
              models as they become available.
            </p>
          </details>
          <details
            className={clsx(styles["faq-item"], styles["animate-on-scroll"])}
          >
            <summary>What are the limits on the free plan?</summary>
            <p>
              Free users can send up to 20 messages per day across all models.
              This resets every day at midnight. If you need more, upgrade to
              Pro for unlimited messages.
            </p>
          </details>
          <details
            className={clsx(styles["faq-item"], styles["animate-on-scroll"])}
          >
            <summary>Can I cancel my subscription anytime?</summary>
            <p>
              Yes, absolutely. You can cancel your Pro subscription at any time
              from the Pricing page. You&apos;ll continue to have Pro access
              until the end of your current billing period.
            </p>
          </details>
          <details
            className={clsx(styles["faq-item"], styles["animate-on-scroll"])}
          >
            <summary>Is my data safe?</summary>
            <p>
              Yes. We use industry-standard encryption and never train AI models
              on your conversations. Your data is stored securely and is never
              shared with third parties.
            </p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles["footer"]}>
        <div className={styles["footer-inner"]}>
          <div className={styles["footer-brand"]}>
            <div className={clsx("no-dark", styles["footer-logo"])}>
              <BotIcon />
            </div>
            <span className={styles["footer-name"]}>ModelPanda</span>
            <p className={styles["footer-tagline"]}>
              All the world&apos;s best AI. One simple subscription.
            </p>
          </div>
          <div className={styles["footer-links"]}>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
            >
              Pricing
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(Path.Compare);
              }}
            >
              Compare
            </a>
            <a href="#faq" onClick={(e) => handleSmoothScroll(e, "#faq")}>
              FAQ
            </a>
            <a href="mailto:support@modelpanda.ai">Contact</a>
          </div>
          <p className={styles["footer-copyright"]}>
            &copy; 2026 ModelPanda by Hong Kong Fulgur Arc Interactive Limited.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
