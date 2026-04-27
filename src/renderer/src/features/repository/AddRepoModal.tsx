import { Modal, Input, Button, Space, Alert, Typography, notification } from 'antd'
import { FolderOpenOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useState } from 'react'

const { Text } = Typography

export default function AddRepoModal() {
  const open = useStore((s) => s.addRepoModalOpen)
  const addRepo = useStore((s) => s.addRepo)
  const setModalOpen = useStore((s) => s.setModalOpen)
  const loadRepos = useStore((s) => s.loadRepos)
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNotRepo, setIsNotRepo] = useState(false)

  const handleBrowse = async () => {
    const res: any = await window.electronAPI.repoOpenFolder()
    if (res.success && res.data) {
      setPath(res.data)
      setError(null)
      setIsNotRepo(false)
      // 验证是否为 git 仓库
      const validateRes: any = await window.electronAPI.repoValidate(res.data)
      if (validateRes.success && !validateRes.data) {
        setIsNotRepo(true)
      }
    }
  }

  const handlePathChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPath(val)
    setError(null)
    setIsNotRepo(false)
  }

  const handleInit = async () => {
    if (!path.trim()) return
    setInitLoading(true)
    try {
      const res: any = await window.electronAPI.gitInit(path.trim())
      if (res.success) {
        notification.success({ message: `已在 "${path.trim()}" 初始化 Git 仓库` })
        setIsNotRepo(false)
        // 初始化后直接添加
        await addRepo(path.trim())
        setPath('')
        setModalOpen('addRepoModalOpen', false)
      } else {
        setError(res.error || '初始化失败')
      }
    } catch {
      setError('初始化过程中发生错误')
    } finally {
      setInitLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!path.trim()) return
    setLoading(true)
    setError(null)
    try {
      const validateRes: any = await window.electronAPI.repoValidate(path.trim())
      if (!validateRes.success || !validateRes.data) {
        setIsNotRepo(true)
        return
      }
      await addRepo(path.trim())
      setPath('')
      setModalOpen('addRepoModalOpen', false)
    } catch {
      // 错误由 store 处理
    } finally {
      setLoading(false)
    }
  }

  const close = () => {
    setModalOpen('addRepoModalOpen', false)
    setError(null)
    setPath('')
    setIsNotRepo(false)
  }

  return (
    <Modal
      title="添加仓库"
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          取消
        </Button>,
        isNotRepo ? (
          <Button key="init" type="primary" icon={<PlusCircleOutlined />} loading={initLoading} onClick={handleInit}>
            初始化仓库
          </Button>
        ) : (
          <Button key="add" type="primary" loading={loading} onClick={handleAdd} disabled={!path.trim()}>
            添加
          </Button>
        )
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">选择一个本地 Git 仓库文件夹</Text>
        <Input
          placeholder="仓库路径..."
          value={path}
          onChange={handlePathChange}
          addonAfter={
            <Button type="text" size="small" icon={<FolderOpenOutlined />} onClick={handleBrowse} />
          }
          onPressEnter={handleAdd}
        />
        {isNotRepo && (
          <Alert
            type="warning"
            message="该文件夹不是 Git 仓库"
            description="点击「初始化仓库」按钮将在此文件夹中执行 git init，然后添加到仓库列表。"
            showIcon
          />
        )}
        {error && <Alert message={error} type="error" showIcon />}
      </Space>
    </Modal>
  )
}
