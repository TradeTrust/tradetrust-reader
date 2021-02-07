const { ipcRenderer } = require('electron')

ipcRenderer.on('upload-form', function (event, data) {
  const base64 = window.btoa(data)
  window.postMessage({ type: 'LOAD_DOCUMENT', payload: base64 })
})
