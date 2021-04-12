import { ipcRenderer } from "electron";

ipcRenderer.on("upload-form", (_event, msg) => {
  const base64 = window.btoa(msg);
  window.postMessage({ type: "NESTED_DOCUMENT_LOAD", payload: base64 }, null);
});
