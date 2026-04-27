import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { simpleGit } from 'simple-git'
import { RepoInfo } from '../../shared/types'
import { gitService } from './git.service'

interface StoreSchema {
  repositories: RepoInfo[]
}

const store = new Store<StoreSchema>({
  defaults: {
    repositories: []
  }
})

async function getRemoteUrl(repoPath: string): Promise<string | undefined> {
  try {
    const git = simpleGit(repoPath)
    const remotes = await git.getRemotes(true)
    const origin = remotes.find((r) => r.name === 'origin')
    if (origin && origin.refs.push) {
      return origin.refs.push
    }
    // Fallback: just use the first remote
    if (remotes.length > 0 && remotes[0].refs.push) {
      return remotes[0].refs.push
    }
    return undefined
  } catch {
    return undefined
  }
}

export const repoManager = {
  async addRepo(repoPath: string): Promise<RepoInfo> {
    // Normalize path
    const normalized = repoPath.replace(/\\/g, '/')
    const existing = store.get('repositories', [])

    // Check for duplicates
    const dup = existing.find((r) => r.path === normalized)
    if (dup) return dup

    // Validate it's a git repo
    const isValid = await this.validateRepo(normalized)
    if (!isValid) {
      throw new Error('NOT_A_REPO: The selected folder is not a valid Git repository')
    }

    const name = normalized.split('/').pop() || normalized
    const remoteUrl = await getRemoteUrl(normalized)
    const repo: RepoInfo = {
      id: uuidv4(),
      path: normalized,
      name,
      addedAt: Date.now(),
      remoteUrl
    }

    const updated = [...existing, repo]
    store.set('repositories', updated)
    return repo
  },

  removeRepo(id: string): void {
    const repos = store.get('repositories', [])
    store.set(
      'repositories',
      repos.filter((r) => r.id !== id)
    )
  },

  listRepos(): RepoInfo[] {
    return store.get('repositories', [])
  },

  updateRepo(id: string, updates: Partial<RepoInfo>): RepoInfo | null {
    const repos = store.get('repositories', [])
    const idx = repos.findIndex((r) => r.id === id)
    if (idx === -1) return null
    repos[idx] = { ...repos[idx], ...updates }
    store.set('repositories', repos)
    return repos[idx]
  },

  async validateRepo(repoPath: string): Promise<boolean> {
    try {
      const git = require('simple-git').simpleGit(repoPath)
      await git.status()
      return true
    } catch {
      return false
    }
  }
}
