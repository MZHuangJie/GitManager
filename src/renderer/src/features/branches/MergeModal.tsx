import { Modal, Form, Select, Button, Alert, Typography, notification } from 'antd'
import { useStore } from '../../stores'
import { useState } from 'react'

const { Text } = Typography

export default function MergeModal() {
  const open = useStore((s) => s.mergeModalOpen)
  const activeOperation = useStore((s) => s.activeOperation)
  const branches = useStore((s) => s.branches)
  const currentBranch = useStore((s) => s.currentBranch)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)

  const setModalOpen = useStore((s) => s.setModalOpen)
  const merge = useStore((s) => s.merge)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)
  const [form] = Form.useForm()
  const [conflicts, setConflicts] = useState<string[] | null>(null)

  const [targetBranch, setTargetBranch] = useState(currentBranch)

  const handleMerge = async () => {
    if (!selectedRepo) return
    const values = await form.validateFields()
    const result = await merge(selectedRepo.path, values.sourceBranch, targetBranch)
    if (result) {
      if (result.merged) {
        setModalOpen('mergeModalOpen', false)
        form.resetFields()
        setConflicts(null)
        setTargetBranch(currentBranch)
        notification.success({ message: `已将 ${values.sourceBranch} 合并到 ${targetBranch}` })
      } else if (result.conflicts) {
        setConflicts(result.conflicts)
      }
    }
  }

  return (
    <Modal
      title="合并分支"
      open={open}
      onCancel={() => {
        setModalOpen('mergeModalOpen', false)
        form.resetFields()
        setConflicts(null)
        setTargetBranch(currentBranch)
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setModalOpen('mergeModalOpen', false)
            form.resetFields()
            setConflicts(null)
            setTargetBranch(currentBranch)
          }}
        >
          取消
        </Button>,
        <Button
          key="merge"
          type="primary"
          danger
          onClick={handleMerge}
          loading={activeOperation === 'merge'}
        >
          合并
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="sourceBranch"
          label="源分支"
          rules={[{ required: true, message: '请选择要合并的源分支' }]}
        >
          <Select
            placeholder="选择要合并的分支..."
            options={branches.map((b) => ({
              value: b.name,
              label: b.name
            }))}
          />
        </Form.Item>
        <Form.Item label="目标分支">
          <Select
            value={targetBranch}
            onChange={setTargetBranch}
            options={branches.map((b) => ({
              value: b.name,
              label: b.name
            }))}
          />
        </Form.Item>
      </Form>

      {conflicts && conflicts.length > 0 && (
        <Alert
          type="error"
          title="检测到合并冲突"
          description={
            <div>
              <Text>冲突文件：</Text>
              <ul>
                {conflicts.map((f) => (
                  <li key={f}>
                    <Text code>{f}</Text>
                  </li>
                ))}
              </ul>
              <Text>请手动解决冲突后再提交合并。</Text>
            </div>
          }
          showIcon
        />
      )}
    </Modal>
  )
}
