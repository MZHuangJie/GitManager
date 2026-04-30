import { app, BrowserWindow, shell, Menu, protocol } from 'electron'
import { join, normalize } from 'path'
import { open, stat } from 'fs/promises'
import { registerAllIpc } from './ipc'
import { settingsStore } from './services/settings.store'

app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport,PlatformHEVCEncoderSupport')

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

  mainWindow.webContents.on('console-message', (_e, level, message) => {
    console.log('[renderer]', level === 2 ? 'WARN' : level === 3 ? 'ERROR' : 'LOG', message)
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.webContents.openDevTools()
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
    console.log('[local-file] Request:', request.url)
    console.log('[local-file] Range:', request.headers.get('range'))
    try {
      const fileStat = await stat(filePath)
      const total = fileStat.size
      console.log('[local-file] File size:', total)

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

      const rangeHeader = request.headers.get('range')
      const start = rangeHeader?.match(/bytes=(\d+)-/)?.[1]
        ? parseInt(rangeHeader.match(/bytes=(\d+)-/)![1], 10)
        : 0
      const endMatch = rangeHeader?.match(/bytes=\d+-(\d+)/)
      const end = endMatch?.[1] ? parseInt(endMatch[1], 10) : total - 1

      const length = end - start + 1
      console.log('[local-file] Range:', start, '-', end, '/', total, 'length:', length)

      const fileHandle = await open(filePath, 'r')
      const buf = Buffer.alloc(length)
      await fileHandle.read(buf, 0, length, start)
      await fileHandle.close()

      console.log('[local-file] Returning 206, Content-Range:', `bytes ${start}-${end}/${total}`)
      return new Response(buf, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Content-Length': String(length),
          'Accept-Ranges': 'bytes',
        }
      })
    } catch (err) {
      console.error('[local-file] Error:', err)
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
