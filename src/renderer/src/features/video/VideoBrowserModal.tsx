import { Modal, Button, Tree, Card, Typography, Spin, Tooltip, message } from 'antd'
import {
  PlayCircleOutlined,
  FolderOutlined,
  ArrowLeftOutlined,
  FullscreenOutlined,
  HddOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { useStore } from '../../stores'
import { useState, useEffect, useCallback, useRef } from 'react'
import './VideoBrowserModal.css'

const { Text } = Typography

interface VideoFile {
  name: string
  size: number
  path: string
}

interface TreeNode {
  title: string
  key: string
  isLeaf: boolean
  children?: TreeNode[]
}

function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

function joinPath(parent: string, child: string): string {
  const sep = parent.includes('\\') ? '\\' : '/'
  return parent.endsWith(sep) ? parent + child : parent + sep + child
}

export default function VideoBrowserModal() {
  const open = useStore((s) => s.videoPlayerModalOpen)
  const setModalOpen = useStore((s) => s.setModalOpen)

  const [drives, setDrives] = useState<string[]>([])
  const [currentDrive, setCurrentDrive] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)

  const [playingVideo, setPlayingVideo] = useState<VideoFile | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const loadIdRef = useRef(0)

  // drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // load drives on open
  useEffect(() => {
    if (open) {
      setDriveLoading(true)
      window.electronAPI.fsListDrives().then((res: any) => {
        if (res.success) {
          setDrives(res.data)
        }
        setDriveLoading(false)
      })
      // reset state
      setCurrentDrive(null)
      setCurrentPath(null)
      setVideos([])
      setTreeNodes([])
      setPlayingVideo(null)
    }
  }, [open])

  // load videos for a directory (does NOT touch tree)
  const loadVideos = useCallback(async (dirPath: string) => {
    const loadId = ++loadIdRef.current
    setLoading(true)
    try {
      const res: any = await window.electronAPI.fsReadDir(dirPath)
      if (loadId !== loadIdRef.current) return
      if (res.success) {
        setVideos(res.data.videos)
        setCurrentPath(dirPath)
      } else {
        message.error(res.error)
        setVideos([])
      }
    } catch (err: any) {
      if (loadId !== loadIdRef.current) return
      message.error(err.message)
    }
    if (loadId === loadIdRef.current) setLoading(false)
  }, [])

  // build tree nodes from a directory listing
  const buildTreeNodes = (dirPath: string, dirs: string[]): TreeNode[] =>
    dirs.map((d) => ({
      title: d,
      key: joinPath(dirPath, d),
      isLeaf: false
    }))

  // select drive — initializes both tree and videos
  const handleDriveSelect = useCallback(async (drive: string) => {
    setCurrentDrive(drive)
    setPlayingVideo(null)
    setLoading(true)
    try {
      const res: any = await window.electronAPI.fsReadDir(drive)
      if (res.success) {
        setVideos(res.data.videos)
        setTreeNodes(buildTreeNodes(drive, res.data.dirs))
        setCurrentPath(drive)
      } else {
        message.error(res.error)
        setVideos([])
        setTreeNodes([])
      }
    } catch (err: any) {
      message.error(err.message)
    }
    setLoading(false)
  }, [])

  // lazy load tree node children
  const handleTreeLoad = async (node: any) => {
    const dirPath = node.key as string
    try {
      const res: any = await window.electronAPI.fsReadDir(dirPath)
      if (res.success) {
        return buildTreeNodes(dirPath, res.data.dirs)
      }
    } catch (err: any) {
      message.error(err?.message || '读取目录失败')
    }
    return []
  }

  // select folder from tree — only loads videos, tree stays intact
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      setPlayingVideo(null)
      loadVideos(selectedKeys[0] as string)
    }
  }

  // play video
  const handlePlayVideo = (video: VideoFile) => {
    setPlayingVideo(video)
    setTimeout(() => {
      videoRef.current?.play()
    }, 0)
  }

  const handleBackToGrid = () => {
    setPlayingVideo(null)
  }

  const handleClose = () => {
    setModalOpen('videoPlayerModalOpen', false)
    setPlayingVideo(null)
    setDragOffset({ x: 0, y: 0 })
  }

  // drag effect
  useEffect(() => {
    if (!dragging) return
    const handleMouseMove = (e: MouseEvent) => {
      setDragOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
    const handleMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VideoCameraOutlined style={{ color: 'var(--accent)' }} />
          <span>视频浏览器</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
      className="video-browser-modal"
      modalRender={(modal) => (
        <div
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            transition: dragging ? 'none' : 'transform 0.15s'
          }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('.ant-modal-header')) {
              setDragging(true)
              dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
            }
          }}
        >
          {modal}
        </div>
      )}
    >
      <div className="video-browser-content">
        {/* Sidebar */}
        <div className="video-browser-sidebar">
          {/* Drive buttons */}
          <div className="drive-selector">
            {driveLoading ? (
              <Spin size="small" />
            ) : (
              drives.map((drive) => (
                <Button
                  key={drive}
                  size="small"
                  type={currentDrive === drive ? 'primary' : 'default'}
                  className="drive-btn"
                  icon={<HddOutlined />}
                  onClick={() => handleDriveSelect(drive)}
                >
                  {drive.replace(':\\', '')}
                </Button>
              ))
            )}
          </div>

          {/* Folder tree */}
          <div className="folder-tree">
            {currentPath && (
              <Tree
                treeData={treeNodes}
                loadData={handleTreeLoad}
                onSelect={handleTreeSelect}
                showIcon
                blockNode
                defaultExpandAll={false}
              />
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="video-browser-main">
          {playingVideo ? (
            /* Video player */
            <div className="video-player-area">
              <div className="video-player-toolbar">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToGrid}
                  style={{ color: 'var(--text-primary)' }}
                >
                  返回
                </Button>
                <Text style={{ color: 'var(--text-primary)' }}>{playingVideo.name}</Text>
                <Text type="secondary">{formatSize(playingVideo.size)}</Text>
                <Button
                  type="text"
                  icon={<FullscreenOutlined />}
                  onClick={() => videoRef.current?.requestFullscreen()}
                  style={{ color: 'var(--text-primary)' }}
                  title="全屏"
                />
              </div>
              <div className="video-player-wrapper">
                <video
                  ref={videoRef}
                  src={'file:///' + playingVideo.path.replace(/\\/g, '/')}
                  controls
                  autoPlay
                  onError={() => message.error('无法播放此视频文件')}
                />
              </div>
            </div>
          ) : loading ? (
            <div className="video-loading">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : videos.length > 0 ? (
            /* Video card grid */
            <div className="video-grid">
              {videos.map((v) => (
                <Card
                  key={v.path}
                  hoverable
                  className="video-card"
                  size="small"
                  cover={
                    <div className="video-card-cover">
                      <PlayCircleOutlined style={{ color: 'var(--accent)', fontSize: 40 }} />
                    </div>
                  }
                  onClick={() => handlePlayVideo(v)}
                >
                  <Card.Meta
                    title={
                      <Tooltip title={v.name}>
                        <Text ellipsis style={{ maxWidth: 130 }}>{v.name}</Text>
                      </Tooltip>
                    }
                    description={formatSize(v.size)}
                  />
                </Card>
              ))}
            </div>
          ) : currentPath ? (
            <div className="video-empty">
              <VideoCameraOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)' }} />
              <Text type="secondary">此文件夹下没有视频文件</Text>
            </div>
          ) : (
            <div className="video-empty">
              <HddOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)' }} />
              <Text type="secondary">选择一个盘符开始浏览</Text>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      {currentPath && (
        <div className="video-status-bar">
          <FolderOutlined />
          <Text>当前目录: {currentPath}</Text>
        </div>
      )}
    </Modal>
  )
}
