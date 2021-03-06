const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// enable live reload in 'dev' mode
if (process.env.MODE === "dev") {
    require("electron-reload")(__dirname, {
        electron: require(path.join(__dirname, "node_modules", "electron")),
    });
}

const createWindow = () => {
    const window = new BrowserWindow({
        width: 400,
        height: 140,
        frame: false,
        resizable: false,
        titleBarStyle: "hidden",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false,
        },
    });

    window.loadFile(path.join(__dirname, "dist", "index.html"));

    // IPC channels
    ipcMain.handle("minimize", () => {
        window.minimize();
    });
    ipcMain.handle("close", () => {
        window.close();
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
