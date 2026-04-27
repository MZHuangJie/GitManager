import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { DEFAULT_THEME } from '../shared/types'

const api = {
  // Repo management
  repoAdd: (path: string) => ipcRenderer.invoke(IPC.REPO_ADD, path),
  repoRemove: (id: string) => ipcRenderer.invoke(IPC.REPO_REMOVE, id),
  repoList: () => ipcRenderer.invoke(IPC.REPO_LIST),
  repoUpdate: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke(IPC.REPO_UPDATE, id, updates),
  repoValidate: (path: string) => ipcRenderer.invoke(IPC.REPO_VALIDATE, path),
  repoOpenFolder: () => ipcRenderer.invoke(IPC.REPO_OPEN_FOLDER),

  // Git reads
  gitStatus: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_STATUS, repoPath),
  gitLog: (repoPath: string, opts?: any) => ipcRenderer.invoke(IPC.GIT_LOG, repoPath, opts),
  gitDiff: (repoPath: string, hash: string) => ipcRenderer.invoke(IPC.GIT_DIFF, repoPath, hash),
  gitDiffFile: (repoPath: string, file: string, staged: boolean) =>
    ipcRenderer.invoke(IPC.GIT_DIFF_FILE, repoPath, file, staged),
  gitShow: (repoPath: string, hash: string) => ipcRenderer.invoke(IPC.GIT_SHOW, repoPath, hash),
  gitBranchList: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_BRANCH_LIST, repoPath),
  gitCurrentBranch: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_CURRENT_BRANCH, repoPath),

  // Git writes
  gitStage: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke(IPC.GIT_STAGE, repoPath, files),
  gitUnstage: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke(IPC.GIT_UNSTAGE, repoPath, files),
  gitStageAll: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_STAGE_ALL, repoPath),
  gitCommit: (repoPath: string, message: string) =>
    ipcRenderer.invoke(IPC.GIT_COMMIT, repoPath, message),
  gitPull: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_PULL, repoPath),
  gitPush: (repoPath: string) => ipcRenderer.invoke(IPC.GIT_PUSH, repoPath),
  gitPushWithUpstream: (repoPath: string, remote: string, branch: string) =>
    ipcRenderer.invoke(IPC.GIT_PUSH_UPSTREAM, repoPath, remote, branch),
  gitCreateBranch: (repoPath: string, name: string, baseBranch?: string, switchTo?: boolean) =>
    ipcRenderer.invoke(IPC.GIT_CREATE_BRANCH, repoPath, name, baseBranch, switchTo),
  gitSwitchBranch: (repoPath: string, branch: string) =>
    ipcRenderer.invoke(IPC.GIT_SWITCH_BRANCH, repoPath, branch),
  gitMerge: (repoPath: string, sourceBranch: string, targetBranch: string) =>
    ipcRenderer.invoke(IPC.GIT_MERGE, repoPath, sourceBranch, targetBranch),
  gitDeleteBranch: (repoPath: string, branch: string) =>
    ipcRenderer.invoke(IPC.GIT_DELETE_BRANCH, repoPath, branch),
  gitDiscardFile: (repoPath: string, files: string[]) =>
    ipcRenderer.invoke(IPC.GIT_DISCARD_FILE, repoPath, files),
  gitClone: (url: string, targetDir: string) =>
    ipcRenderer.invoke(IPC.GIT_CLONE, url, targetDir),
  gitInit: (repoPath: string) =>
    ipcRenderer.invoke(IPC.GIT_INIT, repoPath),
  gitAddRemote: (repoPath: string, name: string, url: string) =>
    ipcRenderer.invoke(IPC.GIT_ADD_REMOTE, repoPath, name, url),
  gitRevertHunk: (repoPath: string, file: string, hunkHeader: string, hunkLines: string) =>
    ipcRenderer.invoke(IPC.GIT_REVERT_HUNK, repoPath, file, hunkHeader, hunkLines),
  gitResolveConflict: (repoPath: string, file: string, strategy: string) =>
    ipcRenderer.invoke(IPC.GIT_RESOLVE_CONFLICT, repoPath, file, strategy),
  gitFileDiff: (repoPath: string, file: string, staged: boolean) =>
    ipcRenderer.invoke(IPC.GIT_FILE_DIFF, repoPath, file, staged),
  gitFileFullDiff: (repoPath: string, file: string, staged: boolean) =>
    ipcRenderer.invoke(IPC.GIT_FILE_FULL_DIFF, repoPath, file, staged),

  // Settings
  settingsGet: (key: string) => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
  settingsSet: (key: string, value: any) => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
  settingsGetAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),

  // GitHub
  githubCreateRepo: (token: string, name: string, isPrivate: boolean, description?: string) =>
    ipcRenderer.invoke(IPC.GITHUB_CREATE_REPO, token, name, isPrivate, description),
  githubGetToken: () => ipcRenderer.invoke(IPC.GITHUB_GET_TOKEN),
  githubSaveToken: (token: string) => ipcRenderer.invoke(IPC.GITHUB_SAVE_TOKEN, token),
  githubValidateToken: (token: string) => ipcRenderer.invoke('github:validate-token', token),
  githubListRepos: (token: string) => ipcRenderer.invoke(IPC.GITHUB_LIST_REPOS, token),

  // Window management
  windowOpenDiff: (data: { diff: string; repoPath?: string; filePath?: string; staged?: boolean; editable?: boolean; theme?: string }) =>
    ipcRenderer.invoke(IPC.WINDOW_OPEN_DIFF, data),

  // Diff window detection
  isDiffWindow: process.argv.includes('--diff-window'),
  diffWindowTheme: process.argv.find((a) => a.startsWith('--theme='))?.replace('--theme=', '') || DEFAULT_THEME
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
