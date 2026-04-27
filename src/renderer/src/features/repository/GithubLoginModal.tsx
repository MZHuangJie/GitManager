import { Modal, Form, Input, Button, Typography, notification } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useState, useEffect } from 'react'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

export default function GithubLoginModal({ open, onClose }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const setGithubLogin = useStore((s) => s.setGithubLogin)
  const setGithubRepos = useStore((s) => s.setGithubRepos)

  useEffect(() => {
    if (open) {
      window.electronAPI.githubGetToken().then((res: any) => {
        if (res.success && res.data) {
          form.setFieldsValue({ token: res.data })
        }
      })
    }
  }, [open, form])

  const handleLogin = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      const validateRes: any = await window.electronAPI.githubValidateToken(values.token)
      if (!validateRes.success) {
        notification.error({ message: '登录失败', description: validateRes.error })
        return
      }
      await window.electronAPI.githubSaveToken(values.token)
      setGithubLogin(true, validateRes.data.login, validateRes.data.avatarUrl)
      // 拉取仓库列表
      const reposRes: any = await window.electronAPI.githubListRepos(values.token)
      if (reposRes.success) {
        setGithubRepos(reposRes.data)
      }
      notification.success({ message: `已登录为 ${validateRes.data.login}` })
      onClose()
    } catch (err: any) {
      notification.error({ message: '登录失败', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <GithubOutlined style={{ marginRight: 8 }} />
          登录 GitHub
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="login" type="primary" icon={<GithubOutlined />} loading={loading} onClick={handleLogin}>
          登录
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="token"
          label="Personal Access Token"
          rules={[{ required: true, message: '请输入 GitHub Token' }]}
          extra={
            <Text type="secondary" style={{ fontSize: 11 }}>
              需要 repo 权限。在 GitHub Settings &gt; Developer settings &gt; Personal access tokens 中生成
            </Text>
          }
        >
          <Input.Password placeholder="ghp_xxxxxxxxxxxx" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
