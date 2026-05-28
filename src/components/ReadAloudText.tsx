// src/components/ReadAloudText.tsx
//
// Drop-in replacement for the dangerouslySetInnerHTML prose div.
// When TTS is active it overlays a word-level highlight on the currently
// spoken word by synchronising with useReadAloud's `wordIndex` + `tokens`.
//
// Implementation strategy
// ───────────────────────
// SpeechSynthesis.onboundary fires with charIndex into the *plain-text*
// string.  We can't annotate every word in the raw HTML because that would
// break the markup.  Instead we:
//   1. Render the HTML as-is into a hidden div (for screen readers / SEO).
//   2. Build a flat array of {word, charIndex} tokens from the plain text.
//   3. When a word is active, find its bounding rect via a temporary <mark>
//      injected into the rendered DOM, then position an absolutely-placed
//      highlight pill over it.
//
// This approach:
//   • Never mutates the rendered HTML string.
//   • Works with any arbitrary HTML (bold, italic, nested tags, etc.).
//   • Falls back gracefully when getBoundingClientRect is unavailable.

import { useEffect, useRef, useState } from "react";
import type { WordToken } from "@/hooks/useReadAloud";

interface Props {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  /** Index of the currently spoken word (-1 = none) */
  wordIndex: number;
  /** Token list from useReadAloud */
  tokens: WordToken[];
  isActive: boolean; // playing or paused
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Given a charIndex into the plain-text content of a container element,
 * return the bounding rect of those characters by walking the text nodes.
 */
function getRectForCharIndex(
  container: HTMLElement,
  charIndex: number,
  length: number,
): HighlightRect | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const nodeLen = node.textContent?.length ?? 0;
    if (offset + nodeLen > charIndex) {
      // The target character starts in this text node
      const localStart = charIndex - offset;
      const localEnd = Math.min(localStart + length, nodeLen);

      const range = document.createRange();
      range.setStart(node, localStart);
      range.setEnd(node, localEnd);

      const rects = Array.from(range.getClientRects());
      if (rects.length === 0) return null;

      // Use the first rect (handles line-wrapped words)
      const r = rects[0];
      const containerRect = container.getBoundingClientRect();

      return {
        top: r.top - containerRect.top + container.scrollTop,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height,
      };
    }
    offset += nodeLen;
  }
  return null;
}

export default function ReadAloudText({
  html,
  className = "",
  style,
  wordIndex,
  tokens,
  isActive,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  // Auto-scroll the highlighted word into view
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (!isActive) {
      setHighlight(null);
      return;
    }
    if (wordIndex < 0 || wordIndex >= tokens.length) {
      setHighlight(null);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const token = tokens[wordIndex];
    const rect = getRectForCharIndex(
      container,
      token.charIndex,
      token.word.length,
    );
    setHighlight(rect);

    // Scroll word into view (only if user hasn't manually scrolled away)
    if (rect && shouldScrollRef.current) {
      const absTop =
        rect.top + container.getBoundingClientRect().top + window.scrollY;
      const viewH = window.innerHeight;
      const wordAbsBottom = absTop + rect.height;
      const viewBottom = window.scrollY + viewH;

      // If word is below lower 30% of viewport, scroll gently
      if (wordAbsBottom > viewBottom - viewH * 0.3) {
        window.scrollTo({
          top: absTop - viewH * 0.4,
          behavior: "smooth",
        });
      }
    }
  }, [wordIndex, tokens, isActive]);

  // Pause auto-scroll when user manually scrolls
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const fn = () => {
      shouldScrollRef.current = false;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        shouldScrollRef.current = true;
      }, 3000);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      window.removeEventListener("scroll", fn);
      clearTimeout(timeout);
    };
  }, []);

  // Extract layout from className to ensure the relative container
  // has the same box as the text container (fixing highlight alignment)
  const layoutClasses = className
    .split(" ")
    .filter((c) => c.startsWith("max-w-") || c === "mx-auto")
    .join(" ");

  return (
    <div className={`relative ${layoutClasses}`}>
      {/* ── Actual rendered HTML ── */}
      <div
        ref={containerRef}
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* ── Highlight pill (absolutely positioned over the current word) ── */}
      {isActive && highlight && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: highlight.top - 2,
            left: highlight.left - 3,
            width: highlight.width + 6,
            height: highlight.height + 4,
            borderRadius: 4,
            pointerEvents: "none",
            transition: "top 80ms ease, left 80ms ease, width 80ms ease",
            zIndex: 1,
          }}
          className="bg-yellow-300/50 dark:bg-yellow-400/25 mix-blend-multiply dark:mix-blend-screen"
        />
      )}
    </div>
  );
}
