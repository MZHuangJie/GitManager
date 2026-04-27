import { ThemeMode, DEFAULT_THEME } from '../../../shared/types'

export type { ThemeMode }

export interface UiSlice {
  sidebarCollapsed: boolean
  activeTab: 'changes' | 'history' | 'branches'

  addRepoModalOpen: boolean
  commitModalOpen: boolean
  createBranchModalOpen: boolean
  mergeModalOpen: boolean
  cloneModalOpen: boolean
  githubLoginModalOpen: boolean
  cloneUrlPreset: string

  selectedCommitHash: string | null
  commitDetailOpen: boolean

  repoSearchQuery: string
  commitSearchQuery: string

  diffOutputFormat: 'line-by-line' | 'side-by-side'
  themeMode: ThemeMode
  githubLoggedIn: boolean
  githubUsername: string
  githubAvatarUrl: string
  githubRepos: Array<{
    id: number
    name: string
    fullName: string
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }>

  toggleSidebar: () => void
  setActiveTab: (tab: UiSlice['activeTab']) => void
  setModalOpen: (modal: 'addRepoModalOpen' | 'commitModalOpen' | 'createBranchModalOpen' | 'mergeModalOpen' | 'cloneModalOpen' | 'githubLoginModalOpen', open: boolean) => void
  setCloneUrlPreset: (url: string) => void
  selectCommit: (hash: string | null) => void
  setCommitDetailOpen: (open: boolean) => void
  setRepoSearch: (query: string) => void
  setCommitSearch: (query: string) => void
  setDiffFormat: (format: UiSlice['diffOutputFormat']) => void
  setThemeMode: (mode: ThemeMode) => void
  setGithubLogin: (loggedIn: boolean, username?: string, avatarUrl?: string) => void
  setGithubRepos: (repos: UiSlice['githubRepos']) => void
}

export function createUiSlice(
  set: (partial: Partial<UiSlice>) => void,
  get: () => UiSlice
): UiSlice {
  return {
    sidebarCollapsed: false,
    activeTab: 'history',

    addRepoModalOpen: false,
    commitModalOpen: false,
    createBranchModalOpen: false,
    mergeModalOpen: false,
    cloneModalOpen: false,
    githubLoginModalOpen: false,
    cloneUrlPreset: '',

    selectedCommitHash: null,
    commitDetailOpen: false,

    repoSearchQuery: '',
    commitSearchQuery: '',

    diffOutputFormat: 'side-by-side',
    themeMode: DEFAULT_THEME,
    githubLoggedIn: false,
    githubUsername: '',
    githubAvatarUrl: '',
    githubRepos: [],

    toggleSidebar: () => {
      set({ sidebarCollapsed: !get().sidebarCollapsed })
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab })
    },

    setModalOpen: (modal, open) => {
      set({ [modal]: open })
    },

    selectCommit: (hash) => {
      set({ selectedCommitHash: hash, commitDetailOpen: hash !== null })
    },

    setCommitDetailOpen: (open) => {
      set({ commitDetailOpen: open })
    },

    setRepoSearch: (query) => {
      set({ repoSearchQuery: query })
    },

    setCommitSearch: (query) => {
      set({ commitSearchQuery: query })
    },

    setDiffFormat: (format) => {
      set({ diffOutputFormat: format })
    },

    setThemeMode: (mode) => {
      set({ themeMode: mode })
    },

    setGithubLogin: (loggedIn, username, avatarUrl) => {
      set({ githubLoggedIn: loggedIn, githubUsername: username || '', githubAvatarUrl: avatarUrl || '' })
    },

    setGithubRepos: (repos) => {
      set({ githubRepos: repos })
    },

    setCloneUrlPreset: (url) => {
      set({ cloneUrlPreset: url })
    }
  }
}
