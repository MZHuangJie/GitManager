import { Modal, Form, Input, Button, List, Tag } from 'antd'
import { useStore } from '../../stores'

const { TextArea } = Input

export default function CommitModal() {
  const open = useStore((s) => s.commitModalOpen)
  const workingStatus = useStore((s) => s.workingStatus)
  const activeOperation = useStore((s) => s.activeOperation)
  const repos = useStore((s) => s.repos)
  const selectedRepoId = useStore((s) => s.selectedRepoId)

  const setModalOpen = useStore((s) => s.setModalOpen)
  const commit = useStore((s) => s.commit)

  const selectedRepo = repos.find((r) => r.id === selectedRepoId)
  const [form] = Form.useForm()

  const handleCommit = async () => {
    if (!selectedRepo) return
    const values = await form.validateFields()
    await commit(selectedRepo.path, values.message)
    setModalOpen('commitModalOpen', false)
    form.resetFields()
  }

  const stagedFiles = workingStatus?.staged || []
  const stagedPaths = [...stagedFiles.map((f) => f.path)]

  return (
    <Modal
      title="提交变更"
      open={open}
      onCancel={() => {
        setModalOpen('commitModalOpen', false)
        form.resetFields()
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setModalOpen('commitModalOpen', false)
            form.resetFields()
          }}
        >
          取消
        </Button>,
        <Button
          key="commit"
          type="primary"
          onClick={handleCommit}
          loading={activeOperation === 'commit'}
          disabled={stagedFiles.length === 0}
        >
          提交
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label={`已暂存文件 (${stagedFiles.length})`}>
          {stagedFiles.length === 0 ? (
            <Tag>没有已暂存的文件</Tag>
          ) : (
            <List
              size="small"
              dataSource={stagedPaths}
              renderItem={(f) => (
                <List.Item style={{ padding: '2px 0' }}>
                  <Tag
                    color={
                      f.includes('?') ? 'blue' :
                      f.includes('D') ? 'red' :
                      'green'
                    }
                  >
                    {f}
                  </Tag>
                </List.Item>
              )}
              style={{ maxHeight: 200, overflow: 'auto' }}
            />
          )}
        </Form.Item>
        <Form.Item
          name="message"
          label="提交信息"
          rules={[{ required: true, message: '请输入提交信息' }]}
        >
          <TextArea rows={4} placeholder="描述你的修改..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
