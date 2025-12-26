const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

// Vite 插件会在构建时注入这些全局变量
/* global MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME */

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // MAIN_WINDOW_VITE_DEV_SERVER_URL is replaced at build time by @electron-forge/plugin-vite
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        console.log('Loading dev server URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        win.webContents.openDevTools();
    } else {
        // MAIN_WINDOW_VITE_NAME is replaced at build time
        console.log('Loading production file');
        win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
}

app.whenReady().then(() => {
    ipcMain.handle('ping', () => 'pong')

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

