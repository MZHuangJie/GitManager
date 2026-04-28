import { Table, Input, Empty, Tag, Typography, Descriptions, Spin, notification, Modal, Dropdown } from 'antd'
import { BranchesOutlined, SearchOutlined, ExpandOutlined, RollbackOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useStore } from '../../stores'
import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { CommitEntry } from '../../../shared/types'
import { formatDate } from '../../utils/format'
import { parseDiff, extractFileDiff, FileDiff } from '../../utils/diff'

const { Text, Paragraph } = Typography

// 顶部区域最小/最大占比（0 ~ 1），保证下半区至少有 18% 空间
const MIN_TOP_RATIO = 0.40
const MAX_TOP_RATIO = 0.82
const DEFAULT_TOP_RATIO = MIN_TOP_RATIO

export default function CommitHistory() {
  const commits = useStore((s) => s.commits)
  const commitsLoading = useStore((s) => s.commitsLoading)
  const commitsError = useStore((s) => s.commitsError)
  const selectedCommitHash = useStore((s) => s.selectedCommitHash)
  const currentDiff = useStore((s) => s.currentDiff)
  const diffLoading = useStore((s) => s.diffLoading)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)

  const selectCommit = useStore((s) => s.selectCommit)
  const loadDiff = useStore((s) => s.loadDiff)
  const resetToCommit = useStore((s) => s.resetToCommit)
  const commitSearchQuery = useStore((s) => s.commitSearchQuery)
  const setCommitSearch = useStore((s) => s.setCommitSearch)
  const themeMode = useStore((s) => s.themeMode)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)

  const [topRatio, setTopRatio] = useState(DEFAULT_TOP_RATIO)
  const [dragging, setDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ record: CommitEntry; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartRatioRef = useRef(0)
  const dragCurrentRatioRef = useRef(0)

  const selectedCommit = useMemo(
    () => commits.find((c) => c.hash === selectedCommitHash) || null,
    [commits, selectedCommitHash]
  )

  const fileList = useMemo<FileDiff[]>(() => {
    if (!currentDiff) return []
    return parseDiff(currentDiff)
  }, [currentDiff])

  const filtered = useMemo(() => {
    if (!commitSearchQuery) return commits
    const q = commitSearchQuery.toLowerCase()
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q)
    )
  }, [commits, commitSearchQuery])

  const handleRowClick = useCallback((record: CommitEntry) => {
    selectCommit(record.hash)
    if (selectedRepo) {
      loadDiff(selectedRepo.path, record.hash)
    }
  }, [selectCommit, loadDiff, selectedRepo])

  const handleFileClick = useCallback((filePath: string) => {
    if (!currentDiff) return
    const fileDiff = extractFileDiff(currentDiff, filePath)
    if (fileDiff) {
      window.electronAPI.windowOpenDiff({ diff: fileDiff, editable: false, theme: themeMode })
    }
  }, [currentDiff, themeMode])

  const handleReset = useCallback((record: CommitEntry) => {
    if (!selectedRepo) return
    setContextMenu(null)
    Modal.confirm({
      title: '回滚到此提交',
      content: `确定要将仓库回滚到提交 ${record.hash.slice(0, 7)} 吗？此操作将丢弃该提交之后的所有更改，不可撤销。`,
      okText: '确认回滚',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await resetToCommit(selectedRepo.path, record.hash)
        notification.success({ message: `已回滚到 ${record.hash.slice(0, 7)}` })
      }
    })
  }, [selectedRepo, resetToCommit])

  const contextMenuItems: MenuProps['items'] = contextMenu
    ? [
        {
          key: 'reset',
          label: '回退到此版本',
          icon: <RollbackOutlined />,
          danger: true,
          onClick: () => handleReset(contextMenu.record)
        }
      ]
    : []

  const topPanelRef = useRef<HTMLDivElement>(null)
  const bottomPanelRef = useRef<HTMLDivElement>(null)

  // Drag-resize — direct DOM manipulation during drag for smooth updates
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      e.preventDefault()
      const containerHeight = containerRef.current?.clientHeight || 600
      const deltaY = e.clientY - dragStartYRef.current
      const deltaRatio = deltaY / containerHeight
      const newRatio = Math.min(MAX_TOP_RATIO, Math.max(MIN_TOP_RATIO, dragStartRatioRef.current + deltaRatio))
      // Direct DOM update for responsiveness, avoid re-render churn
      if (topPanelRef.current) topPanelRef.current.style.flex = String(newRatio)
      if (bottomPanelRef.current) bottomPanelRef.current.style.flex = String(1 - newRatio)
      dragCurrentRatioRef.current = newRatio
    }

    const handleUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      if (lockedElRef.current) {
        lockedElRef.current.style.overflowY = 'auto'
        lockedElRef.current = null
      }
      // Sync to React state so layout survives re-renders
      setTopRatio(dragCurrentRatioRef.current)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [])

  const lockedElRef = useRef<HTMLElement | null>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    draggingRef.current = true
    dragStartYRef.current = e.clientY
    dragStartRatioRef.current = topRatio
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ns-resize'
    // 找到最近的可滚动父容器，拖拽期间锁定防止滚动
    let el: HTMLElement | null = e.currentTarget as HTMLElement
    while (el) {
      const style = window.getComputedStyle(el)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        el.style.overflowY = 'hidden'
        lockedElRef.current = el
        break
      }
      el = el.parentElement
    }
  }, [topRatio])

  const columns = [
    {
      title: '提交',
      dataIndex: 'hash',
      key: 'hash',
      width: 100,
      render: (hash: string) => (
        <Text code copyable={{ text: hash }} style={{ fontSize: 12 }}>
          {hash.slice(0, 7)}
        </Text>
      )
    },
    {
      title: '提交信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string, record: CommitEntry) => (
        <div>
          <Text>{msg.split('\n')[0]}</Text>
          {record.refs.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              {record.refs.map((ref) => (
                <Tag key={ref} color="blue" style={{ fontSize: 11, marginRight: 2 }}>
                  <BranchesOutlined /> {ref.replace('refs/heads/', '')}
                </Tag>
              ))}
            </span>
          )}
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      ellipsis: true,
      render: (author: string) => <Text type="secondary">{author}</Text>
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(date)}
        </Text>
      )
    }
  ]

  if (commitsError) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Empty description={`加载失败: ${commitsError}`} />
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Text type="secondary" strong>
          共 {commits.length} 条提交
        </Text>
        <Input.Search
          placeholder="搜索提交记录..."
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          value={commitSearchQuery}
          onChange={(e) => setCommitSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      {/* Table — 上半区 */}
      <div ref={topPanelRef} style={{ flex: selectedCommit ? topRatio : 1, overflow: 'auto', minHeight: 0 }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="hash"
          loading={commitsLoading}
          size="small"
          pagination={{ pageSize: 30, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            onContextMenu: (e) => {
              e.preventDefault()
              setContextMenu({ record, x: e.clientX, y: e.clientY })
            },
            style: {
              cursor: 'pointer',
              background: record.hash === selectedCommitHash ? 'var(--bg-selected)' : undefined
            }
          })}
          locale={{ emptyText: <Empty description="暂无提交记录" /> }}
        />
      </div>

      {/* Draggable divider */}
      {selectedCommit && (
        <div
          onMouseDown={handleDragStart}
          style={{
            flexShrink: 0,
            height: 10,
            cursor: 'ns-resize',
            background: 'var(--border-secondary)',
            borderTop: '1px solid var(--border-primary)',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            if (!dragging) (e.currentTarget as HTMLElement).style.background = 'var(--border-primary)'
          }}
          onMouseLeave={(e) => {
            if (!dragging) (e.currentTarget as HTMLElement).style.background = 'var(--border-secondary)'
          }}
        >
          <div style={{
            width: 40,
            height: 3,
            borderRadius: 2,
            background: 'var(--text-tertiary)',
            opacity: 0.4
          }} />
        </div>
      )}

      {/* Detail panel — 下半区，自动填充剩余空间 */}
      {selectedCommit && (
        <div
          ref={bottomPanelRef}
          style={{
            flex: 1 - topRatio,
            minHeight: 0,
            overflow: 'auto',
            background: 'var(--bg-secondary)',
            padding: 12
          }}
        >
          {/* Commit metadata */}
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
            <Descriptions.Item label="哈希" span={2}>
              <Text code copyable style={{ fontSize: 12 }}>
                {selectedCommit.hash}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="作者">
              {selectedCommit.author} &lt;{selectedCommit.email}&gt;
            </Descriptions.Item>
            <Descriptions.Item label="日期">{formatDate(selectedCommit.date)}</Descriptions.Item>
            <Descriptions.Item label="提交信息" span={2}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                {selectedCommit.message}
              </Paragraph>
            </Descriptions.Item>
            {selectedCommit.refs.length > 0 && (
              <Descriptions.Item label="引用" span={2}>
                {selectedCommit.refs.map((ref) => (
                  <Tag key={ref} color="blue" style={{ marginRight: 4 }}>
                    <BranchesOutlined /> {ref}
                  </Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* File list */}
          <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
            变更文件 ({fileList.length})
          </Text>
          {diffLoading ? (
            <Spin tip="加载差异中..." />
          ) : fileList.length === 0 ? (
            <Text type="secondary">暂无可显示的文件变更</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {fileList.map((f) => (
                <div
                  key={f.path}
                  onClick={() => handleFileClick(f.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'var(--bg-tertiary)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{f.path}</span>
                  <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Text type="success" style={{ fontSize: 11 }}>+{f.additions}</Text>
                    <Text type="danger" style={{ fontSize: 11 }}>-{f.deletions}</Text>
                    <ExpandOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Right-click context menu */}
      {contextMenu && (
        <Dropdown
          open
          onOpenChange={(open) => { if (!open) setContextMenu(null) }}
          menu={{ items: contextMenuItems }}
          placement="bottomLeft"
          trigger={['contextMenu']}
        >
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }}
          />
        </Dropdown>
      )}
    </div>
  )
}
