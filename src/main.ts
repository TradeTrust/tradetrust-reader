import { app, BrowserWindow, dialog } from "electron";
import { readFileSync } from "fs";
import * as path from "path";
import * as process from "process";

enum OS {
  WINDOW = process.platform === "darwin" ? 0 : 1,
  MAC = process.platform !== "darwin" ? 0 : 1,
}

const permittedExt: Array<string> = [".tt", ".oa", ".oc"];
const mainnetOpenCert = "https://www.opencerts.io/";
const mainnetTradeTrust = "https://www.tradetrust.io/";

let macFilePath: string | null = null;

// Return filePath
function getFilePath(): string | null {
  if ((process.env.NODE_ENV || "").trim() === "development") {
    return path.join(app.getAppPath(), "assets/demo.tt");
  }

  if (OS.MAC) {
    return macFilePath;
  }

  if (OS.WINDOW) {
    // process.argv[0] is exe path
    // process.argv[1] is open file path
    if (process.argv.length >= 2) {
      const windowFilePath = process.argv[1];
      return windowFilePath !== "." ? windowFilePath : null;
    }
  }
  return null;
}

function validateFile(filePath: string): string | null {
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

function createWindow(verifier: string): BrowserWindow | null {
  // Create the browser window.
  let mainWindow: BrowserWindow;
  if (BrowserWindow.getAllWindows().length > 0 && OS.MAC) {
    mainWindow = BrowserWindow.getFocusedWindow();
  } else {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      titleBarStyle: "hidden",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
  }

  try {
    mainWindow.loadURL(verifier);
    return mainWindow;
  } catch (e) {
    return null;
  }
}

function loadFile(mainWindow: BrowserWindow, filePath: string) {
  try {
    const fileData = readFileSync(filePath, "utf-8");
    mainWindow.webContents.send("upload-form", fileData);
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

  const mainWindow = createWindow(verifier);
  if (mainWindow === null) {
    dialog.showMessageBoxSync({
      type: "error",
      title: "Website Loading",
      message:
        "OpenAttestation reader unable to load verifier site. Please head to https://www.tradetrust.io/ or https://www.opencerts.io/",
    });
    app.quit();
    return;
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    if (!loadFile(mainWindow, filePath)) {
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

// This method will be called when Electron has detected
// file opening from macOS.
if (OS.MAC) {
  app.on("open-file", (_event: { preventDefault: () => void; }, path:string) => {
    macFilePath = path;
    if (BrowserWindow.getAllWindows().length > 0) {
      main();
    }
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  main();
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
