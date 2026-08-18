const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { execFileSync } = require("node:child_process");

let mainWindow = null;
let httpServer = null;

// Project root in dev (unpackaged), or resources/app inside the installed
// package — both hold .next/, node_modules/, prisma/, electron/ side by side.
function getAppRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
}

// Applies any pending Prisma migrations to the user's own database. Safe to
// run on every launch — `migrate deploy` is a no-op when nothing is pending,
// creates the SQLite file from scratch on first run, and only ever applies
// forward, so shipping a new migration in an app update is enough to carry
// existing users' data to the new schema.
function runMigrations(appRoot, dbPath) {
  const prismaCli = path.join(appRoot, "node_modules", "prisma", "build", "index.js");
  const schemaPath = path.join(appRoot, "prisma", "schema.prisma");

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy", "--schema", schemaPath], {
    cwd: appRoot,
    env: {
      ...process.env,
      // Lets Electron's own binary act as a plain Node runtime for this
      // child process, since there's no separate Node executable bundled.
      ELECTRON_RUN_AS_NODE: "1",
      DATABASE_URL: `file:${dbPath}`,
    },
    stdio: "inherit",
  });
}

function prepareUserData(appRoot) {
  const userDataDir = app.getPath("userData");
  fs.mkdirSync(userDataDir, { recursive: true });

  const dbPath = path.join(userDataDir, "claude-manager.db");
  runMigrations(appRoot, dbPath);

  const uploadDir = path.join(userDataDir, "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  return { dbPath, uploadDir };
}

async function startNextServer() {
  const appRoot = getAppRoot();
  const { dbPath, uploadDir } = prepareUserData(appRoot);

  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.UPLOAD_DIR = uploadDir;
  process.env.NODE_ENV = "production";

  // Resolved from electron/main.js's own location, so this finds appRoot's
  // node_modules/next both in dev (project root) and once packaged.
  const next = require("next");
  const nextApp = next({ dev: false, dir: appRoot });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  return new Promise((resolve, reject) => {
    httpServer = http.createServer((req, res) => handle(req, res));
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", () => {
      resolve(httpServer.address().port);
    });
  });
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: "Claude Manager",
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(url);

  // In dev mode we point at `next dev`, which may not be ready the instant
  // Electron opens — retry instead of showing Chromium's error page.
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.on("did-fail-load", () => {
      setTimeout(() => mainWindow?.loadURL(url), 500);
    });
  }
}

// electron-updater can only self-update an AppImage on Linux (via its
// AppImageUpdater backend, active when the AppImage sets $APPIMAGE at
// runtime) or a signed installer on Windows/macOS. A .deb install has no
// in-app update path here — checking would just fail, so skip it.
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  if (process.platform === "linux" && !process.env.APPIMAGE) {
    console.log("Auto-update skipped: not running from an AppImage.");
    return;
  }

  autoUpdater.on("update-downloaded", async (info) => {
    const { response } = await dialog.showMessageBox({
      type: "info",
      buttons: ["Reiniciar agora", "Depois"],
      defaultId: 0,
      title: "Atualização disponível",
      message: `Claude Manager ${info.version} foi baixado. Reiniciar agora para aplicar?`,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-update failed:", err);
  });

  autoUpdater.checkForUpdates().catch((err) => {
    console.error("Auto-update check failed:", err);
  });
}

app.whenReady().then(async () => {
  try {
    const devUrl = process.env.ELECTRON_START_URL;
    if (devUrl) {
      createWindow(devUrl);
      return;
    }

    const port = await startNextServer();
    createWindow(`http://127.0.0.1:${port}`);
    setupAutoUpdate();
  } catch (err) {
    console.error("Failed to start Claude Manager:", err);
    dialog.showErrorBox(
      "Claude Manager não conseguiu iniciar",
      err instanceof Error ? err.message : String(err)
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  httpServer?.close();
});
