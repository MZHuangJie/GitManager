import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { gitService } from '../services/git.service'

export function registerGitIpc(): void {
  // ── Read Operations ──

  ipcMain.handle(
    IPC.GIT_STATUS,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const status = await gitService.getStatus(repoPath)
        return { success: true, data: status }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_LOG,
    async (_e, repoPath: string, opts: any): Promise<IpcResponse<any>> => {
      try {
        const log = await gitService.getLog(repoPath, opts)
        return { success: true, data: log }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_DIFF,
    async (_e, repoPath: string, hash: string): Promise<IpcResponse<any>> => {
      try {
        const diff = await gitService.getDiff(repoPath, hash)
        return { success: true, data: diff }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_DIFF_FILE,
    async (_e, repoPath: string, file: string, staged: boolean): Promise<IpcResponse<any>> => {
      try {
        const diff = await gitService.getDiffForFile(repoPath, file, staged)
        return { success: true, data: diff }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_SHOW,
    async (_e, repoPath: string, hash: string): Promise<IpcResponse<any>> => {
      try {
        const show = await gitService.getShow(repoPath, hash)
        return { success: true, data: show }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_BRANCH_LIST,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const branches = await gitService.getBranchList(repoPath)
        return { success: true, data: branches }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_CURRENT_BRANCH,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const branch = await gitService.getCurrentBranch(repoPath)
        return { success: true, data: branch }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_CLONE,
    async (_e, url: string, targetDir: string): Promise<IpcResponse<any>> => {
      try {
        const result = await gitService.clone(url, targetDir)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_DISCARD_FILE,
    async (_e, repoPath: string, files: string[]): Promise<IpcResponse<any>> => {
      try {
        await gitService.discardFiles(repoPath, files)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  // ── Write Operations ──

  ipcMain.handle(
    IPC.GIT_STAGE,
    async (_e, repoPath: string, files: string[]): Promise<IpcResponse<any>> => {
      try {
        await gitService.stageFiles(repoPath, files)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_UNSTAGE,
    async (_e, repoPath: string, files: string[]): Promise<IpcResponse<any>> => {
      try {
        await gitService.unstageFiles(repoPath, files)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_STAGE_ALL,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.stageAll(repoPath)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_COMMIT,
    async (_e, repoPath: string, message: string): Promise<IpcResponse<any>> => {
      try {
        const result = await gitService.commit(repoPath, message)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_PULL,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const result = await gitService.pull(repoPath)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_PUSH,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        const result = await gitService.push(repoPath)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_PUSH_UPSTREAM,
    async (_e, repoPath: string, remote: string, branch: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.pushWithUpstream(repoPath, remote, branch)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_CREATE_BRANCH,
    async (_e, repoPath: string, name: string, baseBranch?: string, switchTo?: boolean): Promise<IpcResponse<any>> => {
      try {
        await gitService.createBranch(repoPath, name, baseBranch, switchTo)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_SWITCH_BRANCH,
    async (_e, repoPath: string, branch: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.switchBranch(repoPath, branch)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_MERGE,
    async (_e, repoPath: string, sourceBranch: string, targetBranch: string): Promise<IpcResponse<any>> => {
      try {
        const result = await gitService.merge(repoPath, sourceBranch, targetBranch)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_DELETE_BRANCH,
    async (_e, repoPath: string, branch: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.deleteBranch(repoPath, branch)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_REVERT_HUNK,
    async (_e, repoPath: string, file: string, hunkHeader: string, hunkLines: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.revertHunk(repoPath, file, hunkHeader, hunkLines)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_RESOLVE_CONFLICT,
    async (_e, repoPath: string, file: string, strategy: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.resolveConflict(repoPath, file, strategy as any)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_FILE_DIFF,
    async (_e, repoPath: string, file: string, staged: boolean): Promise<IpcResponse<any>> => {
      try {
        const diff = await gitService.getFileDiff(repoPath, file, staged)
        return { success: true, data: diff }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_FILE_FULL_DIFF,
    async (_e, repoPath: string, file: string, staged: boolean): Promise<IpcResponse<any>> => {
      try {
        const diff = await gitService.getFullFileDiff(repoPath, file, staged)
        return { success: true, data: diff }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_INIT,
    async (_e, repoPath: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.init(repoPath)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_RESET,
    async (_e, repoPath: string, hash: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.resetToCommit(repoPath, hash)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.GIT_ADD_REMOTE,
    async (_e, repoPath: string, name: string, url: string): Promise<IpcResponse<any>> => {
      try {
        await gitService.addRemote(repoPath, name, url)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
