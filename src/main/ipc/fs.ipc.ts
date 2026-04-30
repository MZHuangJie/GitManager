import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { platform, homedir } from 'os'

const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.webm', '.ogg', '.mkv', '.avi', '.mov', '.wmv', '.flv'
])

function isVideoFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXTENSIONS.has(ext)
}

function listDrives(): string[] {
  if (platform() === 'win32') {
    const drives: string[] = []
    for (let charCode = 65; charCode <= 90; charCode++) {
      const letter = String.fromCharCode(charCode) + ':\\'
      if (existsSync(letter)) {
        drives.push(letter)
      }
    }
    return drives
  }
  // macOS / Linux: root + home
  const roots = ['/']
  const home = homedir()
  if (home && home !== '/') {
    roots.push(home)
  }
  return roots
}

export function registerFsIpc(): void {
  ipcMain.handle(
    IPC.FS_LIST_DRIVES,
    async (): Promise<IpcResponse<string[]>> => {
      try {
        const drives = listDrives()
        return { success: true, data: drives }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.FS_READ_DIR,
    async (_e, dirPath: string): Promise<IpcResponse<{
      dirs: string[]
      videos: { name: string; size: number; path: string }[]
    }>> => {
      try {
        const entries = readdirSync(dirPath, { withFileTypes: true })
        const dirs: string[] = []
        const videos: { name: string; size: number; path: string }[] = []

        for (const entry of entries) {
          if (entry.isDirectory()) {
            dirs.push(entry.name)
          } else if (entry.isFile() && isVideoFile(entry.name)) {
            const fullPath = join(dirPath, entry.name)
            try {
              const stat = statSync(fullPath)
              videos.push({ name: entry.name, size: stat.size, path: fullPath })
            } catch {
              // skip files that can't be stat'd
            }
          }
        }

        dirs.sort((a, b) => a.localeCompare(b, 'zh-CN'))
        videos.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

        return { success: true, data: { dirs, videos } }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
