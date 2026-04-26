"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [xml, setXml] = useState(initialXml);
  const [isReady, setIsReady] = useState(false);

  const { mode, toggleTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Official Embed Mode URL
   * Docs:
   * https://www.drawio.com/doc/faq/embed-mode
   */
  const drawioUrl = useMemo(() => {
    const url = new URL("https://embed.diagrams.net/");

    url.searchParams.set("embed", "1");
    url.searchParams.set("proto", "json");
    url.searchParams.set("spin", "1");

    url.searchParams.set("configure", "1");
    url.searchParams.set("libraries", "1");

    // 👇 dynamic theme
    if (mode === "dark") {
      url.searchParams.set("dark", "1");
      url.searchParams.set("ui", "dark");
    } else {
      url.searchParams.set("dark", "0");
      url.searchParams.set("ui", "min");
    }

    return url.toString();
  }, [mode]);

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
    postMessage({
      action: "load",
      autosave: 1,
      xml,

      // UI
      title: "Untitled Diagram",
      saveAndExit: 1,
      noExitBtn: 0,
      noSaveBtn: 0,

      // Theme
      // dark: 0,
      // theme: "kennedy",

      // Sketch mode
      rough: 0,

      // Shape libraries
      libs: ["general", "uml", "er", "flowchart", "aws4", "bpmn"],
    });
  }, [postMessage, xml]);

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

  useEffect(() => {
    setIsReady(false);
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
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      let msg: DrawIOMessage;

      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      switch (msg.event) {
        /**
         * configure=1
         * draw.io waits for configuration before init
         */
        case "configure":
          postMessage({
            action: "configure",
            config: {
              defaultFonts: ["Inter"],
              defaultVertexStyle: {
                rounded: 1,
                arcSize: 12,
              },
            },
          });
          break;

        /**
         * Editor ready
         */
        case "init":
          setIsReady(true);
          loadDiagram();
          break;

        /**
         * Initial diagram loaded
         */
        case "load":
          console.log("Diagram loaded");
          break;

        /**
         * Autosave event
         */
        case "autosave":
          if (msg.xml) {
            setXml(msg.xml);
            onAutosave?.(msg.xml);
          }
          break;

        /**
         * Manual save
         */
        case "save":
          if (msg.xml) {
            setXml(msg.xml);
            onSave?.(msg.xml);

            console.log("Saved XML:", msg.xml);
          }

          if (msg.exit) {
            onExit?.();
          }

          break;

        /**
         * Export result
         */
        case "export":
          if (!msg.data) return;

          // Download exported file
          const link = document.createElement("a");

          link.href = msg.data;

          link.download = msg.format === "svg" ? "diagram.svg" : "diagram.png";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          break;

        /**
         * Exit editor
         */
        case "exit":
          onExit?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [loadDiagram, onAutosave, onExit, onSave, postMessage]);

  useEffect(() => {
    setIsTransitioning(true);

    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // match CSS duration

    return () => clearTimeout(timeout);
  }, [mode]);

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

        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#0E0F12]">
            <div className="text-sm text-neutral-500">Loading diagrams.net...</div>
          </div>
        )}

        <iframe
          key={`${mode}-${drawioUrl}`} // 🔥 force remount
          ref={iframeRef}
          title="drawio-editor"
          src={drawioUrl}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
