"use client";

import dynamic from "next/dynamic";

const DrawIOEditor = dynamic(() => import("@/components/draw/DrawIOEditor"), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center">Loading Diagram Editor...</div>,
});

export default function DrawClient() {
  return (
    <DrawIOEditor
      onSave={(xml) => {
        console.log("SAVE:", xml);
      }}
      onAutosave={(xml) => {
        console.log("AUTOSAVE:", xml);
      }}
      onExit={() => {
        console.log("EXIT");
      }}
    />
  );
}
