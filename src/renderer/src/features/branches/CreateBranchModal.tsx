import { Modal, Form, Input, Button, Select, Switch } from 'antd'
import { useStore } from '../../stores'
import { useEffect } from 'react'

export default function CreateBranchModal() {
  const open = useStore((s) => s.createBranchModalOpen)
  const activeOperation = useStore((s) => s.activeOperation)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)
  const branches = useStore((s) => s.branches)

  const setModalOpen = useStore((s) => s.setModalOpen)
  const createBranch = useStore((s) => s.createBranch)
  const loadBranches = useStore((s) => s.loadBranches)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)
  const [form] = Form.useForm()

  useEffect(() => {
    if (open && selectedRepo) {
      loadBranches(selectedRepo.path)
    }
  }, [open, selectedRepo, loadBranches])

  const handleCreate = async () => {
    if (!selectedRepo) return
    const values = await form.validateFields()
    await createBranch(selectedRepo.path, values.name, values.baseBranch, values.switchTo)
    setModalOpen('createBranchModalOpen', false)
    form.resetFields()
  }

  return (
    <Modal
      title="新建分支"
      open={open}
      onCancel={() => {
        setModalOpen('createBranchModalOpen', false)
        form.resetFields()
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setModalOpen('createBranchModalOpen', false)
            form.resetFields()
          }}
        >
          取消
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={handleCreate}
          loading={activeOperation === 'create-branch'}
        >
          创建
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="baseBranch"
          label="基础分支"
        >
          <Select
            placeholder="选择基础分支（默认为当前分支）"
            options={branches.map((b) => ({
              value: b.name,
              label: `${b.name}${b.current ? ' (当前)' : ''}`
            }))}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="分支名称"
          rules={[{ required: true, message: '请输入分支名称' }]}
        >
          <Input placeholder="feature/新功能分支" />
        </Form.Item>
        <Form.Item
          name="switchTo"
          label="切换到新分支"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
