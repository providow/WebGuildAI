"use client";

import { useEffect, useRef } from "react";
import styles from "./Preview.module.css";

interface Props {
  html: string;
  isGenerating: boolean;
}

export default function Preview({ html, isGenerating }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html || EMPTY_STATE);
    doc.close();
  }, [html]);

  return (
    <div className={styles.wrapper}>
      {isGenerating && (
        <div className={styles.overlay}>
          <div className={styles.pulse} />
          <span>Building your website…</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className={styles.iframe}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Website Preview"
      />
    </div>
  );
}

const EMPTY_STATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f0f13;
    color: #6b6b80;
    font-family: system-ui, sans-serif;
    flex-direction: column;
    gap: 16px;
  }
  svg { opacity: 0.3; }
  p { font-size: 14px; }
</style>
</head>
<body>
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <path d="M3 9h18M9 21V9"/>
</svg>
<p>Your website preview will appear here</p>
</body>
</html>`;
