// src/hooks/useReadAloud.ts
import { useState, useEffect, useCallback, useRef } from "react";

// ── helpers ────────────────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/**
 * Split plain text into an array of {word, charIndex}.
 * We keep punctuation attached to words so sentence boundaries feel natural.
 */
export interface WordToken {
  word: string;
  charIndex: number; // position of word[0] in the full plain-text string
}

export function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], charIndex: m.index });
  }
  return tokens;
}

// ── types ──────────────────────────────────────────────────────────────────────

export type ReadAloudStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error";

export interface ReadAloudState {
  status: ReadAloudStatus;
  wordIndex: number;
  tokens: WordToken[];
  isSupported: boolean;
  rate: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setRate: (r: number) => void;
  setSelectedVoice: (v: SpeechSynthesisVoice | null) => void;
}

interface TextChunk {
  text: string;
  charOffset: number;
  startTokenIndex: number;
}

function chunkify(text: string, allTokens: WordToken[]): TextChunk[] {
  if (!text) return [];

  const chunks: TextChunk[] = [];
  const sentenceRegex = /[.!?]+(?:\s|$)/g;
  let lastEnd = 0;
  
  const getNextTokenIdx = (pos: number) => {
    const idx = allTokens.findIndex((t) => t.charIndex >= pos);
    return idx === -1 ? allTokens.length : idx;
  };

  while (lastEnd < text.length) {
    const searchStart = lastEnd + 50; 
    
    if (searchStart >= text.length) {
      chunks.push({ 
        text: text.slice(lastEnd), 
        charOffset: lastEnd,
        startTokenIndex: getNextTokenIdx(lastEnd)
      });
      break;
    }

    sentenceRegex.lastIndex = searchStart;
    const match = sentenceRegex.exec(text);
    
    let breakIdx = -1;
    if (match && (match.index + match[0].length - lastEnd) < 500) {
      breakIdx = match.index + match[0].length;
    } else {
      const nextSpace = text.indexOf(" ", lastEnd + 400);
      if (nextSpace !== -1 && nextSpace < lastEnd + 600) {
        breakIdx = nextSpace + 1;
      } else {
        breakIdx = Math.min(lastEnd + 500, text.length);
      }
    }

    chunks.push({ 
      text: text.slice(lastEnd, breakIdx), 
      charOffset: lastEnd,
      startTokenIndex: getNextTokenIdx(lastEnd)
    });
    lastEnd = breakIdx;
  }

  return chunks;
}

// ── hook ───────────────────────────────────────────────────────────────────────

export function useReadAloud(
  htmlText: string | null | undefined,
): ReadAloudState {
  const [status, setStatusState] = useState<ReadAloudStatus>("idle");
  const [wordIndex, setWordIndexState] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [rate, setRateState] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem("r-tts-rate") ?? "1") || 1;
    } catch {
      return 1;
    }
  });

  // ── REFS (Source of Truth) ──────────────────────────────────────────────────
  const statusRef = useRef<ReadAloudStatus>("idle");
  const setStatus = (s: ReadAloudStatus) => {
    statusRef.current = s;
    setStatusState(s);
  };

  const wordIndexRef = useRef(-1);
  const setWordIndex = (idx: number) => {
    wordIndexRef.current = idx;
    setWordIndexState(idx);
  };

  const rateRef = useRef(rate);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicesReadyRef = useRef(false);

  const speakSessionRef = useRef(0);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chunksRef = useRef<TextChunk[]>([]);
  const currentChunkIdxRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const estimatedStepRef = useRef(0);
  const boundaryFiredRef = useRef(false);

  // ── setup ───────────────────────────────────────────────────────────────────
  const plainText = htmlText ? stripHtml(htmlText) : "";
  const tokens = useRef<WordToken[]>([]);
  useEffect(() => {
    tokens.current = tokenize(plainText);
  }, [plainText]);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startWatchdog = useCallback(() => {
    clearWatchdog();
    watchdogRef.current = setInterval(() => {
      // Manual mode check
      if (statusRef.current === "playing" && !window.speechSynthesis.paused) {
        window.speechSynthesis.resume(); 
      }
    }, 10_000);
  }, [clearWatchdog]);

  const applyVoices = useCallback(
    (list: SpeechSynthesisVoice[]) => {
      if (list.length === 0) return;
      voicesReadyRef.current = true;
      setVoices(list);
      setSelectedVoiceState((prev) => {
        let final = prev;
        if (!final) {
          try {
            const saved = localStorage.getItem("r-tts-voice");
            if (saved) {
              const found = list.find((v) => v.name === saved);
              if (found) final = found;
            }
          } catch (e) {
            console.warn("TTS Voice Load Error", e);
          }
        }
        if (!final) {
          final = list.find((v) => v.lang === "id-ID") ||
                  list.find((v) => v.lang.startsWith("id")) ||
                  null;
        }
        voiceRef.current = final;
        return final;
      });
    },
    [],
  );

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setIsSupported(true);

    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        applyVoices(voices);
        const utter = new SpeechSynthesisUtterance("");
        utter.volume = 0;
        window.speechSynthesis.speak(utter);
      }
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    const t1 = setTimeout(load, 200);
    const t2 = setTimeout(load, 1500);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [applyVoices]);

  const startHeartbeat = useCallback((_startIdx: number, speakRate: number) => {
    clearHeartbeat();
    boundaryFiredRef.current = false;
    const intervalMs = 480 / speakRate;

    heartbeatRef.current = setInterval(() => {
      if (boundaryFiredRef.current || statusRef.current !== "playing") {
        clearHeartbeat();
        return;
      }
      estimatedStepRef.current++;
      const currentChunk = chunksRef.current[currentChunkIdxRef.current];
      if (!currentChunk) return;

      const nextIdx = currentChunk.startTokenIndex + estimatedStepRef.current;
      const nextChunkStartToken = chunksRef.current[currentChunkIdxRef.current + 1]?.startTokenIndex ?? tokens.current.length;
      
      if (nextIdx < nextChunkStartToken) {
        setWordIndex(nextIdx);
      }
    }, intervalMs);
  }, [clearHeartbeat]);

  // ── core speak engine ───────────────────────────────────────────────────────
  const doSpeak = useCallback(
    (text: string, startAtChunk = 0, startAtWord = -1) => {
      if (!text || !isSupported) return;

      const sessionId = ++speakSessionRef.current;

      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearHeartbeat();
      clearWatchdog();

      setStatus("loading");
      // Only reset UI if starting a completely new chapter session
      if (startAtWord === -1 && startAtChunk === 0) {
        setWordIndex(-1);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (speakSessionRef.current !== sessionId) return;
        if (statusRef.current === "loading") setStatus("idle");
      }, 10_000);

      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        if (speakSessionRef.current !== sessionId) return;

        let availableVoices = window.speechSynthesis.getVoices();
        if (!voicesReadyRef.current || availableVoices.length === 0) {
          applyVoices(availableVoices);
          availableVoices = window.speechSynthesis.getVoices();
        }

        if (chunksRef.current.length === 0 || startAtChunk === 0) {
            chunksRef.current = chunkify(text, tokens.current);
        }
        currentChunkIdxRef.current = startAtChunk;

        const speakCurrentChunk = (isFirstChunkInSession = false) => {
          if (speakSessionRef.current !== sessionId) return;

          const idx = currentChunkIdxRef.current;
          if (idx >= chunksRef.current.length) {
            setStatus("idle");
            setWordIndex(-1);
            clearWatchdog();
            clearHeartbeat();
            currentChunkIdxRef.current = 0;
            utteranceRef.current = null;
            return;
          }

          const chunk = chunksRef.current[idx];
          try {
            // WORD-LEVEL RESUME via Slicing
            let chunkText = chunk.text;
            let resumeRelativeOffset = 0;
            let initialTokenOffset = 0;

            if (isFirstChunkInSession && startAtWord >= 0) {
                const targetToken = tokens.current[startAtWord];
                if (targetToken) {
                    resumeRelativeOffset = targetToken.charIndex - chunk.charOffset;
                    if (resumeRelativeOffset > 0) {
                        chunkText = chunk.text.slice(resumeRelativeOffset);
                        initialTokenOffset = startAtWord - chunk.startTokenIndex;
                    }
                }
            }

            utteranceRef.current = new SpeechSynthesisUtterance(chunkText);
            
            // ALWAYS use most recent Ref values
            utteranceRef.current.rate = rateRef.current;
            utteranceRef.current.pitch = 1;
            utteranceRef.current.volume = 1;

            const resolvedVoice =
              voiceRef.current ??
              availableVoices.find((v) => v.lang.startsWith("id") && v.localService) ??
              availableVoices.find((v) => v.lang === "id-ID") ??
              availableVoices.find((v) => v.lang.startsWith("id")) ??
              null;

            if (resolvedVoice) {
              utteranceRef.current.voice = resolvedVoice;
              utteranceRef.current.lang = resolvedVoice.lang;
            } else {
              utteranceRef.current.lang = "id-ID";
            }

            utteranceRef.current.onstart = () => {
              if (speakSessionRef.current !== sessionId) return;
              if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
              
              setStatus("playing");
              startWatchdog();

              const finalStartWord = isFirstChunkInSession && startAtWord >= 0 ? startAtWord : chunk.startTokenIndex;
              setWordIndex(finalStartWord);
              estimatedStepRef.current = initialTokenOffset;
              startHeartbeat(finalStartWord, rateRef.current);
            };

            utteranceRef.current.onboundary = (e) => {
              if (speakSessionRef.current !== sessionId) return;
              if (e.name !== "word") return;
              boundaryFiredRef.current = true;
              clearHeartbeat();
              
              const globalCi = chunk.charOffset + resumeRelativeOffset + e.charIndex;
              let lo = 0;
              let hi = tokens.current.length - 1;
              let best = -1;
              while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (tokens.current[mid].charIndex <= globalCi) {
                  best = mid;
                  lo = mid + 1;
                } else {
                  hi = mid - 1;
                }
              }
              if (best >= 0) setWordIndex(best);
            };

            utteranceRef.current.onend = () => {
              if (speakSessionRef.current !== sessionId) return;
              clearHeartbeat();
              utteranceRef.current = null;
              
              if (statusRef.current === "playing") {
                currentChunkIdxRef.current += 1;
                setTimeout(() => speakCurrentChunk(false), 100);
              }
            };

            utteranceRef.current.onerror = (e) => {
              if (speakSessionRef.current !== sessionId) return;
              if (e.error === "interrupted" || e.error === "canceled") return;
              
              console.error("TTS Error:", e.error);
              if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
              clearHeartbeat();
              setStatus("error");
              setWordIndex(-1);
              clearWatchdog();
              utteranceRef.current = null;
            };

            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utteranceRef.current);
          } catch (err) {
            console.error("TTS Crash:", err);
            setStatus("error");
          }
        };

        speakCurrentChunk(true);
      }, 400); // 400ms buffer for hardware cleanup
    },
    [isSupported, applyVoices, clearHeartbeat, clearWatchdog, startWatchdog, startHeartbeat],
  );

  const play = useCallback(() => {
    if (!isSupported || !plainText) return;

    if (statusRef.current === "paused" || statusRef.current === "idle" || statusRef.current === "error" || statusRef.current === "loading") {
      const idx = currentChunkIdxRef.current >= 0 ? currentChunkIdxRef.current : 0;
      const resumeFromWord = (statusRef.current === "paused" || statusRef.current === "loading") ? wordIndexRef.current : -1;
      doSpeak(plainText, idx, resumeFromWord);
    }
  }, [isSupported, plainText, doSpeak]);

  const pause = useCallback(() => {
    if (statusRef.current === "playing" || statusRef.current === "loading") {
      setStatus("paused");
      window.speechSynthesis.cancel();
      clearWatchdog();
      clearHeartbeat();
    }
  }, [clearWatchdog, clearHeartbeat]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    clearWatchdog();
    clearHeartbeat();
    setStatus("idle");
    setWordIndex(-1);
    currentChunkIdxRef.current = 0;
    utteranceRef.current = null;
    estimatedStepRef.current = 0;
    boundaryFiredRef.current = false;
  }, [clearWatchdog, clearHeartbeat]);

const setRate = useCallback((r: number) => {
  setRateState(r);
  rateRef.current = r;
    try {
      localStorage.setItem("r-tts-rate", r.toString());
    } catch (e) {
      console.warn("TTS Store Rate Error", e);
    }

 if (statusRef.current !== "idle" && statusRef.current !== "error") {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (statusRef.current === "idle" || statusRef.current === "error") return;

      // Gunakan trigger yang sama seperti pause → resume
      pause();                        // simpan wordIndex, batalkan utterance
      setTimeout(() => play(), 0);    // lanjutkan dari posisi tersimpan
    }, 150);
  }
}, [pause, play]); 

  const setSelectedVoice = useCallback((v: SpeechSynthesisVoice | null) => {
    setSelectedVoiceState(v);
    voiceRef.current = v; // Update Ref IMMEDIATELY
    try {
      if (v) localStorage.setItem("r-tts-voice", v.name);
      else localStorage.removeItem("r-tts-voice");
    } catch (e) {
      console.warn("TTS Store Voice Error", e);
    }

  if (statusRef.current !== "idle" && statusRef.current !== "error") {
    pause();
    setTimeout(() => play(), 0);
  }
}, [pause, play]);

  return {
    status,
    wordIndex,
    tokens: tokens.current,
    isSupported,
    rate,
    voices,
    selectedVoice,
    play,
    pause,
    stop,
    setRate,
    setSelectedVoice,
  };
}