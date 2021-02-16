import { ipcRenderer } from "electron";

ipcRenderer.on("upload-form", (_event, msg) => {
  const base64 = window.btoa(msg);
  window.postMessage({ type: "LOAD_DOCUMENT", payload: base64 }, null);
});
