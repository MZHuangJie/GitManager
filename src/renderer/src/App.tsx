import { useEffect, useRef, useState } from 'react'
import { useStore } from './stores'
import AppLayout from './components/AppLayout'
import StandaloneDiffPanel from './features/diff/StandaloneDiffPanel'

export default function App() {
  const loadRepos = useStore((s) => s.loadRepos)
  const themeMode = useStore((s) => s.themeMode)
  const setThemeMode = useStore((s) => s.setThemeMode)

  const isDiffWindow = window.electronAPI.isDiffWindow

  const setGithubLogin = useStore((s) => s.setGithubLogin)
  const setGithubRepos = useStore((s) => s.setGithubRepos)

  const themeLoaded = useRef(false)

  // 加载初始设置（仅主窗口）
  useEffect(() => {
    if (isDiffWindow) return
    loadRepos()
    window.electronAPI.settingsGet('theme').then((res: any) => {
      if (res.success && res.data) {
        setThemeMode(res.data)
      }
      themeLoaded.current = true
    }).catch(() => {
      themeLoaded.current = true
    })
    // 自动 GitHub 登录
    window.electronAPI.githubGetToken().then((res: any) => {
      if (res.success && res.data) {
        window.electronAPI.githubValidateToken(res.data).then((validateRes: any) => {
          if (validateRes.success) {
            setGithubLogin(true, validateRes.data.login, validateRes.data.avatarUrl)
            // 拉取仓库列表
            window.electronAPI.githubListRepos(res.data).then((reposRes: any) => {
              if (reposRes.success) {
                setGithubRepos(reposRes.data)
              }
            })
          }
        })
      }
    })
  }, [isDiffWindow])

  // 主题变更时持久化（跳过初始加载阶段）
  useEffect(() => {
    if (!themeLoaded.current) return
    window.electronAPI.settingsSet('theme', themeMode)
  }, [themeMode])

  if (isDiffWindow) {
    return <StandaloneDiffPanel />
  }

  return <AppLayout />
}
