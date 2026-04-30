# 视频浏览器改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将旧 VideoPlayerModal 替换为带文件浏览功能的 VideoBrowserModal，支持浏览本地硬盘目录、过滤视频文件、内嵌播放。

**Architecture:** 新增 fs.ipc.ts 通过 Node.js fs 模块在主进程读取文件系统，前端通过 preload bridge 调用。新组件使用 Ant Design Tree + Card 实现左侧文件夹树 + 右侧视频网格布局，自定义标题栏支持拖拽。

**Tech Stack:** Electron IPC, Node.js fs/path/os, React + TypeScript, Ant Design, Zustand

---

## 文件结构

| 操作 | 文件 | 职责 |
|---|---|---|
| 新增 | `src/main/ipc/fs.ipc.ts` | 文件系统 IPC 处理器：list-drives、read-dir |
| 新增 | `src/renderer/src/features/video/VideoBrowserModal.tsx` | 视频浏览器组件（全部 UI） |
| 新增 | `src/renderer/src/features/video/VideoBrowserModal.css` | 组件样式 |
| 修改 | `src/shared/ipc-channels.ts` | 新增 FS_LIST_DRIVES、FS_READ_DIR 通道 |
| 修改 | `src/main/ipc/index.ts` | 注册 registerFsIpc |
| 修改 | `src/preload/index.ts` | 新增 fsListDrives、fsReadDir bridge 方法 |
| 修改 | `src/renderer/src/components/AppContent.tsx` | import VideoBrowserModal 替换 VideoPlayerModal |
| 删除 | `src/renderer/src/features/video/VideoPlayerModal.tsx` | 旧组件 |

---

### Task 1: 添加 IPC 通道常量

**Files:**
- Modify: `src/shared/ipc-channels.ts`

- [ ] **Step 1: 在 IPC 对象中添加文件系统通道**

在 `IPC` 对象末尾（`WINDOW_OPEN_DIFF` 之后）添加：

```ts
// File System
FS_LIST_DRIVES: 'fs:list-drives',
FS_READ_DIR: 'fs:read-dir',
```

最终 `IPC` 对象末尾：

```ts
  // Window Management
  WINDOW_OPEN_DIFF: 'window:open-diff',

  // File System
  FS_LIST_DRIVES: 'fs:list-drives',
  FS_READ_DIR: 'fs:read-dir'
} as const
```

- [ ] **Step 2: 提交**

```bash
git add src/shared/ipc-channels.ts
git commit -m "feat: add filesystem IPC channel constants"
```

---

### Task 2: 创建文件系统 IPC 处理器

**Files:**
- Create: `src/main/ipc/fs.ipc.ts`

- [ ] **Step 1: 写入 fs.ipc.ts**

```ts
import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { readdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { platform, homedir } from 'os'

const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.webm', '.ogg', '.mkv', '.avi', '.mov', '.wmv', '.flv'
])

function isVideoFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXTENSIONS.has(ext)
}

function isDirectory(path: string): boolean {
  try {
    return require('fs').statSync(path).isDirectory()
  } catch {
    return false
  }
}

function listDrives(): string[] {
  if (platform() === 'win32') {
    const drives: string[] = []
    for (let charCode = 65; charCode <= 90; charCode++) {
      const letter = String.fromCharCode(charCode) + ':\\'
      if (existsSync(letter)) {
        drives.push(letter)
      }
    }
    return drives
  }
  // macOS / Linux: root + home
  const roots = ['/']
  const home = homedir()
  if (home && home !== '/') {
    roots.push(home)
  }
  return roots
}

export function registerFsIpc(): void {
  ipcMain.handle(
    IPC.FS_LIST_DRIVES,
    async (): Promise<IpcResponse<string[]>> => {
      try {
        const drives = listDrives()
        return { success: true, data: drives }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.FS_READ_DIR,
    async (_e, dirPath: string): Promise<IpcResponse<{
      dirs: string[]
      videos: { name: string; size: number; path: string }[]
    }>> => {
      try {
        const entries = readdirSync(dirPath, { withFileTypes: true })
        const dirs: string[] = []
        const videos: { name: string; size: number; path: string }[] = []

        for (const entry of entries) {
          if (entry.isDirectory()) {
            dirs.push(entry.name)
          } else if (entry.isFile() && isVideoFile(entry.name)) {
            const fullPath = join(dirPath, entry.name)
            try {
              const stat = require('fs').statSync(fullPath)
              videos.push({ name: entry.name, size: stat.size, path: fullPath })
            } catch {
              // skip files that can't be stat'd
            }
          }
        }

        dirs.sort((a, b) => a.localeCompare(b))
        videos.sort((a, b) => a.name.localeCompare(b.name))

        return { success: true, data: { dirs, videos } }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/main/ipc/fs.ipc.ts
git commit -m "feat: add filesystem IPC handler for drive listing and directory reading"
```

---

### Task 3: 注册文件系统 IPC

**Files:**
- Modify: `src/main/ipc/index.ts`

- [ ] **Step 1: 添加 import 和注册调用**

在现有 imports 后添加：

```ts
import { registerFsIpc } from './fs.ipc'
```

在 `registerAllIpc` 函数体中添加：

```ts
registerFsIpc()
```

修改后的文件：

```ts
import { registerRepoIpc } from './repo.ipc'
import { registerGitIpc } from './git.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerWindowIpc } from './window.ipc'
import { registerGithubIpc } from './github.ipc'
import { registerFsIpc } from './fs.ipc'

export function registerAllIpc(): void {
  registerRepoIpc()
  registerGitIpc()
  registerSettingsIpc()
  registerWindowIpc()
  registerGithubIpc()
  registerFsIpc()
}
```

- [ ] **Step 2: 提交**

```bash
git add src/main/ipc/index.ts
git commit -m "feat: register filesystem IPC handler"
```

---

### Task 4: 添加 Preload Bridge 方法

**Files:**
- Modify: `src/preload/index.ts`

- [ ] **Step 1: 在 api 对象中添加 fs 方法**

在 `api` 对象的 `windowOpenDiff` 之后添加：

```ts
// File System
fsListDrives: () => ipcRenderer.invoke(IPC.FS_LIST_DRIVES),
fsReadDir: (dirPath: string) => ipcRenderer.invoke(IPC.FS_READ_DIR, dirPath),
```

- [ ] **Step 2: 提交**

```bash
git add src/preload/index.ts
git commit -m "feat: add filesystem preload bridge methods"
```

---

### Task 5: 创建 VideoBrowserModal 组件

**Files:**
- Create: `src/renderer/src/features/video/VideoBrowserModal.tsx`
- Create: `src/renderer/src/features/video/VideoBrowserModal.css`

- [ ] **Step 1: 写入 CSS 样式文件**

```css
.video-browser-modal .ant-modal-header {
  cursor: move;
  user-select: none;
}

.video-browser-content {
  display: flex;
  gap: 0;
  height: 480px;
}

.video-browser-sidebar {
  width: 240px;
  min-width: 200px;
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drive-selector {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid var(--border-secondary);
}

.drive-btn {
  font-size: 12px;
  height: 28px;
  min-width: 44px;
}

.folder-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.video-browser-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.video-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  align-content: start;
}

.video-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-card .ant-card-cover {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-size: 40px;
}

.video-card .ant-card-meta-title {
  font-size: 13px;
  margin-bottom: 2px !important;
}

.video-card .ant-card-meta-description {
  font-size: 11px;
}

.video-player-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin: 16px;
}

.video-player-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.video-player-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-wrapper video {
  width: 100%;
  max-height: 100%;
}

.video-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  gap: 12px;
}

.video-status-bar {
  padding: 8px 16px;
  border-top: 1px solid var(--border-primary);
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 2: 写入 VideoBrowserModal.tsx**

```tsx
import { Modal, Button, Tree, Card, Typography, Spin, Empty, Tooltip, message } from 'antd'
import {
  PlayCircleOutlined,
  FolderOutlined,
  FileOutlined,
  ArrowLeftOutlined,
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

  // load directory contents
  const loadDir = useCallback(async (dirPath: string) => {
    setLoading(true)
    try {
      const res: any = await window.electronAPI.fsReadDir(dirPath)
      if (res.success) {
        setVideos(res.data.videos)
        setTreeNodes(
          res.data.dirs.map((d: string) => ({
            title: d,
            key: dirPath + (dirPath.endsWith('\\') || dirPath.endsWith('/') ? '' : (dirPath.includes('\\') ? '\\' : '/')) + d,
            isLeaf: false
          }))
        )
        setCurrentPath(dirPath)
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

  // select drive
  const handleDriveSelect = (drive: string) => {
    setCurrentDrive(drive)
    setPlayingVideo(null)
    loadDir(drive)
  }

  // lazy load tree node children
  const handleTreeLoad = async (node: any) => {
    const dirPath = node.key as string
    try {
      const res: any = await window.electronAPI.fsReadDir(dirPath)
      if (res.success) {
        return res.data.dirs.map((d: string) => ({
          title: d,
          key: dirPath + (dirPath.endsWith('\\') || dirPath.endsWith('/') ? '' : (dirPath.includes('\\') ? '\\' : '/')) + d,
          isLeaf: false
        }))
      }
    } catch { /* ignore */ }
    return []
  }

  // select folder from tree
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      setPlayingVideo(null)
      loadDir(selectedKeys[0] as string)
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
        {/* 左侧栏 */}
        <div className="video-browser-sidebar">
          {/* 盘符按钮组 */}
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

          {/* 文件夹树 */}
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

        {/* 右侧主区域 */}
        <div className="video-browser-main">
          {playingVideo ? (
            /* 视频播放器 */
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
            /* 视频卡片网格 */
            <div className="video-grid">
              {videos.map((v) => (
                <Card
                  key={v.path}
                  hoverable
                  className="video-card"
                  size="small"
                  cover={
                    <div style={{
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-tertiary)',
                      fontSize: 40
                    }}>
                      <PlayCircleOutlined style={{ color: 'var(--accent)' }} />
                    </div>
                  }
                  onClick={() => handlePlayVideo(v)}
                  onDoubleClick={() => {
                    handlePlayVideo(v)
                    setTimeout(() => videoRef.current?.requestFullscreen(), 100)
                  }}
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

      {/* 底部状态栏 */}
      {currentPath && (
        <div className="video-status-bar">
          <FolderOutlined />
          <Text>当前目录: {currentPath}</Text>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/features/video/VideoBrowserModal.tsx src/renderer/src/features/video/VideoBrowserModal.css
git commit -m "feat: add VideoBrowserModal with file browser and video playback"
```

---

### Task 6: 更新 AppContent 引用

**Files:**
- Modify: `src/renderer/src/components/AppContent.tsx`

- [ ] **Step 1: 替换 import 和组件使用**

将第 20 行的：
```tsx
import VideoPlayerModal from '../features/video/VideoPlayerModal'
```

改为：
```tsx
import VideoBrowserModal from '../features/video/VideoBrowserModal'
```

将第 130 行的：
```tsx
<VideoPlayerModal />
```

改为：
```tsx
<VideoBrowserModal />
```

- [ ] **Step 2: 删除旧组件文件**

```bash
rm src/renderer/src/features/video/VideoPlayerModal.tsx
```

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/components/AppContent.tsx
git rm src/renderer/src/features/video/VideoPlayerModal.tsx
git commit -m "feat: replace VideoPlayerModal with VideoBrowserModal"
```

---

### Task 7: 编译验证

- [ ] **Step 1: 运行 TypeScript 编译检查**

```bash
npx tsc --noEmit
```

修正所有类型错误（如有）。

- [ ] **Step 2: 运行完整构建**

```bash
npm run build
```

确认 out 目录生成正确。

- [ ] **Step 3: 提交（如有修复）**

```bash
git add -A
git commit -m "fix: type errors from VideoBrowserModal"
```
