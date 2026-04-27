import { Modal, Input, Button, Space, Typography, notification } from 'antd'
import { CloudDownloadOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useState, useEffect } from 'react'

const { Text } = Typography

export default function CloneModal() {
  const open = useStore((s) => s.cloneModalOpen)
  const activeOperation = useStore((s) => s.activeOperation)
  const cloneUrlPreset = useStore((s) => s.cloneUrlPreset)
  const cloneRepo = useStore((s) => s.cloneRepo)
  const addRepo = useStore((s) => s.addRepo)
  const setModalOpen = useStore((s) => s.setModalOpen)
  const setCloneUrlPreset = useStore((s) => s.setCloneUrlPreset)

  const [url, setUrl] = useState('')
  const [targetDir, setTargetDir] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && cloneUrlPreset) {
      setUrl(cloneUrlPreset)
    }
  }, [open, cloneUrlPreset])

  const handleBrowseDir = async () => {
    const res: any = await window.electronAPI.repoOpenFolder()
    if (res.success && res.data) {
      setTargetDir(res.data)
    }
  }

  const handleClone = async () => {
    if (!url.trim() || !targetDir.trim()) return
    setLoading(true)
    try {
      const result = await cloneRepo(url.trim(), targetDir.trim())
      if (result) {
        // 克隆成功后自动添加到仓库列表
        await addRepo(result.repoPath)
        notification.success({
          message: '克隆完成',
          description: `仓库已克隆到 ${result.repoPath}`
        })
        setCloneUrlPreset('')
        setUrl('')
        setTargetDir('')
        setModalOpen('cloneModalOpen', false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <CloudDownloadOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
          克隆远程仓库
        </span>
      }
      open={open}
      onCancel={() => {
        setModalOpen('cloneModalOpen', false)
        setCloneUrlPreset('')
        setUrl('')
        setTargetDir('')
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setModalOpen('cloneModalOpen', false)
            setCloneUrlPreset('')
            setUrl('')
            setTargetDir('')
          }}
        >
          取消
        </Button>,
        <Button
          key="clone"
          type="primary"
          icon={<CloudDownloadOutlined />}
          loading={loading || activeOperation === 'clone'}
          onClick={handleClone}
          disabled={!url.trim() || !targetDir.trim()}
        >
          克隆
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>远程仓库地址</Text>
          <Input
            placeholder="https://github.com/user/repo.git"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPressEnter={handleClone}
            prefix={<CloudDownloadOutlined style={{ color: 'var(--text-tertiary)' }} />}
          />
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>保存到</Text>
          <Input
            placeholder="选择本地目录..."
            value={targetDir}
            onChange={(e) => setTargetDir(e.target.value)}
            readOnly
            addonAfter={
              <Button type="text" size="small" icon={<FolderOpenOutlined />} onClick={handleBrowseDir} />
            }
          />
        </div>
      </Space>
    </Modal>
  )
}
