import { settingsStore } from './settings.store'

export const githubService = {
  getToken(): string {
    return (settingsStore.getAll()['githubToken'] as string) || ''
  },

  saveToken(token: string): void {
    settingsStore.set('githubToken' as any, token as any)
  },

  async validateToken(token: string): Promise<{ login: string; avatarUrl: string }> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GitManager'
      }
    })

    if (!res.ok) {
      throw new Error('Token 无效，请检查后重试')
    }

    const data = await res.json()
    return {
      login: data.login,
      avatarUrl: data.avatar_url
    }
  },

  async listUserRepos(token: string): Promise<Array<{
    id: number
    name: string
    fullName: string
    owner: string
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }>> {
    const allRepos: any[] = []
    let page = 1
    while (true) {
      const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'GitManager'
        }
      })
      if (!res.ok) {
        throw new Error('无法获取仓库列表')
      }
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) break
      allRepos.push(...data)
      if (data.length < 100) break
      page++
    }

    return allRepos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || '',
      cloneUrl: r.clone_url,
      htmlUrl: r.html_url,
      private: r.private,
      description: r.description,
      updatedAt: r.updated_at
    }))
  },

  async createRepo(
    token: string,
    name: string,
    isPrivate: boolean,
    description?: string
  ): Promise<{
    id: number
    name: string
    fullName: string
    owner: string
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }> {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GitManager'
      },
      body: JSON.stringify({
        name,
        private: isPrivate,
        description: description || ''
      })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as any).message || `GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login || '',
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      private: data.private,
      description: data.description,
      updatedAt: data.updated_at
    }
  },

  async forkRepo(
    token: string,
    owner: string,
    repo: string
  ): Promise<{
    id: number
    name: string
    fullName: string
    owner: string
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GitManager'
      }
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as any).message || `GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login || '',
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      private: data.private,
      description: data.description,
      updatedAt: data.updated_at
    }
  },

  async searchRepos(
    token: string,
    query: string
  ): Promise<Array<{
    id: number
    name: string
    fullName: string
    owner: string
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }>> {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=20&sort=stars`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'GitManager'
        }
      }
    )

    if (!res.ok) {
      throw new Error(`GitHub 搜索失败: ${res.status}`)
    }

    const data = await res.json()
    return (data.items || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || '',
      cloneUrl: r.clone_url,
      htmlUrl: r.html_url,
      private: r.private,
      description: r.description,
      updatedAt: r.updated_at
    }))
  },

  async getRepoCommits(
    token: string,
    owner: string,
    repo: string
  ): Promise<Array<{
    hash: string
    message: string
    author: string
    email: string
    date: string
    refs: string[]
  }>> {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'GitManager'
        }
      }
    )

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    return (data || []).map((c: any) => ({
      hash: c.sha,
      message: c.commit?.message || '',
      author: c.commit?.author?.name || c.author?.login || '',
      email: c.commit?.author?.email || '',
      date: c.commit?.author?.date || '',
      refs: []
    }))
  },

  async getCommitDiff(
    token: string,
    owner: string,
    repo: string,
    sha: string
  ): Promise<string> {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.diff',
          'User-Agent': 'GitManager'
        }
      }
    )

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const diff = await res.text()
    // Cap at 5000 lines
    const lines = diff.split('\n')
    if (lines.length > 5000) {
      return lines.slice(0, 5000).join('\n') + '\n\n... (diff truncated at 5000 lines)'
    }
    return diff
  },

  async getRepoBranches(
    token: string,
    owner: string,
    repo: string
  ): Promise<Array<{
    name: string
    current: boolean
    commit: string
    label: string
  }>> {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'GitManager'
        }
      }
    )

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    return (data || []).map((b: any) => ({
      name: b.name,
      current: false,
      commit: b.commit?.sha || '',
      label: b.name
    }))
  }
}
