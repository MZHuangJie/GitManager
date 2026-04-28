import { IpcResponse, WorkingStatus, CommitEntry, BranchEntry, LogOptions } from '../../../shared/types'

export interface GitSlice {
  commits: CommitEntry[]
  commitsLoading: boolean
  commitsError: string | null

  workingStatus: WorkingStatus | null
  statusLoading: boolean
  statusError: string | null

  currentDiff: string | null
  diffLoading: boolean
  diffError: string | null

  branches: BranchEntry[]
  currentBranch: string | null
  branchesLoading: boolean

  activeOperation: string | null
  operationError: string | null

  loadCommits: (repoPath: string) => Promise<void>
  loadStatus: (repoPath: string) => Promise<void>
  loadDiff: (repoPath: string, hash: string) => Promise<void>
  loadBranches: (repoPath: string) => Promise<void>
  loadCurrentBranch: (repoPath: string) => Promise<void>

  stageFiles: (repoPath: string, files: string[]) => Promise<void>
  unstageFiles: (repoPath: string, files: string[]) => Promise<void>
  stageAll: (repoPath: string) => Promise<void>
  commit: (repoPath: string, message: string) => Promise<void>
  pull: (repoPath: string) => Promise<void>
  push: (repoPath: string) => Promise<void>
  createBranch: (repoPath: string, name: string, baseBranch?: string, switchTo?: boolean) => Promise<void>
  switchBranch: (repoPath: string, branch: string) => Promise<void>
  merge: (repoPath: string, sourceBranch: string, targetBranch: string) => Promise<any>
  deleteBranch: (repoPath: string, branch: string) => Promise<void>
  discardFiles: (repoPath: string, files: string[]) => Promise<void>
  cloneRepo: (url: string, targetDir: string) => Promise<{ repoPath: string } | null>
  resetToCommit: (repoPath: string, hash: string) => Promise<void>

  clearOperationError: () => void
  resetGitState: () => void
}

export function createGitSlice(
  set: (partial: Partial<GitSlice>) => void,
  get: () => GitSlice
): GitSlice {
  return {
    commits: [],
    commitsLoading: false,
    commitsError: null,

    workingStatus: null,
    statusLoading: false,
    statusError: null,

    currentDiff: null,
    diffLoading: false,
    diffError: null,

    branches: [],
    currentBranch: null,
    branchesLoading: false,

    activeOperation: null,
    operationError: null,

    loadCommits: async (repoPath: string) => {
      set({ commitsLoading: true, commitsError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitLog(repoPath)
      if (res.success) {
        set({ commits: res.data as CommitEntry[], commitsLoading: false })
      } else {
        set({ commitsError: res.error, commitsLoading: false })
      }
    },

    loadStatus: async (repoPath: string) => {
      set({ statusLoading: true, statusError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitStatus(repoPath)
      if (res.success) {
        set({ workingStatus: res.data as WorkingStatus, statusLoading: false })
      } else {
        set({ statusError: res.error, statusLoading: false })
      }
    },

    loadDiff: async (repoPath: string, hash: string) => {
      set({ diffLoading: true, diffError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitShow(repoPath, hash)
      if (res.success) {
        set({ currentDiff: res.data as string, diffLoading: false })
      } else {
        set({ diffError: res.error, diffLoading: false })
      }
    },

    loadBranches: async (repoPath: string) => {
      set({ branchesLoading: true })
      const res: IpcResponse<any> = await window.electronAPI.gitBranchList(repoPath)
      if (res.success) {
        set({ branches: res.data as BranchEntry[], branchesLoading: false })
      } else {
        set({ branchesLoading: false })
      }
    },

    loadCurrentBranch: async (repoPath: string) => {
      const res: IpcResponse<any> = await window.electronAPI.gitCurrentBranch(repoPath)
      if (res.success) {
        set({ currentBranch: res.data as string })
      }
    },

    // Write operations
    stageFiles: async (repoPath: string, files: string[]) => {
      set({ activeOperation: 'stage', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitStage(repoPath, files)
      if (res.success) {
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    unstageFiles: async (repoPath: string, files: string[]) => {
      set({ activeOperation: 'unstage', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitUnstage(repoPath, files)
      if (res.success) {
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    stageAll: async (repoPath: string) => {
      set({ activeOperation: 'stage-all', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitStageAll(repoPath)
      if (res.success) {
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    commit: async (repoPath: string, message: string) => {
      set({ activeOperation: 'commit', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitCommit(repoPath, message)
      if (res.success) {
        await get().loadStatus(repoPath)
        await get().loadCommits(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    pull: async (repoPath: string) => {
      set({ activeOperation: 'pull', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitPull(repoPath)
      if (res.success) {
        await get().loadCommits(repoPath)
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    push: async (repoPath: string) => {
      set({ activeOperation: 'push', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitPush(repoPath)
      if (res.success) {
        await get().loadCommits(repoPath)
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    createBranch: async (repoPath: string, name: string, baseBranch?: string, switchTo?: boolean) => {
      set({ activeOperation: 'create-branch', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitCreateBranch(repoPath, name, baseBranch, switchTo)
      if (res.success) {
        await get().loadBranches(repoPath)
        if (switchTo !== false) {
          await get().loadCurrentBranch(repoPath)
        }
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    switchBranch: async (repoPath: string, branch: string) => {
      set({ activeOperation: 'switch-branch', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitSwitchBranch(repoPath, branch)
      if (res.success) {
        await get().loadCurrentBranch(repoPath)
        await get().loadCommits(repoPath)
        await get().loadStatus(repoPath)
        await get().loadBranches(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    merge: async (repoPath: string, sourceBranch: string, targetBranch: string) => {
      set({ activeOperation: 'merge', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitMerge(repoPath, sourceBranch, targetBranch)
      if (res.success) {
        await get().loadCommits(repoPath)
        await get().loadBranches(repoPath)
        await get().loadCurrentBranch(repoPath)
        set({ activeOperation: null })
        return res.data
      } else {
        set({ operationError: res.error, activeOperation: null })
        return null
      }
    },

    deleteBranch: async (repoPath: string, branch: string) => {
      set({ activeOperation: 'delete-branch', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitDeleteBranch(repoPath, branch)
      if (res.success) {
        await get().loadBranches(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    discardFiles: async (repoPath: string, files: string[]) => {
      set({ activeOperation: 'discard', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitDiscardFile(repoPath, files)
      if (res.success) {
        await get().loadStatus(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    cloneRepo: async (url: string, targetDir: string) => {
      set({ activeOperation: 'clone', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitClone(url, targetDir)
      if (res.success) {
        set({ activeOperation: null })
        return res.data as { repoPath: string }
      } else {
        set({ operationError: res.error, activeOperation: null })
        return null
      }
    },

    resetToCommit: async (repoPath: string, hash: string) => {
      set({ activeOperation: 'reset', operationError: null })
      const res: IpcResponse<any> = await window.electronAPI.gitReset(repoPath, hash)
      if (res.success) {
        await get().loadCommits(repoPath)
        await get().loadStatus(repoPath)
        await get().loadBranches(repoPath)
        await get().loadCurrentBranch(repoPath)
        set({ activeOperation: null })
      } else {
        set({ operationError: res.error, activeOperation: null })
      }
    },

    clearOperationError: () => {
      set({ operationError: null })
    },

    resetGitState: () => {
      set({
        commits: [],
        workingStatus: null,
        currentDiff: null,
        currentBranch: null,
        commitsError: null,
        statusError: null,
        diffError: null,
        operationError: null,
        activeOperation: null
      })
    }
  }
}
