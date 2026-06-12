/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_CHANGE_MONITORING?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
