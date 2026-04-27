"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";

type DrawIOEvent = "configure" | "init" | "save" | "autosave" | "exit" | "load" | "export";

interface DrawIOMessage {
  event?: DrawIOEvent;
  xml?: string;
  data?: string;
  format?: string;
  exit?: boolean;
  modified?: boolean;
}

interface DrawIOEditorProps {
  initialXml?: string;
  onSave?: (xml: string) => void;
  onAutosave?: (xml: string) => void;
  onExit?: () => void;
  className?: string;
}

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

export default function DrawIOEditor({
  initialXml = DEFAULT_XML,
  onSave,
  onAutosave,
  onExit,
  className,
}: DrawIOEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  const [xml, setXml] = useState(initialXml);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const { mode, toggleTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xmlRef = useRef(initialXml); // Keep XML in ref for persistence

  // Keep callback refs fresh
  const onSaveRef = useRef(onSave);
  const onAutosaveRef = useRef(onAutosave);
  const onExitRef = useRef(onExit);

  // Update refs when callbacks change
  useEffect(() => {
    onSaveRef.current = onSave;
    onAutosaveRef.current = onAutosave;
    onExitRef.current = onExit;
  }, [onSave, onAutosave, onExit]);

  // Update ref when xml state changes
  useEffect(() => {
    xmlRef.current = xml;
  }, [xml]);

  /**
   * Official Embed Mode URL
   * Docs:
   * https://www.drawio.com/doc/faq/embed-mode
   */
  // URL with dynamic theme - changes when mode changes
  const drawioUrl = useMemo(() => {
    const url = new URL("https://embed.diagrams.net/");

    url.searchParams.set("embed", "1");
    url.searchParams.set("proto", "json");
    url.searchParams.set("spin", "1");

    url.searchParams.set("configure", "1");
    url.searchParams.set("libraries", "1");

    // Dynamic theme based on current mode
    if (mode === "dark") {
      url.searchParams.set("dark", "1");
      url.searchParams.set("ui", "dark");
    } else {
      url.searchParams.set("dark", "0");
      url.searchParams.set("ui", "min");
    }

    return url.toString();
  }, [mode]); // Depends on mode - URL changes with theme
  const drawioUrlRef = useRef(drawioUrl);
  useEffect(() => {
    drawioUrlRef.current = drawioUrl;
  }, [drawioUrl]);

  /**
   * Send message to draw.io iframe
   */
  const postMessage = useCallback((message: unknown) => {
    if (!iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(JSON.stringify(message), "*");
  }, []);

  /**
   * Initial load
   */
  const loadDiagram = useCallback(() => {
    // Use the ref to get the latest XML, especially after theme changes
    postMessage({
      action: "load",
      autosave: 1,
      xml: xmlRef.current,

      // UI
      title: "Untitled Diagram",
      saveAndExit: 1,
      noExitBtn: 0,
      noSaveBtn: 0,

      // Sketch mode
      rough: 0,

      // Shape libraries
      libs: ["general", "uml", "er", "flowchart", "aws4", "bpmn"],
    });
  }, [postMessage]);

  /**
   * Save current diagram manually
   */
  const requestSave = useCallback(() => {
    postMessage({
      action: "save",
    });
  }, [postMessage]);

  /**
   * Export PNG
   */
  const exportPNG = useCallback(() => {
    postMessage({
      action: "export",
      format: "png",
      spin: "Exporting...",
      transparent: false,
      currentPage: true,
      scale: 2,
    });
  }, [postMessage]);

  /**
   * Export SVG
   */
  const exportSVG = useCallback(() => {
    postMessage({
      action: "export",
      format: "svg",
      currentPage: true,
    });
  }, [postMessage]);

  /**
   * Handle iframe load event
   */
  const handleIframeLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("Iframe loaded");
    setIframeLoaded(true);
    setLoadError(false);
    setIsReady(false);

    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    loadTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsReady((currentReady) => {
        if (!currentReady) {
          console.error("Diagrams.net failed to initialize within 10 seconds");
          setLoadError(true);
        }
        return currentReady;
      });
    }, 10000);
  }, []);

  /**
   * Retry loading the iframe
   */
  const retryLoad = useCallback(() => {
    setLoadError(false);
    setIsReady(false);
    setIframeLoaded(false);

    // Force iframe reload by changing src
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, []);

  /**
   * Handle theme transition animation
   */
  useEffect(() => {
    setIsTransitioning(true);

    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [mode]);

  // useEffect(() => {
  //   // After theme changes (iframe src changes),
  //   // immediately collapse the history entry
  //   const timeout = setTimeout(() => {
  //     window.history.replaceState(null, "", window.location.href);
  //   }, 0);

  //   return () => clearTimeout(timeout);
  // }, [drawioUrl]);

  /**
   * Handle iframe messages
   * Use useLayoutEffect to set up synchronously BEFORE browser paint
   * This ensures the handler is ready before the iframe can load
   */
  // useLayoutEffect(() => {
  //   console.log("Setting up message handler (useLayoutEffect)");
  //   isMountedRef.current = true;

  //   const handleMessage = (event: MessageEvent) => {
  //     // Only process messages if component is still mounted
  //     if (!isMountedRef.current || !event.data) return;

  //     let msg: DrawIOMessage;

  //     try {
  //       msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  //     } catch {
  //       return;
  //     }

  //     console.log("Received message from diagrams.net:", msg.event);

  //     switch (msg.event) {
  //       /**
  //        * configure=1
  //        * draw.io waits for configuration before init
  //        */
  //       case "configure":
  //         console.log("Sending configuration to diagrams.net");
  //         if (iframeRef.current?.contentWindow) {
  //           iframeRef.current.contentWindow.postMessage(
  //             JSON.stringify({
  //               action: "configure",
  //               config: {
  //                 defaultFonts: ["Inter"],
  //                 defaultVertexStyle: {
  //                   rounded: 1,
  //                   arcSize: 12,
  //                 },
  //               },
  //             }),
  //             "*",
  //           );
  //         }
  //         break;

  //       /**
  //        * Editor ready
  //        */
  //       case "init":
  //         console.log("Diagrams.net initialized, loading diagram");
  //         setIsReady(true);
  //         // Load diagram using the latest XML from ref
  //         if (iframeRef.current?.contentWindow) {
  //           iframeRef.current.contentWindow.postMessage(
  //             JSON.stringify({
  //               action: "load",
  //               autosave: 1,
  //               xml: xmlRef.current,
  //               title: "Untitled Diagram",
  //               saveAndExit: 1,
  //               noExitBtn: 0,
  //               noSaveBtn: 0,
  //               rough: 0,
  //               libs: ["general", "uml", "er", "flowchart", "aws4", "bpmn"],
  //             }),
  //             "*",
  //           );
  //         }
  //         break;

  //       /**
  //        * Initial diagram loaded
  //        */
  //       case "load":
  //         console.log("Diagram loaded successfully");
  //         break;

  //       /**
  //        * Autosave event
  //        */
  //       case "autosave":
  //         if (msg.xml) {
  //           setXml(msg.xml);
  //           onAutosaveRef.current?.(msg.xml);
  //         }
  //         break;

  //       /**
  //        * Manual save
  //        */
  //       case "save":
  //         if (msg.xml) {
  //           setXml(msg.xml);
  //           onSaveRef.current?.(msg.xml);

  //           console.log("Saved XML:", msg.xml);
  //         }

  //         if (msg.exit) {
  //           onExitRef.current?.();
  //         }

  //         break;

  //       /**
  //        * Export result
  //        */
  //       case "export":
  //         if (!msg.data) return;

  //         // Download exported file
  //         const link = document.createElement("a");

  //         link.href = msg.data;

  //         link.download = msg.format === "svg" ? "diagram.svg" : "diagram.png";

  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);

  //         break;

  //       /**
  //        * Exit editor
  //        */
  //       case "exit":
  //         onExitRef.current?.();
  //         break;

  //       default:
  //         break;
  //     }
  //   };

  //   window.addEventListener("message", handleMessage);
  //   console.log("Message handler attached");

  //   return () => {
  //     console.log("Cleaning up message handler");
  //     isMountedRef.current = false;
  //     window.removeEventListener("message", handleMessage);

  //     // Clear timeout on cleanup
  //     if (loadTimeoutRef.current) {
  //       clearTimeout(loadTimeoutRef.current);
  //       loadTimeoutRef.current = null;
  //     }
  //   };
  // }, []); // Empty deps - handler uses refs and functional setState, always fresh

  // Replace the entire useLayoutEffect block:

  useLayoutEffect(() => {
    isMountedRef.current = true;

    const handleMessage = (event: MessageEvent) => {
      if (!isMountedRef.current || !event.data) return;

      let msg: DrawIOMessage;
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      console.log("Received message from diagrams.net:", msg.event);

      switch (msg.event) {
        case "configure":
          console.log("Sending configuration to diagrams.net");
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                action: "configure",
                config: {
                  defaultFonts: ["Inter"],
                  defaultVertexStyle: { rounded: 1, arcSize: 12 },
                },
              }),
              "*",
            );
          }
          break;

        case "init":
          console.log("Diagrams.net initialized, loading diagram");
          setIsReady(true);
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                action: "load",
                autosave: 1,
                xml: xmlRef.current,
                title: "Untitled Diagram",
                saveAndExit: 1,
                noExitBtn: 0,
                noSaveBtn: 0,
                rough: 0,
                libs: ["general", "uml", "er", "flowchart", "aws4", "bpmn"],
              }),
              "*",
            );
          }
          break;

        case "load":
          console.log("Diagram loaded successfully");
          break;

        case "autosave":
          if (msg.xml) {
            setXml(msg.xml);
            xmlRef.current = msg.xml;
            onAutosaveRef.current?.(msg.xml);
          }
          break;

        case "save":
          if (msg.xml) {
            setXml(msg.xml);
            xmlRef.current = msg.xml;
            onSaveRef.current?.(msg.xml);
            console.log("Saved XML:", msg.xml);
          }
          if (msg.exit) onExitRef.current?.();
          break;

        case "export":
          if (!msg.data) return;
          const link = document.createElement("a");
          link.href = msg.data;
          link.download = msg.format === "svg" ? "diagram.svg" : "diagram.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;

        case "exit":
          onExitRef.current?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("Message handler attached");

    // Always reinitialize on real mount (not StrictMode fake mount).
    // Strategy: set src unconditionally after 50ms.
    // - StrictMode: mount1 sets timer → cleanup cancels it → mount2 sets new timer → fires → reinit ✅
    // - Navigate away mid-timer: cleanup sets isMountedRef=false → guard skips reinit ✅
    // - Normal first load: iframe hasn't loaded yet, setting src again is harmless ✅
    const reinitTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      const iframe = iframeRef.current;
      if (!iframe) return;
      console.log("Reinitializing iframe on mount");
      iframe.src = drawioUrlRef.current;
    }, 50);

    return () => {
      console.log("Cleaning up message handler");
      isMountedRef.current = false;
      clearTimeout(reinitTimer);
      window.removeEventListener("message", handleMessage);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, []);

  const buttonClass =
    "rounded-lg border px-4 py-2 text-sm transition-colors " +
    "border-[#D0D5DD] bg-white text-[#101828] hover:bg-neutral-100 " +
    "dark:border-[#2A2D31] dark:bg-[#141518] dark:text-[#F5F5F5] dark:hover:bg-[#1D2025]";

  return (
    <div className={className ?? "flex h-screen w-full flex-col bg-neutral-100"}>
      {/* Top Toolbar */}
      <div
        className={`flex items-center justify-between border-b px-4 py-3 transition-colors duration-300 ${
          mode === "dark" ? "bg-[#101113] border-[#2A2D31]" : "bg-white border-[#E4E7EC]"
        }`}
      >
        <Link href="/">
          <button className={buttonClass}>HOME</button>
        </Link>

        {/* TITLE SECTION */}
        <div>
          <h1 className={`text-sm font-semibold ${mode === "dark" ? "text-[#F5F5F5]" : "text-[#111827]"}`}>
            Draw.io Embedded Editor
          </h1>

          <p className={`text-xs ${mode === "dark" ? "text-[#A0A7B4]" : "text-neutral-500"}`}>
            diagrams.net Embed Mode + postMessage API
          </p>
        </div>

        {/* RIGHT BUTTONS */}
        <div className="flex items-center gap-2">
          <button onClick={requestSave} className={buttonClass}>
            Save
          </button>

          <button onClick={exportPNG} className={buttonClass}>
            Export PNG
          </button>

          <button onClick={exportSVG} className={buttonClass}>
            Export SVG
          </button>

          <button onClick={toggleTheme} className={buttonClass}>
            {mode === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Editor */}
      {/* <div className="relative flex-1 overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="text-sm text-neutral-500">Loading diagrams.net...</div>
          </div>
        )}

        <iframe ref={iframeRef} title="drawio-editor" src={drawioUrl} className="h-full w-full border-0" />
      </div> */}

      <div className="relative flex-1 overflow-hidden">
        {/* FADE OVERLAY */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${
            isTransitioning
              ? mode === "dark"
                ? "bg-[#0E0F12] opacity-100"
                : "bg-white opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Loading State */}
        {!isReady && !loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#0E0F12]">
            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading diagrams.net...</div>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full w-1/2 animate-pulse bg-blue-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#0E0F12]">
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-red-500">Failed to load diagrams.net editor</div>
              <button onClick={retryLoad} className={buttonClass}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Iframe with key based on mode to remount on theme change */}
        <iframe
          // key={mode}
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
