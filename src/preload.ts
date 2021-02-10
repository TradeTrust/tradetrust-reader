import { ipcRenderer } from 'electron'

ipcRenderer.on('upload-form', function (_, data) {
  const base64 = window.btoa(data)
  window.postMessage({ type: 'LOAD_DOCUMENT', payload: base64 }, null)
})
