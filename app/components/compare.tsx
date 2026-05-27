"use client";

import styles from "./compare.module.scss";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

export function ComparePage() {
  const navigate = useNavigate();

  const comparisons = [
    {
      feature: "Models Included",
      modelPanda: "GPT-4o, DeepSeek R1, Gemini 2.5 Pro, etc. (6+ Models)",
      chatGPT: "GPT-4o only",
      claude: "Claude 3.5 only",
    },
    {
      feature: "Monthly Price",
      modelPanda: "$12/mo",
      chatGPT: "$20/mo",
      claude: "$20/mo",
    },
    {
      feature: "Model Switching",
      modelPanda: "Instant (Mid-conversation)",
      chatGPT: "No",
      claude: "No",
    },
    {
      feature: "Privacy",
      modelPanda: "No training on user data",
      chatGPT: "Opt-out required",
      claude: "Opt-out required",
    },
    {
      feature: "Free Tier",
      modelPanda: "20 msgs/day (All models)",
      chatGPT: "Limited (GPT-4o mini)",
      claude: "Very limited",
    },
  ];

  return (
    <div className={styles["compare-page"]}>
      <header className={styles.header}>
        <h1>ModelPanda vs. The World</h1>
        <p>Why pay $60/month for 3 subscriptions when you can have it all for $12?</p>
      </header>

      <div className={styles["table-container"]}>
        <table className={styles["compare-table"]}>
          <thead>
            <tr>
              <th>Feature</th>
              <th>ModelPanda</th>
              <th>ChatGPT Plus</th>
              <th>Claude Pro</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((item, index) => (
              <tr key={index}>
                <td>{item.feature}</td>
                <td className={styles["model-name"]}>{item.modelPanda}</td>
                <td>{item.chatGPT}</td>
                <td>{item.claude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className={styles["cta-section"]}>
        <h2>Ready to simplify your AI workflow?</h2>
        <button 
          className={styles["cta-button"]}
          onClick={() => navigate(Path.Pricing)}
        >
          Join Pro Waitlist
        </button>
        <button 
          className={styles["back-link"]}
          onClick={() => navigate(Path.Home)}
        >
          ← Back to Home
        </button>
      </section>
    </div>
  );
}
