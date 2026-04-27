import { Table, Button, Tag, Space, Popconfirm, Empty, Typography, notification } from 'antd'
import { CheckSquareOutlined, BorderOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useCallback, useMemo, useState } from 'react'
import { StatusFile } from '../../../shared/types'

const { Text } = Typography

function getStatusColor(status: string): string {
  switch (status) {
    case 'M':
    case 'MM':
      return 'orange'
    case 'A':
      return 'green'
    case 'D':
      return 'red'
    case 'R':
      return 'purple'
    case '?':
      return 'default'
    default:
      return 'blue'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'M':
    case 'MM':
      return '已修改'
    case 'A':
      return '新增'
    case 'D':
      return '已删除'
    case 'R':
      return '已重命名'
    case '?':
      return '未跟踪'
    default:
      return status
  }
}

export default function StageArea() {
  const workingStatus = useStore((s) => s.workingStatus)
  const statusLoading = useStore((s) => s.statusLoading)
  const statusError = useStore((s) => s.statusError)
  const activeOperation = useStore((s) => s.activeOperation)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)

  const stageFiles = useStore((s) => s.stageFiles)
  const unstageFiles = useStore((s) => s.unstageFiles)
  const stageAll = useStore((s) => s.stageAll)
  const discardFiles = useStore((s) => s.discardFiles)
  const setModalOpen = useStore((s) => s.setModalOpen)
  const themeMode = useStore((s) => s.themeMode)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const allFiles = useMemo(() => {
    if (!workingStatus) return []
    const fileMap = new Map<string, StatusFile & { staged: boolean }>()

    // 先收集已暂存的文件
    workingStatus.staged.forEach((f) => {
      fileMap.set(f.path, { ...f, staged: true })
    })
    // 再收集未暂存/已修改的文件（如果已存在则保留 staged 标记）
    workingStatus.unstaged.forEach((f) => {
      if (!fileMap.has(f.path)) {
        fileMap.set(f.path, { ...f, staged: false })
      }
    })
    // 新增文件
    workingStatus.created.forEach((path) => {
      if (!fileMap.has(path)) {
        fileMap.set(path, { path, index: '?', working_dir: '?', staged: false })
      }
    })
    // 删除文件
    workingStatus.deleted.forEach((path) => {
      if (!fileMap.has(path)) {
        fileMap.set(path, { path, index: ' ', working_dir: 'D', staged: false })
      }
    })

    // 按路径排序，同路径文件只出现一次
    return Array.from(fileMap.values()).sort((a, b) => a.path.localeCompare(b.path))
  }, [workingStatus])

  const handleStage = useCallback(async () => {
    if (!selectedRepo || selectedRowKeys.length === 0) return
    await stageFiles(selectedRepo.path, selectedRowKeys)
    setSelectedRowKeys([])
  }, [selectedRepo, selectedRowKeys, stageFiles])

  const handleUnstage = useCallback(async () => {
    if (!selectedRepo || selectedRowKeys.length === 0) return
    await unstageFiles(selectedRepo.path, selectedRowKeys)
    setSelectedRowKeys([])
  }, [selectedRepo, selectedRowKeys, unstageFiles])

  const handleStageAll = useCallback(async () => {
    if (!selectedRepo) return
    await stageAll(selectedRepo.path)
  }, [selectedRepo, stageAll])

  const handleDiscard = useCallback(async (filePath: string) => {
    if (!selectedRepo) return
    await discardFiles(selectedRepo.path, [filePath])
    setSelectedRowKeys((prev) => prev.filter((k) => k !== filePath))
    notification.success({ message: `已丢弃 "${filePath}" 的修改` })
  }, [selectedRepo, discardFiles])

  const handleDiscardSelected = useCallback(async () => {
    if (!selectedRepo || selectedRowKeys.length === 0) return
    await discardFiles(selectedRepo.path, selectedRowKeys)
    notification.success({ message: `已丢弃 ${selectedRowKeys.length} 个文件的修改` })
    setSelectedRowKeys([])
  }, [selectedRepo, selectedRowKeys, discardFiles])

  const handleFileDoubleClick = useCallback(async (record: StatusFile & { staged: boolean }) => {
    if (!selectedRepo) return
    try {
      const res: any = await window.electronAPI.gitFileDiff(selectedRepo.path, record.path, record.staged)
      if (res.success) {
        window.electronAPI.windowOpenDiff({
          diff: res.data,
          repoPath: selectedRepo.path,
          filePath: record.path,
          staged: record.staged,
          editable: true,
          theme: themeMode
        })
      } else {
        // 如果文件没有 diff（比如刚创建的），打开空 diff
        window.electronAPI.windowOpenDiff({
          diff: '',
          repoPath: selectedRepo.path,
          filePath: record.path,
          staged: record.staged,
          editable: true,
          theme: themeMode
        })
      }
    } catch {
      notification.error({ message: `无法获取 "${record.path}" 的差异` })
    }
  }, [selectedRepo])

  const columns = [
    {
      title: '文件',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => (
        <Text style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12 }}>{path}</Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: StatusFile & { staged: boolean }) => {
        const statusChar = record.working_dir === '?' ? '?' : record.working_dir || record.index
        return (
          <>
            {record.staged && (
              <Tag color="green" style={{ fontSize: 11, marginRight: 4 }}>
                已暂存
              </Tag>
            )}
            <Tag color={getStatusColor(statusChar)} style={{ fontSize: 11 }}>
              {getStatusLabel(statusChar)}
            </Tag>
          </>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: StatusFile & { staged: boolean }) => (
        <Popconfirm
          title="确认丢弃修改？"
          description={`此操作不可撤销，确定丢弃 "${record.path}" 的修改？`}
          onConfirm={() => handleDiscard(record.path)}
          okText="确认丢弃"
          cancelText="取消"
          placement="left"
        >
          <Button
            size="small"
            danger
            type="text"
            icon={<RollbackOutlined />}
            loading={activeOperation === 'discard'}
            title="丢弃修改"
          />
        </Popconfirm>
      )
    }
  ]

  const isClean = !workingStatus || (
    workingStatus.staged.length === 0 &&
    workingStatus.unstaged.length === 0 &&
    workingStatus.created.length === 0 &&
    workingStatus.deleted.length === 0
  )

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ color: 'var(--text-secondary)' }}>
          {isClean ? '工作区干净' : `${allFiles.length} 个文件有变更`}
        </Text>
        <Space size="small">
          <Button
            size="small"
            icon={<CheckSquareOutlined />}
            onClick={handleStageAll}
            loading={activeOperation === 'stage-all'}
            disabled={isClean}
          >
            暂存全部
          </Button>
          <Button
            size="small"
            icon={<BorderOutlined />}
            onClick={handleStage}
            disabled={selectedRowKeys.length === 0}
            loading={activeOperation === 'stage'}
          >
            暂存选中
          </Button>
          <Button
            size="small"
            onClick={handleUnstage}
            disabled={selectedRowKeys.length === 0}
            loading={activeOperation === 'unstage'}
          >
            取消暂存
          </Button>
          <Popconfirm
            title="批量丢弃修改？"
            description={`确定丢弃 ${selectedRowKeys.length} 个文件的修改？此操作不可撤销。`}
            onConfirm={handleDiscardSelected}
            okText="确认丢弃"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={activeOperation === 'discard'}
            >
              丢弃选中
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            size="small"
            onClick={() => setModalOpen('commitModalOpen', true)}
            disabled={!workingStatus || workingStatus.staged.length === 0}
            loading={activeOperation === 'commit'}
          >
            提交
          </Button>
        </Space>
      </div>

      {/* 文件列表 */}
      {statusError ? (
        <Empty description={`加载失败: ${statusError}`} />
      ) : (
        <Table
          dataSource={allFiles}
          columns={columns}
          rowKey="path"
          loading={statusLoading}
          size="small"
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[])
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleFileDoubleClick(record)
          })}
          locale={{
            emptyText: isClean ? (
              <Empty description="没有文件变更，工作区干净" />
            ) : (
              <Empty description="没有文件变更" />
            )
          }}
        />
      )}
    </div>
  )
}
