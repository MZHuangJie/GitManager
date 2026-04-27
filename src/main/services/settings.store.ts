import Store from 'electron-store'

interface SettingsSchema {
  windowBounds: { x: number; y: number; width: number; height: number } | null
  sidebarCollapsed: boolean
  diffFormat: 'line-by-line' | 'side-by-side'
  theme: 'light' | 'dark'
  lastSelectedRepoId: string | null
  githubToken: string
}

const store = new Store<SettingsSchema>({
  defaults: {
    windowBounds: null,
    sidebarCollapsed: false,
    diffFormat: 'side-by-side',
    theme: 'dark',
    lastSelectedRepoId: null,
    githubToken: ''
  }
})

export const settingsStore = {
  get<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
    return store.get(key)
  },

  set<K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]): void {
    store.set(key, value)
  },

  getAll(): Record<string, unknown> {
    return store.store
  }
}
