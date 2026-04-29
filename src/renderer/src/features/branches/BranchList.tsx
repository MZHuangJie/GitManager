import { Table, Button, Tag, Space, Popconfirm, Empty, Typography, notification } from 'antd'
import {
  BranchesOutlined,
  DeleteOutlined,
  SwapOutlined,
  MergeCellsOutlined
} from '@ant-design/icons'
import { useStore } from '../../stores'
import { useCallback } from 'react'

const { Text } = Typography

export default function BranchList() {
  const branches = useStore((s) => s.branches)
  const branchesLoading = useStore((s) => s.branchesLoading)
  const currentBranch = useStore((s) => s.currentBranch)
  const activeOperation = useStore((s) => s.activeOperation)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)

  const switchBranch = useStore((s) => s.switchBranch)
  const deleteBranch = useStore((s) => s.deleteBranch)
  const setModalOpen = useStore((s) => s.setModalOpen)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)

  const handleSwitch = useCallback(
    async (branch: string, remoteRef?: string) => {
      if (!selectedRepo || branch === currentBranch) return
      await switchBranch(selectedRepo.path, branch, remoteRef)
      notification.success({ message: `已切换到 ${branch}` })
    },
    [selectedRepo, currentBranch, switchBranch]
  )

  const handleDelete = useCallback(
    async (branch: string) => {
      if (!selectedRepo || branch === currentBranch) return
      await deleteBranch(selectedRepo.path, branch)
      notification.success({ message: `已删除 ${branch}` })
    },
    [selectedRepo, currentBranch, deleteBranch]
  )

  const columns = [
    {
      title: '分支',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <span>
          <BranchesOutlined
            style={{
              marginRight: 8,
              color: record.current ? 'var(--accent)' : 'var(--text-tertiary)'
            }}
          />
          <Text
            strong={record.current}
            type={record.current ? undefined : 'secondary'}
            style={{ fontFamily: 'monospace', color: record.current ? 'var(--accent)' : undefined }}
          >
            {name}
          </Text>
          {record.current && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
              当前
            </Tag>
          )}
          {record.remote && (
            <Tag color="purple" style={{ marginLeft: 4, fontSize: 11 }}>
              远程
            </Tag>
          )}
        </span>
      )
    },
    {
      title: '提交',
      dataIndex: 'commit',
      key: 'commit',
      width: 100,
      render: (commit: string) => (
        <Text code style={{ fontSize: 11 }}>
          {commit.slice(0, 7)}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          {!record.current && (
            <>
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() => handleSwitch(record.name, record.remoteRef)}
                loading={activeOperation === 'switch-branch'}
              >
                切换
              </Button>
              {!record.remote && (
                <Popconfirm
                  title="确认删除分支？"
                  description={`确定要删除 "${record.name}" 分支吗？`}
                  onConfirm={() => handleDelete(record.name)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={activeOperation === 'delete-branch'}
                  />
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      )
    }
  ]

  if (!branches.length && !branchesLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="暂无分支" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary" strong>
          共 {branches.length} 个分支
        </Text>
        <Space size="small">
          <Button
            size="small"
            icon={<MergeCellsOutlined />}
            onClick={() => setModalOpen('mergeModalOpen', true)}
          >
            合并分支
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<BranchesOutlined />}
            onClick={() => setModalOpen('createBranchModalOpen', true)}
          >
            新建分支
          </Button>
        </Space>
      </div>
      <Table
        dataSource={branches}
        columns={columns}
        rowKey="name"
        loading={branchesLoading}
        size="small"
        pagination={false}
        locale={{
          emptyText: <Empty description="暂无分支" />
        }}
      />
    </div>
  )
}
