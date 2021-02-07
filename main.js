const { app, BrowserWindow, dialog } = require('electron')
const { readFileSync } = require('fs')
const path = require('path')

const permittedExt = ['.tt', '.json']
const mainnetTradeTrust = 'https://www.tradetrust.io/'

let win = null
let filePath = null

function validateFile () {
  if (filePath == null) {
    const args = window.process.argv
    return args.length >= 2 && permittedExt.includes(path.extname(args[1]))
  } else {
    return filePath != null && permittedExt.includes(path.extname(filePath))
  }
}

function createWindow (fileData) {
  win = new BrowserWindow({
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(window.__dirname, 'renderer.js')
    }
  })

  try {
    win.loadURL(mainnetTradeTrust)
    win.once('ready-to-show', () => {
      win.maximize()
      win.webContents.send('upload-form', fileData)
    })
  } catch (e) {
    console.log(e)
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Loading Error',
      message:
        'Unable to load. Please try on https://www.dev.tradetrust.io/'
    })
    app.quit()
  }
}

function readFile () {
  if (filePath == null) {
    filePath = window.process.argv[1]
  }

  try {
    return readFileSync(filePath, 'utf-8')
  } catch (e) {
    console.log(e)
    return null
  }
}

function main () {
  if (validateFile()) {
    const fileData = readFile()
    if (fileData == null) {
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'File Read Error',
        message: `An error occured while reading this file. \n${filePath}`
      })
      app.quit()
    } else {
      createWindow(fileData)
    }
  } else {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Unsupported File Type',
      message:
        'TradeTrust reader could not open file because it is not a supported file type or file not found.'
    })
    app.quit()
  }
}

//  Read open-file for macOS
app.on('will-finish-launching', () => {
  app.on('open-file', (event, path) => {
    event.preventDefault()
    filePath = path
    if (app.isReady() && validateFile()) {
      const fileData = readFile()
      win.webContents.send('upload-form', fileData)
    }
  })
})


app.on('window-all-closed', () => {
  if (window.process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(main)
