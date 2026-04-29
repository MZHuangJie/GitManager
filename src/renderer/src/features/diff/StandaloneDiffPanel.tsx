import { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { Spin, Empty, notification } from 'antd'
import DiffPanel from './DiffPanel'
import { useStore } from '../../stores'
import type { ThemeMode } from '@shared/types'

interface DiffWindowData {
  diff: string
  repoPath?: string
  filePath?: string
  staged?: boolean
  editable?: boolean
  theme?: string
}

export default function StandaloneDiffPanel() {
  const setThemeMode = useStore((s) => s.setThemeMode)
  const [data, setData] = useState<DiffWindowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync store theme from preload arg, so ThemeWrapper applies correct theme
  useLayoutEffect(() => {
    const theme = window.electronAPI.diffWindowTheme as ThemeMode
    setThemeMode(theme)
  }, [setThemeMode])

  useEffect(() => {
    const tryRead = (attempt: number) => {
      const d = (window as any).__diffData as DiffWindowData | undefined
      if (d && (d.diff || d.repoPath)) {
        if (d.theme) {
          setThemeMode(d.theme as ThemeMode)
        }
        setData(d)
        setLoading(false)
      } else if (attempt < 5) {
        setTimeout(() => tryRead(attempt + 1), 150)
      } else {
        setError('无法加载差异数据')
        setLoading(false)
      }
    }
    setTimeout(() => tryRead(0), 100)
  }, [])

  const handleRefreshStatus = useCallback(async () => {
    if (data?.repoPath && data?.filePath) {
      try {
        const res: any = await window.electronAPI.gitFileDiff(
          data.repoPath,
          data.filePath,
          data.staged || false
        )
        if (res.success) {
          setData((prev) => prev ? { ...prev, diff: res.data } : prev)
          notification.success({ message: '文件状态已刷新' })
        }
      } catch {
        notification.error({ message: '刷新失败' })
      }
    }
  }, [data?.repoPath, data?.filePath, data?.staged])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Spin tip="加载差异数据..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Empty description={error || '暂无数据'} />
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <DiffPanel
        diff={data.diff}
        standalone
        editable={data.editable}
        repoPath={data.repoPath}
        filePath={data.filePath}
        staged={data.staged}
        onRefreshStatus={handleRefreshStatus}
      />
    </div>
  )
}
