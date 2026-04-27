"use client";

import DrawIOEditor from "@/components/draw/DrawIOEditor";

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
