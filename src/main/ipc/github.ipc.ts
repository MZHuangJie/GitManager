import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { githubService } from '../services/github.service'

export function registerGithubIpc(): void {
  ipcMain.handle(
    'github:validate-token',
    async (_e, token: string): Promise<IpcResponse<any>> => {
      try {
        const user = await githubService.validateToken(token)
        return { success: true, data: user }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_LIST_REPOS,
    async (_e, token: string): Promise<IpcResponse<any>> => {
      try {
        const repos = await githubService.listUserRepos(token)
        return { success: true, data: repos }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_CREATE_REPO,
    async (
      _e,
      token: string,
      name: string,
      isPrivate: boolean,
      description?: string
    ): Promise<IpcResponse<any>> => {
      try {
        const result = await githubService.createRepo(token, name, isPrivate, description)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_GET_TOKEN,
    async (): Promise<IpcResponse<any>> => {
      try {
        const token = githubService.getToken()
        return { success: true, data: token }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_SAVE_TOKEN,
    async (_e, token: string): Promise<IpcResponse<any>> => {
      try {
        githubService.saveToken(token)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
