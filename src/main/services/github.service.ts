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
    cloneUrl: string
    htmlUrl: string
    private: boolean
    description: string | null
    updatedAt: string
  }>> {
    const allRepos: any[] = []
    let page = 1
    // 分页拉取所有仓库
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
  ): Promise<{ cloneUrl: string; htmlUrl: string }> {
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
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url
    }
  }
}
