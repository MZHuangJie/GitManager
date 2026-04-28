import { useMemo, useState } from 'react'
import { Layout, Button, Input, List, Tooltip, Spin, Empty, Typography, Avatar, notification } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GithubOutlined,
  SunOutlined,
  MoonOutlined,
  CloudDownloadOutlined,
  LoginOutlined,
  LogoutOutlined,
  FolderOutlined,
  DownloadOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SearchOutlined,
  ForkOutlined
} from '@ant-design/icons'
import { useStore } from '../stores'
import { RepoInfo } from '../../shared/types'

const { Sider } = Layout
const { Text } = Typography

export default function AppSider() {
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)
  const isReposLoading = useStore((s) => s.isReposLoading)
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const repoSearchQuery = useStore((s) => s.repoSearchQuery)
  const themeMode = useStore((s) => s.themeMode)
  const githubLoggedIn = useStore((s) => s.githubLoggedIn)
  const githubUsername = useStore((s) => s.githubUsername)
  const githubAvatarUrl = useStore((s) => s.githubAvatarUrl)
  const githubRepos = useStore((s) => s.githubRepos)
  const setGithubRepos = useStore((s) => s.setGithubRepos)

  const setThemeMode = useStore((s) => s.setThemeMode)
  const selectRepo = useStore((s) => s.selectRepo)
  const removeRepo = useStore((s) => s.removeRepo)
  const setModalOpen = useStore((s) => s.setModalOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const setRepoSearch = useStore((s) => s.setRepoSearch)
  const resetGitState = useStore((s) => s.resetGitState)
  const setGithubLogin = useStore((s) => s.setGithubLogin)
  const setCloneUrlPreset = useStore((s) => s.setCloneUrlPreset)

  const loadStatus = useStore((s) => s.loadStatus)
  const loadCommits = useStore((s) => s.loadCommits)
  const loadBranches = useStore((s) => s.loadBranches)
  const loadCurrentBranch = useStore((s) => s.loadCurrentBranch)
  const viewingGithubRepo = useStore((s) => s.viewingGithubRepo)
  const setViewingGithubRepo = useStore((s) => s.setViewingGithubRepo)
  const loadGithubCommits = useStore((s) => s.loadGithubCommits)
  const loadGithubBranches = useStore((s) => s.loadGithubBranches)

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [searchFocused, setSearchFocused] = useState(false)
  const [githubSearchResults, setGithubSearchResults] = useState<typeof githubRepos>([])
  const [searchingGithub, setSearchingGithub] = useState(false)

  const filteredRepos = useMemo(() => {
    if (!repoSearchQuery) return repos
    const q = repoSearchQuery.toLowerCase()
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q)
    )
  }, [repos, repoSearchQuery])

  // 标准化 git URL：去除 .git 后缀、统一 SSH/HTTPS 格式
  const normalizeGitUrl = (url: string): string => {
    let normalized = url.trim().toLowerCase()
    if (normalized.endsWith('.git')) {
      normalized = normalized.slice(0, -4)
    }
    // git@github.com:user/repo → https://github.com/user/repo
    const sshMatch = normalized.match(/^git@([\w.-]+):(.+)$/)
    if (sshMatch) {
      normalized = `https://${sshMatch[1]}/${sshMatch[2]}`
    }
    return normalized.replace(/\/+$/, '')
  }

  // 匹配：本地仓库的 remoteUrl 与 GitHub 仓库的 cloneUrl 对应
  const localRemoteUrls = useMemo(
    () => new Set(repos.map((r) => r.remoteUrl).filter(Boolean).map(normalizeGitUrl)),
    [repos]
  )

  const { myRepos, otherRepos } = useMemo(() => {
    if (!githubLoggedIn) return { myRepos: [], otherRepos: filteredRepos }
    // 我的仓库 = GitHub 仓库列表（标记是否已本地克隆）+ 本地有 remoteUrl 但不在 GitHub 列表中的
    const ghMatched = githubRepos.filter((gr) => localRemoteUrls.has(normalizeGitUrl(gr.cloneUrl)))
    const ghNotCloned = githubRepos.filter((gr) => !localRemoteUrls.has(normalizeGitUrl(gr.cloneUrl)))
    // 本地有 remoteUrl 但不在 GitHub 仓库列表中的
    const localMatched = filteredRepos.filter((r) => {
      if (!r.remoteUrl) return false
      const normalized = normalizeGitUrl(r.remoteUrl)
      return !githubRepos.some((gr) => normalizeGitUrl(gr.cloneUrl) === normalized)
    })
    // 其他仓库 = 本地无 remoteUrl 的
    const localOther = filteredRepos.filter((r) => !r.remoteUrl)
    return {
      myRepos: { ghMatched, ghNotCloned, localMatched },
      otherRepos: localOther
    }
  }, [filteredRepos, githubLoggedIn, githubRepos, localRemoteUrls])

  const handleSelectRepo = (repo: RepoInfo) => {
    selectRepo(repo.id)
    resetGitState()
    loadStatus(repo.path)
    loadCommits(repo.path)
    loadBranches(repo.path)
    loadCurrentBranch(repo.path)
  }

  const handleLogout = () => {
    setGithubLogin(false, '')
  }

  const [refreshingGithub, setRefreshingGithub] = useState(false)
  const [forkingRepoId, setForkingRepoId] = useState<number | null>(null)

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleRefreshGithubRepos = async () => {
    setRefreshingGithub(true)
    try {
      const tokenRes: any = await window.electronAPI.githubGetToken()
      if (tokenRes.success && tokenRes.data) {
        const reposRes: any = await window.electronAPI.githubListRepos(tokenRes.data)
        if (reposRes.success) {
          setGithubRepos(reposRes.data)
        }
      }
    } finally {
      setRefreshingGithub(false)
    }
  }

  const handleFork = async (gr: typeof githubRepos[0]) => {
    setForkingRepoId(gr.id)
    try {
      const tokenRes: any = await window.electronAPI.githubGetToken()
      if (!tokenRes.success || !tokenRes.data) return
      const [owner, repo] = gr.fullName.split('/')
      const res: any = await window.electronAPI.githubForkRepo(tokenRes.data, owner, repo)
      if (res.success) {
        notification.success({ message: `已 Fork "${gr.fullName}" 到你的账号` })
        await handleRefreshGithubRepos()
      } else {
        notification.error({ message: 'Fork 失败', description: res.error })
      }
    } finally {
      setForkingRepoId(null)
    }
  }

  const handleSearchGitHub = async () => {
    if (!repoSearchQuery.trim() || !githubLoggedIn) return
    setSearchingGithub(true)
    try {
      const tokenRes: any = await window.electronAPI.githubGetToken()
      if (!tokenRes.success || !tokenRes.data) return
      const res: any = await window.electronAPI.githubSearchRepos(tokenRes.data, repoSearchQuery.trim())
      if (res.success) {
        setGithubSearchResults(res.data)
      }
    } finally {
      setSearchingGithub(false)
    }
  }

  const handleSearchSelectLocal = (repo: RepoInfo) => {
    handleSelectRepo(repo)
    setRepoSearch('')
    setSearchFocused(false)
    setGithubSearchResults([])
  }

  const handleSearchSelectGithub = (gr: typeof githubRepos[0]) => {
    setCloneUrlPreset(gr.cloneUrl)
    setModalOpen('cloneModalOpen', true)
    setRepoSearch('')
    setSearchFocused(false)
    setGithubSearchResults([])
  }

  const searchDropdownOpen = searchFocused && repoSearchQuery.length > 0

  const renderLocalRepoItem = (repo: RepoInfo) => (
    <div
      key={repo.id}
      onClick={() => handleSelectRepo(repo)}
      style={{
        padding: '6px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: selectedRepoId === repo.id ? 'var(--bg-selected)' : 'transparent',
        borderLeft: selectedRepoId === repo.id ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        if (selectedRepoId !== repo.id) {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (selectedRepoId !== repo.id) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
        }
      }}
    >
      <FolderOutlined style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: selectedRepoId === repo.id ? 600 : 400,
          fontSize: 13,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {repo.name}
        </div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {repo.path}
        </Text>
      </div>
      <Tooltip title="从列表移除">
        <Button type="text" size="small" danger icon={<DeleteOutlined />}
          onClick={(e) => { e.stopPropagation(); removeRepo(repo.id) }} />
      </Tooltip>
    </div>
  )

  const renderGitHubRepoItem = (gr: typeof githubRepos[0], isCloned: boolean) => {
    const matchedLocal = isCloned
      ? repos.find((r) => r.remoteUrl && normalizeGitUrl(r.remoteUrl) === normalizeGitUrl(gr.cloneUrl))
      : null

    const isViewingRemote = !isCloned && viewingGithubRepo?.fullName === gr.fullName
    const isSelected = (matchedLocal && selectedRepoId === matchedLocal.id) || isViewingRemote

    const handleClick = () => {
      if (matchedLocal) {
        setViewingGithubRepo(null)
        handleSelectRepo(matchedLocal)
      } else {
        selectRepo('')
        setViewingGithubRepo({ fullName: gr.fullName, owner: gr.owner, repo: gr.name })
        resetGitState()
        loadGithubCommits(gr.owner, gr.name)
        loadGithubBranches(gr.owner, gr.name)
      }
    }

    return (
    <div
      key={gr.id}
      onClick={handleClick}
      style={{
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity: isCloned || isViewingRemote ? 1 : 0.6,
        background: isSelected ? 'var(--bg-selected)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
        }
      }}
    >
      <GithubOutlined style={{ color: isCloned || isViewingRemote ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 14 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          color: isCloned || isViewingRemote ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isSelected ? 600 : isCloned ? 500 : 400
        }}>
          {gr.name}
        </div>
        <Text type="secondary" style={{ fontSize: 10, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {gr.fullName}
          {gr.private ? ' · 私有' : ''}
        </Text>
      </div>
      {!isCloned && (
        <>
          {gr.owner !== githubUsername && (
            <Tooltip title="Fork 到你的账号">
              <Button type="text" size="small" icon={<ForkOutlined />}
                loading={forkingRepoId === gr.id}
                onClick={(e) => { e.stopPropagation(); handleFork(gr) }} />
            </Tooltip>
          )}
          <Tooltip title="克隆到本地">
            <Button type="text" size="small" icon={<DownloadOutlined />}
              onClick={(e) => { e.stopPropagation(); setCloneUrlPreset(gr.cloneUrl); setModalOpen('cloneModalOpen', true) }} />
          </Tooltip>
        </>
      )}
    </div>
  )}

  return (
    <Sider
      width={280}
      collapsedWidth={48}
      collapsible
      collapsed={sidebarCollapsed}
      trigger={null}
      theme={themeMode === 'dark' ? 'dark' : 'light'}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-primary)'
      }}
    >
      {sidebarCollapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 12 }}>
          <Tooltip title="展开侧栏" placement="right">
            <Button type="text" icon={<MenuUnfoldOutlined style={{ fontSize: 20 }} />} onClick={toggleSidebar}
              style={{ color: 'var(--text-tertiary)' }} />
          </Tooltip>
          <Tooltip title="添加仓库" placement="right">
            <Button type="text" icon={<PlusOutlined />}
              onClick={() => setModalOpen('addRepoModalOpen', true)} />
          </Tooltip>
          <Tooltip title="克隆仓库" placement="right">
            <Button type="text" icon={<CloudDownloadOutlined />}
              onClick={() => { setCloneUrlPreset(''); setModalOpen('cloneModalOpen', true); }} />
          </Tooltip>
          {githubLoggedIn ? (
            <Tooltip title={`已登录: ${githubUsername}`} placement="right">
              {githubAvatarUrl ? (
                <Avatar src={githubAvatarUrl} size={24} style={{ cursor: 'pointer' }} onClick={handleLogout} />
              ) : (
                <Button type="text" icon={<GithubOutlined style={{ color: 'var(--accent)' }} />} onClick={handleLogout} />
              )}
            </Tooltip>
          ) : (
            <Tooltip title="登录 GitHub" placement="right">
              <Button type="text" icon={<LoginOutlined />}
                onClick={() => setModalOpen('githubLoginModalOpen', true)} />
            </Tooltip>
          )}
          <Tooltip title={themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'} placement="right">
            <Button type="text"
              icon={themeMode === 'dark' ? <SunOutlined style={{ color: '#f5c26b' }} /> : <MoonOutlined style={{ color: '#c4a7f5' }} />}
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} />
          </Tooltip>
        </div>
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 头部 */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tooltip title="收起侧栏">
                <Button type="text" size="small" icon={<MenuFoldOutlined />} onClick={toggleSidebar}
                  style={{ color: 'var(--text-tertiary)' }} />
              </Tooltip>
              <GithubOutlined style={{ fontSize: 20, color: 'var(--accent)' }} />
              <Text strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>
                GitManager
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {githubLoggedIn ? (
                <Tooltip title={`${githubUsername} (点击退出)`}>
                  <div onClick={handleLogout} style={{ cursor: 'pointer' }}>
                    {githubAvatarUrl ? (
                      <Avatar src={githubAvatarUrl} size={26} />
                    ) : (
                      <GithubOutlined style={{ color: 'var(--accent)', fontSize: 18 }} />
                    )}
                  </div>
                </Tooltip>
              ) : (
                <Tooltip title="登录 GitHub">
                  <Button type="text" size="small" icon={<LoginOutlined />}
                    onClick={() => setModalOpen('githubLoginModalOpen', true)} />
                </Tooltip>
              )}
              <Tooltip title={themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}>
                <Button type="text" size="small"
                  icon={themeMode === 'dark' ? <SunOutlined style={{ color: '#f5c26b' }} /> : <MoonOutlined style={{ color: '#c4a7f5' }} />}
                  onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} />
              </Tooltip>
            </div>
          </div>

          {/* 搜索 + 添加 */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Input
                placeholder="搜索仓库..."
                allowClear size="small"
                prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
                value={repoSearchQuery}
                onChange={(e) => { setRepoSearch(e.target.value); setGithubSearchResults([]); setSearchFocused(true) }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {searchDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1050,
                    marginTop: 4,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    maxHeight: 360,
                    overflow: 'auto'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {/* 本地匹配 */}
                  {filteredRepos.length > 0 && (
                    filteredRepos.slice(0, 8).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSearchSelectLocal(r)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderBottom: '1px solid var(--border-secondary)'
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <FolderOutlined style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name}
                          </div>
                          <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {r.path}
                          </Text>
                        </div>
                      </div>
                    ))
                  )}

                  {/* GitHub 搜索入口 */}
                  {githubLoggedIn && (
                    <div
                      onClick={handleSearchGitHub}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderTop: filteredRepos.length > 0 ? '1px solid var(--border-primary)' : 'none',
                        color: 'var(--accent)',
                        fontWeight: 500,
                        fontSize: 13
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <GithubOutlined />
                      {searchingGithub ? <Spin size="small" /> : `在 GitHub 上搜索 "${repoSearchQuery}"`}
                    </div>
                  )}

                  {/* GitHub 搜索结果 */}
                  {githubSearchResults.length > 0 && (
                    <>
                      <div style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                        borderTop: '1px solid var(--border-primary)',
                        borderBottom: '1px solid var(--border-secondary)'
                      }}>
                        GitHub 搜索结果 ({githubSearchResults.length})
                      </div>
                      {githubSearchResults.map((gr) => (
                        <div
                          key={gr.id}
                          onClick={() => handleSearchSelectGithub(gr)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            borderBottom: '1px solid var(--border-secondary)'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <GithubOutlined style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {gr.fullName}
                            </div>
                            {gr.description && (
                              <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                {gr.description}
                              </Text>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                            {gr.private ? '私有' : '公开'}
                          </Text>
                        </div>
                      ))}
                    </>
                  )}

                  {/* 无结果 */}
                  {filteredRepos.length === 0 && !githubLoggedIn && (
                    <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <Text type="secondary">未找到匹配的仓库</Text>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Tooltip title="添加仓库">
                <Button type="primary" size="small" icon={<PlusOutlined />}
                  onClick={() => setModalOpen('addRepoModalOpen', true)} />
              </Tooltip>
              <Tooltip title="克隆远程仓库">
                <Button size="small" icon={<CloudDownloadOutlined />}
                  onClick={() => { setCloneUrlPreset(''); setModalOpen('cloneModalOpen', true); }} />
              </Tooltip>
            </div>
          </div>

          {/* 仓库列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 0', display: 'flex', flexDirection: 'column' }}>
            {isReposLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin tip="加载中..." /></div>
            ) : githubLoggedIn ? (
              <>
                {/* 我的仓库 */}
                <div>
                  <div
                    onClick={() => toggleSection('myRepos')}
                    style={{
                      padding: '8px 12px 4px',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {collapsedSections.has('myRepos')
                      ? <CaretRightOutlined style={{ fontSize: 10 }} />
                      : <CaretDownOutlined style={{ fontSize: 10 }} />
                    }
                    <GithubOutlined style={{ color: 'var(--accent)' }} />
                    我的仓库 ({githubRepos.length})
                    <Tooltip title="刷新列表">
                      <Button type="text" size="small" icon={<ReloadOutlined />}
                        loading={refreshingGithub}
                        onClick={(e) => { e.stopPropagation(); handleRefreshGithubRepos() }}
                        style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 11 }} />
                    </Tooltip>
                  </div>

                  {!collapsedSections.has('myRepos') && (
                    <>
                      {/* 已克隆的 GitHub 仓库 + 已推送的本地仓库 */}
                      {myRepos.ghMatched.length === 0 && myRepos.localMatched.length === 0 && (
                        <Empty description="暂无已克隆的仓库" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />
                      )}
                      {myRepos.localMatched.map((r) => renderLocalRepoItem(r))}
                      {myRepos.ghMatched.map((gr) => renderGitHubRepoItem(gr, true))}

                      {/* 未克隆的 GitHub 仓库 */}
                      {myRepos.ghNotCloned.length > 0 && (
                        <>
                          <div
                            onClick={() => toggleSection('uncloned')}
                            style={{
                              padding: '8px 12px 4px',
                              fontSize: 10,
                              color: 'var(--text-tertiary)',
                              fontWeight: 500,
                              cursor: 'pointer',
                              userSelect: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {collapsedSections.has('uncloned')
                              ? <CaretRightOutlined style={{ fontSize: 9 }} />
                              : <CaretDownOutlined style={{ fontSize: 9 }} />
                            }
                            未克隆 ({myRepos.ghNotCloned.length})
                          </div>
                          {!collapsedSections.has('uncloned') && (
                            myRepos.ghNotCloned.map((gr) => renderGitHubRepoItem(gr, false))
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* 分隔线 */}
                {otherRepos.length > 0 && (
                  <div style={{ margin: '4px 12px', borderTop: '1px solid var(--border-primary)' }} />
                )}

                {/* 其他仓库 */}
                {otherRepos.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div
                      onClick={() => toggleSection('otherRepos')}
                      style={{
                        padding: '4px 12px 4px',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {collapsedSections.has('otherRepos')
                        ? <CaretRightOutlined style={{ fontSize: 10 }} />
                        : <CaretDownOutlined style={{ fontSize: 10 }} />
                      }
                      其他仓库 ({otherRepos.length})
                    </div>
                    {!collapsedSections.has('otherRepos') && (
                      otherRepos.map((r) => renderLocalRepoItem(r))
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredRepos.length === 0 ? (
                  <Empty description="暂无仓库" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }}>
                    <Button type="primary" size="small" icon={<PlusOutlined />}
                      onClick={() => setModalOpen('addRepoModalOpen', true)}>
                      添加仓库
                    </Button>
                  </Empty>
                ) : (
                  filteredRepos.map((r) => renderLocalRepoItem(r))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Sider>
  )
}
