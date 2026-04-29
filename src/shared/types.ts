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
  ahead: number
  behind: number
}

export interface BranchEntry {
  name: string
  current: boolean
  commit: string
  label: string
  remote?: boolean
  remoteRef?: string
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

export type ThemeMode = 'light' | 'dark' | 'forest' | 'ocean' | 'sunset' | 'glass' | 'cyber'
export const DEFAULT_THEME: ThemeMode = 'light'
export const THEME_META: Record<ThemeMode, { name: string; icon: string; dark: boolean }> = {
  light:  { name: '奶油草莓', icon: '🍓', dark: false },
  dark:   { name: '薰衣草夜空', icon: '🪻', dark: true },
  forest: { name: '薄荷森林', icon: '🌿', dark: false },
  ocean:  { name: '深海暗流', icon: '🌊', dark: true },
  sunset: { name: '日落余晖', icon: '🌅', dark: true },
  glass:  { name: '毛玻璃', icon: '💎', dark: false },
  cyber:  { name: '未来主义', icon: '⚡', dark: true }
}

export interface LogOptions {
  maxCount?: number
  skip?: number
  branch?: string
}
