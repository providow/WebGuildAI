"use client";

import { useState } from "react";
import styles from "./PromptBar.module.css";

interface Props {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const EXAMPLES = [
  "A landing page for a coffee shop with a hero image, menu section, and contact form",
  "A personal portfolio with dark theme, animated skill bars, and project cards",
  "A weather dashboard with gradient cards showing temperature, humidity, and wind",
  "A todo app with drag-and-drop, priority tags, and smooth animations",
];

export default function PromptBar({ onGenerate, isGenerating }: Props) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) onGenerate(prompt.trim());
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          className={styles.textarea}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the website you want to build…"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
          }}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
          {isGenerating ? "Generating…" : "Build it"}
        </button>
      </form>
      <div className={styles.examples}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className={styles.pill}
            onClick={() => setPrompt(ex)}
            disabled={isGenerating}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
