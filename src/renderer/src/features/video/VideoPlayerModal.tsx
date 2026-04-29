import { Modal, Button, Input, Space, Typography } from 'antd'
import { PlayCircleOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useStore } from '../../stores'
import { useRef, useState } from 'react'

const { Text } = Typography

export default function VideoPlayerModal() {
  const open = useStore((s) => s.videoPlayerModalOpen)
  const setModalOpen = useStore((s) => s.setModalOpen)

  const [videoSrc, setVideoSrc] = useState('')
  const [playing, setPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleClose = () => {
    setModalOpen('videoPlayerModalOpen', false)
    setPlaying(false)
    setVideoSrc('')
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      setPlaying(true)
    }
  }

  const handleUrlPlay = () => {
    if (videoSrc.trim()) {
      setPlaying(true)
    }
  }

  return (
    <Modal
      title={
        <span>
          <PlayCircleOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
          视频播放器
        </span>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
      styles={{ body: { padding: '12px 24px' } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="粘贴视频 URL 或选择本地文件..."
            value={videoSrc}
            onChange={(e) => { setVideoSrc(e.target.value); setPlaying(false) }}
            onPressEnter={handleUrlPlay}
          />
          <Button icon={<FolderOpenOutlined />} onClick={handleFileSelect}>
            本地文件
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleUrlPlay}>
            播放
          </Button>
        </Space.Compact>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {playing && videoSrc ? (
          <div style={{
            background: '#000',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300
          }}>
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '60vh', outline: 'none' }}
              onError={() => setPlaying(false)}
            />
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
            border: '2px dashed var(--border-primary)'
          }}>
            <Text type="secondary">
              输入视频 URL 或选择本地视频文件开始播放
            </Text>
          </div>
        )}
      </Space>
    </Modal>
  )
}
