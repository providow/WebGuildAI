"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import PromptBar from "@/components/PromptBar";
import Preview from "@/components/Preview";
import styles from "./page.module.css";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

type ActiveTab = "preview" | "code";

export default function Home() {
  const [html, setHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setHtml("");
    setActiveTab("preview");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setHtml(accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Generation failed");
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          WebGuildAI
        </div>
        <span className={styles.badge}>Powered by Claude Opus 4</span>
      </header>

      <div className={styles.promptSection}>
        <PromptBar onGenerate={generate} isGenerating={isGenerating} />
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.workspace}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "preview" ? styles.active : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            Preview
          </button>
          <button
            className={`${styles.tab} ${activeTab === "code" ? styles.active : ""}`}
            onClick={() => setActiveTab("code")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Code
            {html && <span className={styles.dot} />}
          </button>
        </div>

        <div className={styles.panel}>
          {activeTab === "preview" ? (
            <Preview html={html} isGenerating={isGenerating} />
          ) : (
            <div className={styles.editorWrapper}>
              <CodeEditor value={html} onChange={setHtml} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
