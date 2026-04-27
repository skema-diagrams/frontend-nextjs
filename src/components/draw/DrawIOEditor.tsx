"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrawIOMessage {
  event?: "configure" | "init" | "save" | "autosave" | "exit" | "load" | "export";
  xml?: string;
  data?: string;
  format?: string;
  exit?: boolean;
}

interface DrawIOEditorProps {
  initialXml?: string;
  onSave?: (xml: string) => void;
  onAutosave?: (xml: string) => void;
  onExit?: () => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_XML = `
<mxfile host="app.diagrams.net">
  <diagram id="default" name="Page-1">
    <mxGraphModel dx="1322" dy="794" grid="1" gridSize="10" guides="1"
      tooltips="1" connect="1" arrows="1" fold="1" page="1"
      pageScale="1" pageWidth="850" pageHeight="1100"
      math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

const LOAD_TIMEOUT_MS = 10_000;
const REINIT_DELAY_MS = 50;

const LOAD_PAYLOAD = {
  action: "load",
  autosave: 1,
  title: "Untitled Diagram",
  saveAndExit: 1,
  noExitBtn: 0,
  noSaveBtn: 0,
  rough: 0,
  libs: ["general", "uml", "er", "flowchart", "aws4", "bpmn"],
} as const;

const CONFIGURE_PAYLOAD = {
  action: "configure",
  config: {
    defaultFonts: ["Inter"],
    defaultVertexStyle: { rounded: 1, arcSize: 12 },
  },
} as const;

const BUTTON_CLASS =
  "rounded-lg border px-4 py-2 text-sm transition-colors " +
  "border-[#D0D5DD] bg-white text-[#101828] hover:bg-neutral-100 " +
  "dark:border-[#2A2D31] dark:bg-[#141518] dark:text-[#F5F5F5] dark:hover:bg-[#1D2025]";

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrawIOEditor({
  initialXml = DEFAULT_XML,
  onSave,
  onAutosave,
  onExit,
  className,
}: DrawIOEditorProps) {
  const { mode, toggleTheme } = useTheme();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const isMountedRef  = useRef(true);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xmlRef        = useRef(initialXml);
  const onSaveRef     = useRef(onSave);
  const onAutosaveRef = useRef(onAutosave);
  const onExitRef     = useRef(onExit);

  // Keep callback refs fresh without causing re-renders
  useEffect(() => { onSaveRef.current     = onSave;     }, [onSave]);
  useEffect(() => { onAutosaveRef.current = onAutosave; }, [onAutosave]);
  useEffect(() => { onExitRef.current     = onExit;     }, [onExit]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [isReady,       setIsReady]       = useState(false);
  const [loadError,     setLoadError]     = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Derived URL ───────────────────────────────────────────────────────────
  const drawioUrl = useMemo(() => {
    const url = new URL("https://embed.diagrams.net/");
    url.searchParams.set("embed",     "1");
    url.searchParams.set("proto",     "json");
    url.searchParams.set("spin",      "1");
    url.searchParams.set("configure", "1");
    url.searchParams.set("libraries", "1");
    url.searchParams.set("dark", mode === "dark" ? "1" : "0");
    url.searchParams.set("ui",   mode === "dark" ? "dark" : "min");
    return url.toString();
  }, [mode]);

  // Keep URL ref in sync for use inside layout effect
  const drawioUrlRef = useRef(drawioUrl);
  useEffect(() => { drawioUrlRef.current = drawioUrl; }, [drawioUrl]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const postToFrame = useCallback((message: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), "*");
  }, []);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  // ── Public actions ────────────────────────────────────────────────────────
  const requestSave = useCallback(() => postToFrame({ action: "save" }), [postToFrame]);

  const exportPNG = useCallback(() =>
    postToFrame({ action: "export", format: "png", spin: "Exporting...", transparent: false, currentPage: true, scale: 2 }),
  [postToFrame]);

  const exportSVG = useCallback(() =>
    postToFrame({ action: "export", format: "svg", currentPage: true }),
  [postToFrame]);

  // ── iframe onLoad ─────────────────────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    setLoadError(false);
    setIsReady(false);
    clearLoadTimeout();

    loadTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsReady((ready) => {
        if (!ready) {
          console.error("diagrams.net failed to initialize within 10 s");
          setLoadError(true);
        }
        return ready;
      });
    }, LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retryLoad = useCallback(() => {
    setLoadError(false);
    setIsReady(false);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const src = iframe.src;
    iframe.src = "";
    setTimeout(() => { if (iframeRef.current) iframeRef.current.src = src; }, 100);
  }, []);

  // ── Theme transition overlay ──────────────────────────────────────────────
  useEffect(() => {
    setIsTransitioning(true);
    const t = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(t);
  }, [mode]);

  // ── Core message handler + iframe reinit on navigation ───────────────────
  useLayoutEffect(() => {
    isMountedRef.current = true;

    const onMessage = (event: MessageEvent) => {
      if (!isMountedRef.current || !event.data) return;

      let msg: DrawIOMessage;
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      switch (msg.event) {
        case "configure":
          postToFrame(CONFIGURE_PAYLOAD);
          break;

        case "init":
          setIsReady(true);
          clearLoadTimeout();
          postToFrame({ ...LOAD_PAYLOAD, xml: xmlRef.current });
          break;

        case "autosave":
          if (msg.xml) {
            xmlRef.current = msg.xml;
            onAutosaveRef.current?.(msg.xml);
          }
          break;

        case "save":
          if (msg.xml) {
            xmlRef.current = msg.xml;
            onSaveRef.current?.(msg.xml);
          }
          if (msg.exit) onExitRef.current?.();
          break;

        case "export": {
          if (!msg.data) return;
          const a = document.createElement("a");
          a.href = msg.data;
          a.download = msg.format === "svg" ? "diagram.svg" : "diagram.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break;
        }

        case "exit":
          onExitRef.current?.();
          break;
      }
    };

    window.addEventListener("message", onMessage);

    // Reinitialize the iframe on every real mount.
    // The 50 ms timer distinguishes a real mount from StrictMode's fake
    // unmount+remount (which happens synchronously and cancels the timer).
    const reinitTimer = setTimeout(() => {
      if (!isMountedRef.current || !iframeRef.current) return;
      iframeRef.current.src = drawioUrlRef.current;
    }, REINIT_DELAY_MS);

    return () => {
      isMountedRef.current = false;
      clearTimeout(reinitTimer);
      clearLoadTimeout();
      window.removeEventListener("message", onMessage);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  const isDark = mode === "dark";

  return (
    <div className={className ?? "flex h-screen w-full flex-col bg-neutral-100"}>

      {/* Toolbar */}
      <div className={`flex items-center justify-between border-b px-4 py-3 transition-colors duration-300 ${
        isDark ? "bg-[#101113] border-[#2A2D31]" : "bg-white border-[#E4E7EC]"
      }`}>
        <Link href="/"><button className={BUTTON_CLASS}>HOME</button></Link>

        <div>
          <h1 className={`text-sm font-semibold ${isDark ? "text-[#F5F5F5]" : "text-[#111827]"}`}>
            Draw.io Embedded Editor
          </h1>
          <p className={`text-xs ${isDark ? "text-[#A0A7B4]" : "text-neutral-500"}`}>
            diagrams.net Embed Mode + postMessage API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={requestSave}  className={BUTTON_CLASS}>Save</button>
          <button onClick={exportPNG}    className={BUTTON_CLASS}>Export PNG</button>
          <button onClick={exportSVG}    className={BUTTON_CLASS}>Export SVG</button>
          <button onClick={toggleTheme}  className={BUTTON_CLASS}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">

        {/* Theme-change fade overlay */}
        <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${
          isTransitioning
            ? isDark ? "bg-[#0E0F12] opacity-100" : "bg-white opacity-100"
            : "opacity-0"
        }`} />

        {/* Loading state */}
        {!isReady && !loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#0E0F12]">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading diagrams.net...</p>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full w-1/2 animate-pulse bg-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#0E0F12]">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-red-500">Failed to load diagrams.net editor</p>
              <button onClick={retryLoad} className={BUTTON_CLASS}>Retry</button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title="drawio-editor"
          src={drawioUrl}
          onLoad={handleIframeLoad}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
