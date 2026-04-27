import { useState, useMemo, useEffect, useCallback } from 'react'
import { Typography, Tag, Empty, Button, Space, Dropdown, Tooltip, notification } from 'antd'
import type { MenuProps } from 'antd'
import {
  FileTextOutlined, PlusOutlined, MinusOutlined,
  SaveOutlined, RollbackOutlined, ExpandOutlined
} from '@ant-design/icons'
import { parseDiff, FileDiff, DiffHunk, DiffPair, getFileLang } from '../../utils/diff'

const { Text } = Typography
const GUTTER = 42

interface DiffPanelProps {
  diff: string
  standalone?: boolean
  editable?: boolean
  repoPath?: string
  filePath?: string
  staged?: boolean
  onRefreshStatus?: () => void
}

function HunkSideBySide({ hunk, editable, onRevert }: {
  hunk: DiffHunk
  editable?: boolean
  onRevert?: (hunk: DiffHunk) => void
}) {
  const contextMenu: MenuProps['items'] = editable && onRevert ? [
    { key: 'revert', label: '回退此块', icon: <RollbackOutlined />, danger: true }
  ] : []

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'revert') onRevert?.(hunk)
  }

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          padding: '3px 12px',
          fontSize: 11,
          fontFamily: 'monospace',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-secondary)',
          borderBottom: '1px solid var(--border-secondary)'
        }}
      >
        {hunk.header}
      </div>
      <Dropdown menu={{ items: contextMenu, onClick: handleMenuClick }} trigger={['contextMenu']} disabled={!editable}>
        <div>
          {hunk.pairs.map((pair, i) => (
            <PairRow key={i} pair={pair} />
          ))}
        </div>
      </Dropdown>
    </div>
  )
}

function PairRow({ pair }: { pair: DiffPair }) {
  const [hovered, setHovered] = useState(false)

  const sideStyle = (side: 'left' | 'right', line: DiffPair['left'] | DiffPair['right']) => {
    const isAdd = side === 'right' && line?.type === 'add'
    const isDel = side === 'left' && line?.type === 'del'
    return {
      flex: 1,
      display: 'flex',
      minHeight: 22,
      lineHeight: '22px',
      fontSize: 12,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
      background: isDel
        ? 'rgba(232, 131, 122, 0.1)'
        : isAdd
          ? 'rgba(111, 207, 151, 0.1)'
          : 'transparent',
      borderLeft: isDel
        ? '3px solid rgba(232, 131, 122, 0.4)'
        : isAdd
          ? '3px solid rgba(111, 207, 151, 0.4)'
          : '3px solid transparent',
      opacity: line ? 1 : 0.5
    }
  }

  return (
    <div
      style={{ display: 'flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={sideStyle('left', pair.left)}>
        <span style={{
          display: 'inline-block', width: GUTTER, textAlign: 'right', paddingRight: 8,
          color: 'var(--text-tertiary)', userSelect: 'none', flexShrink: 0,
          background: hovered ? 'var(--bg-hover)' : 'transparent'
        }}>
          {pair.left?.oldNum ?? ''}
        </span>
        <span style={{
          paddingLeft: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', flex: 1,
          color: pair.left?.type === 'del' ? '#e8837a' : 'var(--text-primary)'
        }}>
          {pair.left ? <><span style={{ userSelect: 'none', marginRight: 4 }}>{pair.left.type === 'del' ? '-' : ' '}</span>{pair.left.content}</> : null}
        </span>
      </div>
      <div style={{ width: 1, background: 'var(--border-secondary)', flexShrink: 0 }} />
      <div style={sideStyle('right', pair.right)}>
        <span style={{
          display: 'inline-block', width: GUTTER, textAlign: 'right', paddingRight: 8,
          color: 'var(--text-tertiary)', userSelect: 'none', flexShrink: 0,
          background: hovered ? 'var(--bg-hover)' : 'transparent'
        }}>
          {pair.right?.newNum ?? ''}
        </span>
        <span style={{
          paddingLeft: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', flex: 1,
          color: pair.right?.type === 'add' ? '#6fcf97' : 'var(--text-primary)'
        }}>
          {pair.right ? <><span style={{ userSelect: 'none', marginRight: 4 }}>{pair.right.type === 'add' ? '+' : ' '}</span>{pair.right.content}</> : null}
        </span>
      </div>
    </div>
  )
}

function FileDiffView({ file, editable, onRevertHunk }: {
  file: FileDiff
  editable?: boolean
  onRevertHunk?: (hunk: DiffHunk) => void
}) {
  if (file.hunks.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text type="secondary">二进制文件或无法显示差异</Text>
      </div>
    )
  }

  return (
    <div>
      {file.hunks.map((hunk, i) => (
        <HunkSideBySide key={i} hunk={hunk} editable={editable} onRevert={onRevertHunk} />
      ))}
    </div>
  )
}

export default function DiffPanel({ diff, standalone, editable, repoPath, filePath, staged, onRefreshStatus }: DiffPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [fullFile, setFullFile] = useState(false)
  const [fullDiff, setFullDiff] = useState<string | null>(null)
  const [loadingFullDiff, setLoadingFullDiff] = useState(false)

  const files = useMemo(() => parseDiff(fullFile && fullDiff ? fullDiff : diff), [diff, fullFile, fullDiff])
  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedFile) || null,
    [files, selectedFile]
  )

  const canShowFullFile = !!repoPath && !!filePath

  const handleToggleFullFile = useCallback(async () => {
    if (fullFile) {
      setFullFile(false)
      setFullDiff(null)
      return
    }
    if (!repoPath || !filePath) return
    setLoadingFullDiff(true)
    try {
      const res: any = await window.electronAPI.gitFileFullDiff(repoPath, filePath, staged || false)
      if (res.success && res.data) {
        setFullDiff(res.data)
        setFullFile(true)
      }
    } finally {
      setLoadingFullDiff(false)
    }
  }, [fullFile, repoPath, filePath, staged])

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0].path)
    }
  }, [files, selectedFile])

  const hasConflict = useMemo(() => {
    // 检测 diff 中是否包含冲突标记
    return diff.includes('<<<<<<< ') && diff.includes('>>>>>>> ')
  }, [diff])

  const handleDiscard = useCallback(async () => {
    if (!repoPath || !filePath) return
    setSaving(true)
    try {
      const res: any = await window.electronAPI.gitDiscardFile(repoPath, [filePath])
      if (res.success) {
        notification.success({ message: `已丢弃 "${filePath}" 的修改` })
        onRefreshStatus?.()
      } else {
        notification.error({ message: '丢弃失败', description: res.error })
      }
    } finally {
      setSaving(false)
    }
  }, [repoPath, filePath, onRefreshStatus])

  const handleRevertHunk = useCallback(async (hunk: DiffHunk) => {
    if (!repoPath || !filePath) return
    // 收集 hunk 的原始文本行
    const lines: string[] = []
    for (const pair of hunk.pairs) {
      if (pair.left && pair.left.type === 'del') {
        lines.push(`-${pair.left.content}`)
      }
      if (pair.right && pair.right.type === 'add') {
        lines.push(`+${pair.right.content}`)
      }
      if (pair.left && pair.right && pair.left.type === 'ctx') {
        lines.push(` ${pair.left.content}`)
      }
    }
    try {
      const res: any = await window.electronAPI.gitRevertHunk(repoPath, filePath, hunk.header, lines.join('\n'))
      if (res.success) {
        notification.success({ message: '已回退此块修改' })
        onRefreshStatus?.()
      } else {
        notification.error({ message: '回退失败', description: res.error })
      }
    } catch {
      notification.error({ message: '回退失败' })
    }
  }, [repoPath, filePath, onRefreshStatus])

  const handleResolveConflict = useCallback(async (strategy: string) => {
    if (!repoPath || !filePath) return
    setResolving(true)
    try {
      const res: any = await window.electronAPI.gitResolveConflict(repoPath, filePath, strategy)
      if (res.success) {
        notification.success({ message: '冲突已解决' })
        onRefreshStatus?.()
      } else {
        notification.error({ message: '解决冲突失败', description: res.error })
      }
    } finally {
      setResolving(false)
    }
  }, [repoPath, filePath, onRefreshStatus])

  if (!diff || files.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty description="暂无差异数据" />
      </div>
    )
  }

  const totalAdds = files.reduce((s, f) => s + f.additions, 0)
  const totalDels = files.reduce((s, f) => s + f.deletions, 0)

  const showToolbar = editable && filePath

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: standalone ? 'none' : '1px solid var(--border-primary)',
        borderRadius: standalone ? 0 : 12,
        overflow: 'hidden',
        height: standalone ? '100%' : 'calc(100vh - 420px)',
        minHeight: standalone ? 0 : 300
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{filePath}</Text>
            {hasConflict && (
              <Tag color="red" style={{ fontSize: 11 }}>冲突</Tag>
            )}
          </div>
          <Space size="small">
            {hasConflict ? (
              <>
                <Button size="small" onClick={() => handleResolveConflict('ours')} loading={resolving}>
                  使用我的版本
                </Button>
                <Button size="small" onClick={() => handleResolveConflict('theirs')} loading={resolving}>
                  使用他人版本
                </Button>
                <Button size="small" onClick={() => handleResolveConflict('both-ours-first')} loading={resolving}>
                  保留双方（我的在前）
                </Button>
                <Button size="small" onClick={() => handleResolveConflict('both-theirs-first')} loading={resolving}>
                  保留双方（他人在前）
                </Button>
              </>
            ) : (
              <Button size="small" danger icon={<RollbackOutlined />} onClick={handleDiscard} loading={saving}>
                丢弃修改
              </Button>
            )}
            <Button size="small" icon={<SaveOutlined />} onClick={onRefreshStatus} loading={saving}>
              刷新
            </Button>
            {canShowFullFile && (
              <Tooltip title={fullFile ? '返回差异视图' : '显示全部代码'}>
                <Button size="small" icon={<ExpandOutlined />}
                  type={fullFile ? 'primary' : 'default'}
                  onClick={handleToggleFullFile} loading={loadingFullDiff}>
                  {fullFile ? '差异视图' : '全部代码'}
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>
      )}

      {/* Body: file list + diff */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* File list sidebar */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-primary)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{files.length} 个文件</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <Text type="success" style={{ fontSize: 11 }}>+{totalAdds}</Text>
              <Text type="danger" style={{ fontSize: 11 }}>-{totalDels}</Text>
            </span>
          </div>
          {files.map((file) => (
            <div
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: activeFile?.path === file.path ? 'var(--bg-selected)' : 'transparent',
                borderLeft: activeFile?.path === file.path ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 0.15s'
              }}
            >
              <FileTextOutlined style={{ color: 'var(--text-tertiary)', fontSize: 13 }} />
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: 'var(--text-primary)', fontFamily: 'monospace'
              }}>
                {file.path}
              </span>
              <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {file.additions > 0 && (
                  <span style={{ color: '#6fcf97', fontSize: 11, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlusOutlined style={{ fontSize: 9 }} />{file.additions}
                  </span>
                )}
                {file.deletions > 0 && (
                  <span style={{ color: '#e8837a', fontSize: 11, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MinusOutlined style={{ fontSize: 9 }} />{file.deletions}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Diff content */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          {activeFile ? (
            <>
              {(!editable || !filePath) && (
                <div style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-primary)',
                  background: 'var(--bg-secondary)',
                  position: 'sticky', top: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{activeFile.path}</Text>
                    <Tag>{getFileLang(activeFile.path)}</Tag>
                    <Text type="success" style={{ fontSize: 12 }}>+{activeFile.additions}</Text>
                    <Text type="danger" style={{ fontSize: 12 }}>-{activeFile.deletions}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span>旧版本</span>
                      <span style={{ color: 'var(--text-secondary)' }}>/</span>
                      <span>新版本</span>
                    </div>
                    {canShowFullFile && (
                      <Button size="small" icon={<ExpandOutlined />}
                        type={fullFile ? 'primary' : 'default'}
                        onClick={handleToggleFullFile} loading={loadingFullDiff}>
                        {fullFile ? '差异视图' : '全部代码'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <FileDiffView
                file={activeFile}
                editable={editable && !hasConflict}
                onRevertHunk={handleRevertHunk}
              />
            </>
          ) : (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Text type="secondary">请从左侧选择文件</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
