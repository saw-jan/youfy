const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { existsSync, mkdirSync, writeFileSync } = require("fs");
const { getConfigPath, isMac } = require("./utils/system");

const windowConfig = {
    width: 400,
    height: 140,
    minWidth: 400,
    minHeight: 140,
    frame: false,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: false,
    },
};

// enable live reload in 'dev' mode
if (process.env.MODE === "dev") {
    require("electron-reload")(__dirname, {
        electron: require(path.join(__dirname, "node_modules", "electron")),
    });
    windowConfig.resizable = true;
    windowConfig.webPreferences.devTools = true;
}

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

const createWindow = () => {
    const window = new BrowserWindow(windowConfig);
    mainWindow = window;

    window.loadFile(path.join(__dirname, "dist", "index.html"));

    // IPC channels
    ipcMain.handle("minimize", () => {
        window.minimize();
    });
    ipcMain.handle("close", () => {
        window.close();
    });
    
    // Update IPC handlers
    ipcMain.handle("check-for-updates", async () => {
        if (process.env.MODE !== "dev") {
            try {
                const updateCheckResult = await autoUpdater.checkForUpdates();
                return updateCheckResult;
            } catch (error) {
                return { error: error.message };
            }
        }
        return null;
    });
    
    ipcMain.handle("download-update", async () => {
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });
    
    ipcMain.handle("install-update", () => {
        autoUpdater.quitAndInstall(false, true);
    });
};

app.whenReady().then(() => {
    initializeConfig();
    createWindow();
    
    // Setup auto-updater event handlers
    setupAutoUpdater();
    
    // Check for updates on startup (only in production)
    if (process.env.MODE !== "dev") {
        setTimeout(() => {
            autoUpdater.checkForUpdates().catch((error) => {
                console.error("Failed to check for updates:", error);
            });
        }, 3000); // Wait 3 seconds after app starts
    }

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (isMac()) {
        app.quit();
    }
});

const initializeConfig = () => {
    if (!existsSync(getConfigPath())) {
        mkdirSync(getConfigPath(), { recursive: true });
    }
    const configFile = path.join(getConfigPath(), "config.json");
    if (!existsSync(configFile)) {
        writeFileSync(configFile, JSON.stringify({}));
    }
};

const setupAutoUpdater = () => {
    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for updates...");
    });
    
    autoUpdater.on("update-available", (info) => {
        console.log("Update available:", info.version);
        if (mainWindow) {
            mainWindow.webContents.send("update-available", info);
        }
    });
    
    autoUpdater.on("update-not-available", (info) => {
        console.log("Update not available:", info.version);
    });
    
    autoUpdater.on("error", (error) => {
        console.error("Update error:", error);
        if (mainWindow) {
            mainWindow.webContents.send("update-error", error.message);
        }
    });
    
    autoUpdater.on("download-progress", (progressInfo) => {
        if (mainWindow) {
            mainWindow.webContents.send("update-download-progress", progressInfo);
        }
    });
    
    autoUpdater.on("update-downloaded", (info) => {
        console.log("Update downloaded:", info.version);
        if (mainWindow) {
            mainWindow.webContents.send("update-downloaded", info);
        }
    });
};
