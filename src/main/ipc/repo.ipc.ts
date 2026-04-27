import { ipcMain, dialog } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { repoManager } from '../services/repo.manager'

export function registerRepoIpc(): void {
  ipcMain.handle(IPC.REPO_LIST, async (): Promise<IpcResponse<any>> => {
    try {
      const repos = repoManager.listRepos()
      return { success: true, data: repos }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(
    IPC.REPO_ADD,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const repo = await repoManager.addRepo(repoPath)
        return { success: true, data: repo }
      } catch (err: any) {
        return { success: false, error: err.message, code: err.message?.startsWith('NOT_A_REPO') ? 'NOT_A_REPO' : undefined }
      }
    }
  )

  ipcMain.handle(
    IPC.REPO_REMOVE,
    async (_e, id: string): Promise<IpcResponse<any>> => {
      try {
        repoManager.removeRepo(id)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.REPO_UPDATE,
    async (_e, id: string, updates: Record<string, unknown>): Promise<IpcResponse<any>> => {
      try {
        const repo = repoManager.updateRepo(id, updates as any)
        return { success: true, data: repo }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.REPO_VALIDATE,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const valid = await repoManager.validateRepo(repoPath)
        return { success: true, data: valid }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.REPO_OPEN_FOLDER,
    async (): Promise<IpcResponse<any>> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory']
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { success: true, data: null }
        }
        return { success: true, data: result.filePaths[0] }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
