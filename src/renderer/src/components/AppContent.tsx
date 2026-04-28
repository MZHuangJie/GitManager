import { Layout, Tabs, Breadcrumb, Select, Button, Space, Spin, Empty, Typography, notification, Badge } from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  BranchesOutlined,
  GithubOutlined
} from '@ant-design/icons'
import { useStore } from '../stores'
import AddRepoModal from '../features/repository/AddRepoModal'
import CloneModal from '../features/repository/CloneModal'
import CommitHistory from '../features/commits/CommitHistory'
import StageArea from '../features/staging/StageArea'
import CommitModal from '../features/staging/CommitModal'
import BranchList from '../features/branches/BranchList'
import CreateBranchModal from '../features/branches/CreateBranchModal'
import MergeModal from '../features/branches/MergeModal'
import { useCallback, useState } from 'react'
import GitHubPublishModal from '../features/repository/GitHubPublishModal'
import GithubLoginModal from '../features/repository/GithubLoginModal'

const { Content } = Layout
const { Text } = Typography

export default function AppContent() {
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)
  const activeTab = useStore((s) => s.activeTab)
  const activeOperation = useStore((s) => s.activeOperation)
  const operationError = useStore((s) => s.operationError)
  const currentBranch = useStore((s) => s.currentBranch)
  const branches = useStore((s) => s.branches)
  const workingStatus = useStore((s) => s.workingStatus)

  const setActiveTab = useStore((s) => s.setActiveTab)
  const setModalOpen = useStore((s) => s.setModalOpen)
  const clearOperationError = useStore((s) => s.clearOperationError)
  const pull = useStore((s) => s.pull)
  const push = useStore((s) => s.push)
  const switchBranch = useStore((s) => s.switchBranch)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)
  const [githubModalOpen, setGithubModalOpen] = useState(false)

  if (operationError) {
    notification.error({
      message: '操作失败',
      description: operationError,
      onClose: clearOperationError
    })
  }

  const handlePull = useCallback(async () => {
    if (!selectedRepo) return
    await pull(selectedRepo.path)
    notification.success({ message: '拉取完成' })
  }, [selectedRepo, pull])

  const handlePush = useCallback(async () => {
    if (!selectedRepo) return
    await push(selectedRepo.path)
    notification.success({ message: '推送完成' })
  }, [selectedRepo, push])

  const handleBranchChange = useCallback(
    async (branch: string) => {
      if (!selectedRepo || branch === currentBranch) return
      await switchBranch(selectedRepo.path, branch)
      notification.success({ message: `已切换到 ${branch}` })
    },
    [selectedRepo, currentBranch, switchBranch]
  )

  const tabItems = selectedRepo
    ? [
        {
          key: 'history',
          label: '提交记录',
          children: <CommitHistory />
        },
        {
          key: 'changes',
          label: '文件变更',
          children: <StageArea />
        },
        {
          key: 'branches',
          label: '分支管理',
          children: <BranchList />
        }
      ]
    : []

  return (
    <Layout style={{ flex: 1, background: 'var(--bg-primary)' }}>
      {/* Modals - 始终渲染，不受 early return 影响 */}
      <AddRepoModal />
      <CloneModal />
      <CommitModal />
      <CreateBranchModal />
      <MergeModal />
      {selectedRepo && (
        <GitHubPublishModal
          open={githubModalOpen}
          repoPath={selectedRepo.path}
          repoName={selectedRepo.name}
          onClose={() => setGithubModalOpen(false)}
        />
      )}
      <GithubLoginModal
        open={useStore((s) => s.githubLoginModalOpen) ?? false}
        onClose={() => setModalOpen('githubLoginModalOpen', false)}
      />

      {!selectedRepo ? (
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <Empty description="请从左侧选择一个仓库">
            <Button type="primary" onClick={() => setModalOpen('addRepoModalOpen', true)}>
              添加仓库
            </Button>
          </Empty>
        </Content>
      ) : (
        <>
          {/* 顶部操作栏 */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Breadcrumb
                items={[{ title: <Text strong style={{ color: 'var(--text-primary)' }}>{selectedRepo.name}</Text> }]}
              />
              <Select
                size="small"
                value={currentBranch || undefined}
                onChange={handleBranchChange}
                style={{ minWidth: 140 }}
                loading={branches.length === 0}
                options={branches.map((b) => ({
                  value: b.name,
                  label: (
                    <span>
                      <BranchesOutlined style={{ marginRight: 4 }} />
                      {b.name}
                    </span>
                  )
                }))}
              />
            </div>

            <Space size="small">
              <Badge count={workingStatus?.behind || 0} overflowCount={99} size="small" offset={[-2, 2]}>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={activeOperation === 'pull'}
                  onClick={handlePull}
                >
                  拉取
                </Button>
              </Badge>
              <Badge count={workingStatus?.ahead || 0} overflowCount={99} size="small" offset={[-2, 2]}>
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={activeOperation === 'push'}
                  onClick={handlePush}
                >
                  推送
                </Button>
              </Badge>
              {selectedRepo && !selectedRepo.remoteUrl && (
                <Button
                  size="small"
                  icon={<GithubOutlined />}
                  onClick={() => setGithubModalOpen(true)}
                >
                  推送 GitHub
                </Button>
              )}
            </Space>
          </div>

          {/* Tab 内容 */}
          <Content style={{ padding: 0, overflow: 'hidden', flex: 1, minHeight: 0, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'history' | 'changes' | 'branches')}
              items={tabItems}
              style={{ padding: '0 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              tabBarStyle={{ flexShrink: 0 }}
            />
          </Content>
        </>
      )}

      {/* 操作状态指示器 */}
      {activeOperation && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: 'var(--bg-secondary)',
            padding: '8px 16px',
            borderRadius: 10,
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Spin size="small" />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {activeOperation === 'pull' && '正在拉取...'}
            {activeOperation === 'push' && '正在推送...'}
            {activeOperation === 'commit' && '正在提交...'}
            {activeOperation === 'stage' && '正在暂存...'}
            {activeOperation === 'unstage' && '正在取消暂存...'}
            {activeOperation === 'stage-all' && '正在暂存全部...'}
            {activeOperation === 'create-branch' && '正在创建分支...'}
            {activeOperation === 'switch-branch' && '正在切换分支...'}
            {activeOperation === 'merge' && '正在合并...'}
            {activeOperation === 'delete-branch' && '正在删除分支...'}
            {activeOperation === 'discard' && '正在丢弃修改...'}
            {activeOperation === 'clone' && '正在克隆仓库...'}
          </Text>
        </div>
      )}
    </Layout>
  )
}
