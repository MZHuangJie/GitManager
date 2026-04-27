import { Modal, Form, Input, Switch, Button, Typography, notification } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useState, useEffect } from 'react'

const { Text } = Typography

interface Props {
  open: boolean
  repoPath: string
  repoName: string
  onClose: () => void
}

export default function GitHubPublishModal({ open, repoPath, repoName, onClose }: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const stageAll = useStore((s) => s.stageAll)
  const commit = useStore((s) => s.commit)
  const repos = useStore((s) => s.repos)
  const updateRepoInfo = useStore((s) => s.updateRepoInfo)

  useEffect(() => {
    if (open) {
      window.electronAPI.githubGetToken().then((res: any) => {
        if (res.success && res.data) {
          form.setFieldsValue({ token: res.data })
        }
      })
      form.setFieldsValue({ repoName })
    }
  }, [open, repoName, form])

  const handlePublish = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      // Save token
      if (values.token) {
        await window.electronAPI.githubSaveToken(values.token)
      }

      // Create repo on GitHub
      const createRes: any = await window.electronAPI.githubCreateRepo(
        values.token,
        values.repoName || repoName,
        values.isPrivate || false
      )

      if (!createRes.success) {
        notification.error({ message: '创建 GitHub 仓库失败', description: createRes.error })
        return
      }

      const { cloneUrl } = createRes.data

      // 构建带 token 的认证 URL，避免 git push 时卡在凭证输入
      const authUrl = cloneUrl.replace('https://', `https://${values.token}@`)

      // Add remote
      const remoteRes: any = await window.electronAPI.gitAddRemote(repoPath, 'origin', authUrl)
      if (!remoteRes.success) {
        notification.error({ message: '添加远程仓库失败', description: remoteRes.error })
        return
      }

      notification.success({ message: `GitHub 仓库已创建: ${cloneUrl}` })

      // 更新 repo 的 remoteUrl，使其归入"我的仓库"（存储不含 token 的 URL）
      const targetRepo = repos.find((r) => r.path === repoPath)
      if (targetRepo) {
        await updateRepoInfo(targetRepo.id, { remoteUrl: cloneUrl })
      }

      // 检查是否有提交记录（新 init 的仓库没有分支和提交）
      let branchName = ''
      try {
        const branchRes: any = await window.electronAPI.gitCurrentBranch(repoPath)
        if (branchRes.success && branchRes.data) {
          branchName = branchRes.data
        }
      } catch {
        // 没有分支，说明是空仓库
      }

      if (!branchName) {
        // 空仓库需要先创建初始提交
        await stageAll(repoPath)
        await commit(repoPath, 'Initial commit')
        // 获取刚创建的默认分支名
        const branchRes: any = await window.electronAPI.gitCurrentBranch(repoPath)
        branchName = branchRes.success ? branchRes.data : 'main'
      }

      // Push 到 GitHub 并设置上游分支
      await window.electronAPI.gitPushWithUpstream(repoPath, 'origin', branchName)

      notification.success({ message: '已推送到 GitHub' })
      onClose()
    } catch (err: any) {
      notification.error({ message: '操作失败', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <GithubOutlined style={{ marginRight: 8 }} />
          推送到 GitHub
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="publish" type="primary" icon={<GithubOutlined />} loading={loading} onClick={handlePublish}>
          创建仓库并推送
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="token"
          label="GitHub Personal Access Token"
          rules={[{ required: true, message: '请输入 GitHub Token' }]}
          extra={
            <Text type="secondary" style={{ fontSize: 11 }}>
              需要 repo 权限。在 GitHub Settings &gt; Developer settings &gt; Personal access tokens 中生成
            </Text>
          }
        >
          <Input.Password placeholder="ghp_xxxxxxxxxxxx" />
        </Form.Item>
        <Form.Item
          name="repoName"
          label="仓库名称"
          rules={[{ required: true, message: '请输入仓库名称' }]}
        >
          <Input placeholder={repoName} />
        </Form.Item>
        <Form.Item name="isPrivate" label="私有仓库" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
