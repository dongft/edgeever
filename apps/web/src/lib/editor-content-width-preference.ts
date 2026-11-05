import { useEffect, useState } from "react";

/** Persisted, per-device editor content width. Stored as a plain pixel integer. */
export const EDITOR_CONTENT_WIDTH_STORAGE_KEY = "edgeever.editor-content-width";
export const EDITOR_CONTENT_WIDTH_CHANGED_EVENT = "edgeever:editor-content-width-changed";

export const EDITOR_CONTENT_WIDTH_OPTIONS = ["880", "1080", "1280", "1440", "1920"] as const;
export type EditorContentWidth = (typeof EDITOR_CONTENT_WIDTH_OPTIONS)[number];

export const DEFAULT_EDITOR_CONTENT_WIDTH: EditorContentWidth = "880";

let unsavedEditorContentWidth: EditorContentWidth | null = null;

const parseEditorContentWidth = (value: unknown): EditorContentWidth | null => {
  if (typeof value !== "string") return null;
  return (EDITOR_CONTENT_WIDTH_OPTIONS as readonly string[]).includes(value)
    ? (value as EditorContentWidth)
    : null;
};

export const resolveStoredEditorContentWidth = (stored: string | null): EditorContentWidth =>
  parseEditorContentWidth(stored) ?? DEFAULT_EDITOR_CONTENT_WIDTH;

export const readEditorContentWidthPreference = (): EditorContentWidth => {
  if (unsavedEditorContentWidth !== null) return unsavedEditorContentWidth;
  if (typeof window === "undefined") return DEFAULT_EDITOR_CONTENT_WIDTH;
  try {
    return resolveStoredEditorContentWidth(
      window.localStorage?.getItem(EDITOR_CONTENT_WIDTH_STORAGE_KEY) ?? null,
    );
  } catch {
    return DEFAULT_EDITOR_CONTENT_WIDTH;
  }
};

export const writeEditorContentWidthPreference = (value: string): EditorContentWidth => {
  const next = parseEditorContentWidth(value) ?? DEFAULT_EDITOR_CONTENT_WIDTH;
  if (typeof window === "undefined") {
    unsavedEditorContentWidth = next;
    return next;
  }
  try {
    window.localStorage?.setItem(EDITOR_CONTENT_WIDTH_STORAGE_KEY, next);
    unsavedEditorContentWidth = null;
  } catch {
    unsavedEditorContentWidth = next;
  }
  window.dispatchEvent(
    new CustomEvent(EDITOR_CONTENT_WIDTH_CHANGED_EVENT, { detail: next }),
  );
  return next;
};

export const useEditorContentWidthPreference = (): EditorContentWidth => {
  const [width, setWidth] = useState<EditorContentWidth>(readEditorContentWidthPreference);

  useEffect(() => {
    const syncWidth = () => setWidth(readEditorContentWidthPreference());
    const handleChanged = (event: Event) => {
      const detail = (event as CustomEvent<string | undefined>).detail;
      setWidth(parseEditorContentWidth(detail) ?? readEditorContentWidthPreference());
    };
    window.addEventListener(EDITOR_CONTENT_WIDTH_CHANGED_EVENT, handleChanged);
    window.addEventListener("storage", syncWidth);
    return () => {
      window.removeEventListener(EDITOR_CONTENT_WIDTH_CHANGED_EVENT, handleChanged);
      window.removeEventListener("storage", syncWidth);
    };
  }, []);

  return width;
};
