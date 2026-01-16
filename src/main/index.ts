import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDatabase, closeDatabase } from './db/database'
import { VocabularyService } from './services/vocabulary-service'
import { WordService } from './services/word-service'
import type { DatabaseManager } from './db/database'

let mainWindow: BrowserWindow | null = null
let db: DatabaseManager
let vocabularyService: VocabularyService
let wordService: WordService

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize database and services
async function initializeServices() {
  console.log('=== Initializing database and services ===')
  try {
    db = await getDatabase()
    vocabularyService = new VocabularyService(db)
    wordService = new WordService(db)
    console.log('✅ Database initialized successfully')
    const stats = db.getStats()
    console.log('Database stats:', stats)
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    throw error
  }
}

// Register IPC handlers
function registerIpcHandlers() {
  // Vocabulary handlers
  ipcMain.handle('vocabulary:getAll', () => {
    try {
      return vocabularyService.getAll()
    } catch (error) {
      console.error('vocabulary:getAll error:', error)
      throw error
    }
  })

  ipcMain.handle('vocabulary:getById', (_event, id: number) => {
    try {
      return vocabularyService.getById(id)
    } catch (error) {
      console.error('vocabulary:getById error:', error)
      throw error
    }
  })

  ipcMain.handle('vocabulary:create', (_event, data) => {
    try {
      return vocabularyService.create(data)
    } catch (error) {
      console.error('vocabulary:create error:', error)
      throw error
    }
  })

  ipcMain.handle('vocabulary:update', (_event, id: number, data) => {
    try {
      return vocabularyService.update(id, data)
    } catch (error) {
      console.error('vocabulary:update error:', error)
      throw error
    }
  })

  ipcMain.handle('vocabulary:delete', (_event, id: number) => {
    try {
      return vocabularyService.delete(id)
    } catch (error) {
      console.error('vocabulary:delete error:', error)
      throw error
    }
  })

  // Word handlers
  ipcMain.handle('word:getByVocabulary', (_event, vocabularyId: number) => {
    try {
      return wordService.getByVocabulary(vocabularyId)
    } catch (error) {
      console.error('word:getByVocabulary error:', error)
      throw error
    }
  })

  ipcMain.handle('word:getById', (_event, id: number) => {
    try {
      return wordService.getById(id)
    } catch (error) {
      console.error('word:getById error:', error)
      throw error
    }
  })

  ipcMain.handle('word:create', (_event, data) => {
    try {
      return wordService.create(data)
    } catch (error) {
      console.error('word:create error:', error)
      throw error
    }
  })

  ipcMain.handle('word:update', (_event, id: number, data) => {
    try {
      return wordService.update(id, data)
    } catch (error) {
      console.error('word:update error:', error)
      throw error
    }
  })

  ipcMain.handle('word:delete', (_event, id: number) => {
    try {
      return wordService.delete(id)
    } catch (error) {
      console.error('word:delete error:', error)
      throw error
    }
  })

  ipcMain.handle('word:search', (_event, vocabularyId: number, keyword: string) => {
    try {
      return wordService.search(vocabularyId, keyword)
    } catch (error) {
      console.error('word:search error:', error)
      throw error
    }
  })

  // Test handler
  ipcMain.handle('ping', () => 'pong')

  console.log('✅ IPC handlers registered')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await initializeServices()
    registerIpcHandlers()
    createWindow()
  } catch (error) {
    console.error('=== Initialization error ===', error)
    // Create window even if there's an error
    createWindow()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

// App quit
app.on('before-quit', () => {
  closeDatabase()
})
