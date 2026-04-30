import { ipcMain, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { IPC } from '../../shared/ipc-channels'
import { DEFAULT_THEME } from '../../shared/types'

export interface DiffWindowData {
  diff: string
  repoPath?: string
  filePath?: string
  staged?: boolean
  editable?: boolean
  theme?: string
}

export function registerWindowIpc(): void {
  ipcMain.handle(
    IPC.WINDOW_OPEN_DIFF,
    async (_e, data: DiffWindowData): Promise<{ id: number }> => {
      const isDev = !!process.env['ELECTRON_RENDERER_URL']

      const win = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 700,
        minHeight: 400,
        title: data.filePath
          ? `Diff Show - ${data.filePath}`
          : 'Diff Show',
        autoHideMenuBar: true,
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          contextIsolation: true,
          sandbox: false,
          nodeIntegration: false,
          additionalArguments: ['--diff-window', `--theme=${data.theme || DEFAULT_THEME}`]
        }
      })

      const winTitle = data.filePath
        ? `Diff Show - ${data.filePath}`
        : 'Diff Show'

      win.webContents.on('did-finish-load', () => {
        win.setTitle(winTitle)
        const json = JSON.stringify(data)
        win.webContents.executeJavaScript(`window.__diffData = ${json};`).catch(() => {})
      })

      if (isDev) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
      } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
      }

      return { id: 0 }
    }
  )

  ipcMain.handle(IPC.SHELL_OPEN_PATH, async (_e, filePath: string) => {
    return shell.openPath(filePath)
  })
}
