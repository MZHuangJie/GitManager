import { app, BrowserWindow, shell, Menu } from 'electron'
import { join } from 'path'
import { registerAllIpc } from './ipc'
import { settingsStore } from './services/settings.store'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = settingsStore.get('windowBounds')

  mainWindow = new BrowserWindow({
    ...(bounds || { width: 1200, height: 800 }),
    minWidth: 900,
    minHeight: 600,
    title: 'GitManager',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      settingsStore.set('windowBounds', { x, y, width, height })
    }
  })

  mainWindow.on('moved', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      settingsStore.set('windowBounds', { x, y, width, height })
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  registerAllIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  mainWindow = null
})
