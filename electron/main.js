const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
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

const DESKTOP_ENTRY_ID = "claudemanager";

// AppImages don't register themselves in the Linux applications menu the way
// a .deb or an NSIS installer does — nothing else does this for us. Rewriting
// the entry on every launch (rather than once) keeps it self-healing if the
// user moves the AppImage file, since Exec always points at the current
// $APPIMAGE path.
function integrateAppImageDesktopEntry(appRoot) {
  if (!app.isPackaged || process.platform !== "linux" || !process.env.APPIMAGE) return;

  const appImagePath = process.env.APPIMAGE;
  const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
  const iconDir = path.join(dataHome, "icons", "hicolor", "512x512", "apps");
  const appsDir = path.join(dataHome, "applications");

  fs.mkdirSync(iconDir, { recursive: true });
  fs.mkdirSync(appsDir, { recursive: true });
  fs.copyFileSync(path.join(appRoot, "public", "icon-512.png"), path.join(iconDir, `${DESKTOP_ENTRY_ID}.png`));

  const desktopEntry = `[Desktop Entry]
Type=Application
Name=Claude Manager
Comment=Gerenciador local de sessões do Claude Code
Exec="${appImagePath}" %U
Icon=${DESKTOP_ENTRY_ID}
Terminal=false
Categories=Development;
StartupWMClass=ClaudeManager
`;
  fs.writeFileSync(path.join(appsDir, `${DESKTOP_ENTRY_ID}.desktop`), desktopEntry, { mode: 0o644 });

  // Best-effort refresh so the menu/icon show up without a re-login; both
  // tools are commonly missing (e.g. minimal window managers), so a failure
  // here is not fatal — the .desktop file is already in place either way.
  try {
    execFileSync("update-desktop-database", [appsDir], { stdio: "ignore" });
  } catch {}
  try {
    execFileSync("gtk-update-icon-cache", ["-f", "-t", path.join(dataHome, "icons", "hicolor")], {
      stdio: "ignore",
    });
  } catch {}
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
    try {
      integrateAppImageDesktopEntry(getAppRoot());
    } catch (err) {
      console.error("Desktop menu integration failed:", err);
    }
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
