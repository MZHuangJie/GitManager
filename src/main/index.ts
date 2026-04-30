import { app, BrowserWindow, shell, Menu, protocol } from 'electron'
import { join, normalize } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
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
    icon: join(__dirname, '../../resources/icon.png'),
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

// Register custom protocol for local file access
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  // Handle local-file:// protocol to serve local files to renderer
  protocol.handle('local-file', async (request) => {
    const rawPath = decodeURIComponent(request.url.slice('local-file:///'.length))
    const filePath = normalize(rawPath)
    try {
      const fileStat = await stat(filePath)
      const rangeHeader = request.headers.get('range')

      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
      }
      const mimeType = mimeMap[ext] || 'application/octet-stream'

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : fileStat.size - 1
          const stream = createReadStream(filePath, { start, end })
          return new Response(Readable.toWeb(stream) as ReadableStream, {
            status: 206,
            headers: {
              'Content-Type': mimeType,
              'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
              'Content-Length': String(end - start + 1),
              'Accept-Ranges': 'bytes',
            }
          })
        }
      }

      const stream = createReadStream(filePath)
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': String(fileStat.size),
          'Accept-Ranges': 'bytes',
        }
      })
    } catch {
      return new Response('File not found', { status: 404 })
    }
  })

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
