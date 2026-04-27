export interface IpcSuccess<T> {
  success: true
  data: T
}

export interface IpcError {
  success: false
  error: string
  code?: string
}

export type IpcResponse<T> = IpcSuccess<T> | IpcError

export interface RepoInfo {
  id: string
  path: string
  name: string
  addedAt: number
  remoteUrl?: string
}

export interface CommitEntry {
  hash: string
  message: string
  author: string
  email: string
  date: string
  refs: string[]
}

export interface StatusFile {
  path: string
  index: string
  working_dir: string
}

export interface WorkingStatus {
  staged: StatusFile[]
  unstaged: StatusFile[]
  created: string[]
  deleted: string[]
  renamed: Array<{ from: string; to: string }>
}

export interface BranchEntry {
  name: string
  current: boolean
  commit: string
  label: string
}

export interface PullResult {
  files: string[]
  summary: {
    changes: number
    insertions: number
    deletions: number
  }
}

export interface PushResult {
  pushed: boolean
  update?: {
    hash: string
    message: string
    author: string
  }
}

export interface MergeResult {
  merged: boolean
  conflicts?: string[]
  summary?: {
    changes: number
    insertions: number
    deletions: number
  }
}

export type ThemeMode = 'dark' | 'light'
export const DEFAULT_THEME: ThemeMode = 'light'

export interface LogOptions {
  maxCount?: number
  skip?: number
  branch?: string
}
