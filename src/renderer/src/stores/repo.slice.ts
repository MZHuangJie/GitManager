import { create } from 'zustand'
import { RepoInfo, IpcResponse } from '../../../shared/types'

export interface RepoSlice {
  repos: RepoInfo[]
  selectedRepoId: string | null
  isReposLoading: boolean
  reposError: string | null

  loadRepos: () => Promise<void>
  addRepo: (path: string) => Promise<void>
  removeRepo: (id: string) => Promise<void>
  updateRepoInfo: (id: string, updates: Partial<RepoInfo>) => Promise<void>
  selectRepo: (id: string) => void
  clearError: () => void
}

export function createRepoSlice(
  set: (partial: Partial<RepoSlice>) => void,
  get: () => RepoSlice
): RepoSlice {
  return {
    repos: [],
    selectedRepoId: null,
    isReposLoading: false,
    reposError: null,

    loadRepos: async () => {
      set({ isReposLoading: true, reposError: null })
      const res: IpcResponse<any> = await window.electronAPI.repoList()
      if (res.success) {
        const allRepos = res.data as RepoInfo[]
        const validRepos: RepoInfo[] = []
        for (const repo of allRepos) {
          const v: IpcResponse<boolean> = await window.electronAPI.repoValidate(repo.path)
          if (v.success && v.data) {
            validRepos.push(repo)
          } else {
            await window.electronAPI.repoRemove(repo.id)
          }
        }
        set({ repos: validRepos, isReposLoading: false })
      } else {
        set({ reposError: res.error, isReposLoading: false })
      }
    },

    addRepo: async (path: string) => {
      const res: IpcResponse<any> = await window.electronAPI.repoAdd(path)
      if (res.success) {
        await get().loadRepos()
      } else {
        set({ reposError: res.error })
      }
    },

    removeRepo: async (id: string) => {
      const res: IpcResponse<any> = await window.electronAPI.repoRemove(id)
      if (res.success) {
        const repos = get().repos.filter((r) => r.id !== id)
        const selectedRepoId =
          get().selectedRepoId === id ? null : get().selectedRepoId
        set({ repos, selectedRepoId })
      }
    },

    updateRepoInfo: async (id: string, updates: Partial<RepoInfo>) => {
      const repo = get().repos.find((r) => r.id === id)
      if (!repo) return
      const merged = { ...repo, ...updates }
      const res: IpcResponse<any> = await window.electronAPI.repoUpdate(id, merged)
      if (res.success) {
        const repos = get().repos.map((r) =>
          r.id === id ? (res.data as RepoInfo) : r
        )
        set({ repos })
      }
    },

    selectRepo: (id: string) => {
      set({ selectedRepoId: id })
    },

    clearError: () => {
      set({ reposError: null })
    }
  }
}
