const { app, BrowserWindow, dialog } = require("electron");
const { readFileSync } = require("fs");
const path = require("path");
const process = require("process");

const permittedExt = [".tt", ".oa", ".oc"];
const mainnetOpenCert = "https://www.opencerts.io/";
const mainnetTradeTrust = "https://www.tradetrust.io/";

let macFilePath = null;
const isDev = (process.env.NODE_ENV || "") === "development";

function getFilePath() {
  let filePath = null;
  if (macFilePath === null) {
    if (process.argv.length >= 2 && process.argv[1] !== ".") {
      filePath = process.argv[1];
    }
  } else {
    filePath = macFilePath;
  }

  if (isDev) {
    filePath = path.join(app.getAppPath(), "demo.tt");
  }
 
  return filePath;
}

function validateFile(filePath) {
  const extIndex = permittedExt.indexOf(path.extname(filePath));
  switch (extIndex) {
    case 0:
    case 1:
      return mainnetTradeTrust;
    case 2:
      return mainnetOpenCert;
    default:
      return null;
  }
}

function createWindow(verifier) {
  try {
    let win;

    if (
      BrowserWindow.getAllWindows().length > 0 &&
      process.platform === "darwin"
    ) {
      win = BrowserWindow.getFocusedWindow();
    } else {
      win = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: "hidden",
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(app.getAppPath(), "renderer.js"),
        },
      });
    }

    win.loadURL(verifier);

    return win;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function loadFile(win, filePath) {
  try {
    const fileData = readFileSync(filePath, "utf-8");
    win.webContents.send("upload-form", fileData);
    return true;
  } catch (e) {
    return false;
  }
}

function main() {
  const filePath = getFilePath();
  if (filePath === null) {
    dialog.showMessageBoxSync({
      type: "error",
      title: "No File Input Found",
      message:
        "No file found. Please open the document with OpenAttestation Reader.",
    });
    app.quit();
    return;
  }

  const verifier = validateFile(filePath);
  if (verifier === null) {
    dialog.showMessageBoxSync({
      type: "error",
      title: "Unsupported File Type",
      message:
        "OpenAttestation reader could not open file because it is not a supported file type",
    });
    app.quit();
    return;
  }

  const win = createWindow(verifier);
  if (win === null) {
    dialog.showMessageBoxSync({
      type: "error",
      title: "Website Loading",
      message:
        "OpenAttestation reader unable to load verifier site. Please head to https://www.tradetrust.io/ or https://www.opencerts.io/",
    });
    app.quit();
    return;
  }

  win.once("ready-to-show", () => {
    win.maximize();
    if (!loadFile(win, filePath)) {
      dialog.showMessageBoxSync({
        type: "error",
        title: "File Reading Error",
        message: "OpenAttestation reader have error in reading file.",
      });
      app.quit();
      return;
    }
  });
}

//  Read open-file for macOS
app.on("open-file", (event, path) => {
  event.preventDefault();
  macFilePath = path;
  if (BrowserWindow.getAllWindows().length > 0) {
    main();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(main);
