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
    IPC.GITHUB_FORK_REPO,
    async (
      _e,
      token: string,
      owner: string,
      repo: string
    ): Promise<IpcResponse<any>> => {
      try {
        const result = await githubService.forkRepo(token, owner, repo)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_SEARCH_REPOS,
    async (_e, token: string, query: string): Promise<IpcResponse<any>> => {
      try {
        const repos = await githubService.searchRepos(token, query)
        return { success: true, data: repos }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_GET_COMMITS,
    async (_e, token: string, owner: string, repo: string): Promise<IpcResponse<any>> => {
      try {
        const commits = await githubService.getRepoCommits(token, owner, repo)
        return { success: true, data: commits }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_GET_BRANCHES,
    async (_e, token: string, owner: string, repo: string): Promise<IpcResponse<any>> => {
      try {
        const branches = await githubService.getRepoBranches(token, owner, repo)
        return { success: true, data: branches }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GITHUB_GET_COMMIT_DIFF,
    async (_e, token: string, owner: string, repo: string, sha: string): Promise<IpcResponse<any>> => {
      try {
        const diff = await githubService.getCommitDiff(token, owner, repo, sha)
        return { success: true, data: diff }
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
