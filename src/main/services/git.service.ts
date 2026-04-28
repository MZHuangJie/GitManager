import { simpleGit, SimpleGit, simpleGit as createGit } from 'simple-git'
import path from 'path'
import fs from 'fs'
import {
  LogOptions,
  CommitEntry,
  WorkingStatus,
  StatusFile,
  BranchEntry
} from '../../shared/types'

function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

/** Parse conflict markers and keep both sections in the specified order */
function resolveConflictContent(content: string, oursFirst: boolean): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inConflict = false
  let inOurs = false
  let inTheirs = false
  const oursLines: string[] = []
  const theirsLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('<<<<<<< ')) {
      inConflict = true
      inOurs = true
      continue
    }
    if (line.startsWith('=======') && inConflict) {
      inOurs = false
      inTheirs = true
      continue
    }
    if (line.startsWith('>>>>>>> ') && inConflict) {
      inTheirs = false
      inConflict = false
      if (oursFirst) {
        result.push(...oursLines, ...theirsLines)
      } else {
        result.push(...theirsLines, ...oursLines)
      }
      oursLines.length = 0
      theirsLines.length = 0
      continue
    }
    if (inOurs) {
      oursLines.push(line)
    } else if (inTheirs) {
      theirsLines.push(line)
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

export const gitService = {
  async getStatus(repoPath: string): Promise<WorkingStatus> {
    const git = getGit(repoPath)
    const status = await git.status()

    // 收集所有文件路径，用 git check-ignore 过滤掉被 .gitignore 忽略的文件
    const allPaths = [
      ...status.staged,
      ...status.modified,
      ...status.created,
      ...status.deleted
    ]
    let ignoredPaths: Set<string> = new Set()

    if (allPaths.length > 0) {
      // 批量检查：将路径通过 stdin 传给 git check-ignore -n
      // -n：非忽略文件输出 "::<path>"，被忽略文件直接输出 "<path>"
      const input = allPaths.join('\n') + '\n'
      try {
        const result = await git.raw(['check-ignore', '--stdin', '-n'], input)
        // -n: 非忽略文件输出 "::<path>"，被忽略文件直接输出 "<path>"
        result
          .split('\n')
          .filter((line) => !line.startsWith('::') && line.trim() !== '')
          .forEach((line) => ignoredPaths.add(line.trim()))
      } catch {
        // 如果全部文件都不匹配 .gitignore，忽略异常
      }
    }

    const filterIgnored = (files: string[]) =>
      files.filter((f) => !ignoredPaths.has(f))

    return {
      staged: filterIgnored(status.staged).map((file: string) => ({
        path: file,
        index: 'M',
        working_dir: ' '
      })),
      unstaged: filterIgnored(status.modified).map((file: string) => ({
        path: file,
        index: ' ',
        working_dir: 'M'
      })),
      created: filterIgnored(status.created),
      deleted: filterIgnored(status.deleted),
      renamed: status.renamed
        .filter((r: { from: string; to: string }) =>
          !ignoredPaths.has(r.from) && !ignoredPaths.has(r.to)
        )
        .map((r: { from: string; to: string }) => ({
          from: r.from,
          to: r.to
        })),
      ahead: status.ahead,
      behind: status.behind
    }
  },

  async getLog(repoPath: string, opts: LogOptions = {}): Promise<CommitEntry[]> {
    const git = getGit(repoPath)
    const logOpts: Record<string, unknown> = {
      maxCount: opts.maxCount ?? 50,
      ...(opts.skip ? { '--skip': opts.skip } : {})
    }
    const log = await git.log(logOpts)

    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      author: entry.author_name,
      email: entry.author_email,
      date: entry.date,
      refs: entry.refs ? entry.refs.split(', ').filter(Boolean) : []
    }))
  },

  async getDiff(repoPath: string, hash: string): Promise<string> {
    const git = getGit(repoPath)
    const diff = await git.diff([`${hash}^!`])
    // Cap diff output at 5000 lines
    const lines = diff.split('\n')
    if (lines.length > 5000) {
      return lines.slice(0, 5000).join('\n') + '\n\n... (diff truncated at 5000 lines)'
    }
    return diff
  },

  async getDiffForFile(repoPath: string, file: string, staged: boolean): Promise<string> {
    const git = getGit(repoPath)
    const args = staged ? ['--cached', '--', file] : ['--', file]
    return await git.diff(args)
  },

  async getShow(repoPath: string, hash: string): Promise<string> {
    const git = getGit(repoPath)
    const show = await git.show([hash])
    // Cap at 5000 lines
    const lines = show.split('\n')
    if (lines.length > 5000) {
      return lines.slice(0, 5000).join('\n') + '\n\n... (output truncated at 5000 lines)'
    }
    return show
  },

  async getBranchList(repoPath: string): Promise<BranchEntry[]> {
    const git = getGit(repoPath)
    const branches = await git.branch()
    return branches.all.map((name: string) => ({
      name,
      current: name === branches.current,
      commit: branches.branches[name]?.commit || '',
      label: branches.branches[name]?.label || ''
    }))
  },

  async getCurrentBranch(repoPath: string): Promise<string> {
    const git = getGit(repoPath)
    const branches = await git.branch()
    return branches.current
  },

  // Write operations

  async stageFiles(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath)
    await git.add(files)
  },

  async unstageFiles(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath)
    await git.reset(['--', ...files])
  },

  async stageAll(repoPath: string): Promise<void> {
    const git = getGit(repoPath)
    await git.add('.')
  },

  async commit(repoPath: string, message: string): Promise<{ hash: string }> {
    const git = getGit(repoPath)
    const result = await git.commit(message)
    return { hash: result.commit || '' }
  },

  async pull(repoPath: string): Promise<{
    files: string[]
    summary: { changes: number; insertions: number; deletions: number }
  }> {
    const git = getGit(repoPath)
    const result = await git.pull()
    return {
      files: result.files || [],
      summary: {
        changes: result.summary.changes,
        insertions: result.summary.insertions,
        deletions: result.summary.deletions
      }
    }
  },

  async push(repoPath: string): Promise<{ pushed: boolean }> {
    const git = getGit(repoPath)
    const result = await git.push()
    return {
      pushed: result.pushed || false
    }
  },

  async createBranch(repoPath: string, name: string, baseBranch?: string, switchTo = true): Promise<void> {
    const git = getGit(repoPath)
    if (switchTo) {
      if (baseBranch) {
        await git.checkout(baseBranch)
      }
      await git.checkoutLocalBranch(name)
    } else {
      if (baseBranch) {
        await git.raw(['branch', name, baseBranch])
      } else {
        await git.branch([name])
      }
    }
  },

  async switchBranch(repoPath: string, branch: string): Promise<void> {
    const git = getGit(repoPath)
    await git.checkout(branch)
  },

  async merge(repoPath: string, sourceBranch: string, targetBranch: string): Promise<{
    merged: boolean
    conflicts?: string[]
    summary?: { changes: number; insertions: number; deletions: number }
  }> {
    const git = getGit(repoPath)
    // 如果目标分支不是当前分支，先切换
    const branches = await git.branch()
    if (branches.current !== targetBranch) {
      await git.checkout(targetBranch)
    }
    try {
      const result = await git.merge([sourceBranch])
      // 合并后确保停留在目标分支
      await git.checkout(targetBranch)
      return {
        merged: true,
        summary: {
          changes: result.summary?.changes || 0,
          insertions: result.summary?.insertions || 0,
          deletions: result.summary?.deletions || 0
        }
      }
    } catch (err: any) {
      // 冲突时也确保停留在目标分支
      await git.checkout(targetBranch)
      if (err?.message?.includes('CONFLICT') || err?.message?.includes('conflict')) {
        const status = await git.status()
        return {
          merged: false,
          conflicts: status.conflicted
        }
      }
      throw err
    }
  },

  async deleteBranch(repoPath: string, branch: string): Promise<void> {
    const git = getGit(repoPath)
    await git.deleteLocalBranch(branch)
  },

  async discardFiles(repoPath: string, files: string[]): Promise<void> {
    const git = getGit(repoPath)
    // 先取消暂存，再丢弃工作区修改
    await git.reset(['HEAD', '--', ...files])
    await git.checkout(['--', ...files])
  },

  async revertHunk(repoPath: string, file: string, hunkHeader: string, hunkLines: string): Promise<void> {
    const git = getGit(repoPath)
    // 构造完整 patch 然后反向应用
    const patch = `--- a/${file}\n+++ b/${file}\n${hunkHeader}\n${hunkLines}`
    await git.raw(['apply', '--reverse'], patch)
  },

  async resolveConflict(
    repoPath: string,
    file: string,
    strategy: 'ours' | 'theirs' | 'both-ours-first' | 'both-theirs-first'
  ): Promise<void> {
    const git = getGit(repoPath)
    if (strategy === 'ours') {
      await git.raw(['checkout', '--ours', file])
      await git.add([file])
    } else if (strategy === 'theirs') {
      await git.raw(['checkout', '--theirs', file])
      await git.add([file])
    } else {
      // 保留双方：删除冲突标记，按顺序拼接
      const filePath = path.join(repoPath, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const resolved = resolveConflictContent(content, strategy === 'both-ours-first')
        fs.writeFileSync(filePath, resolved, 'utf-8')
      }
      await git.add([file])
    }
  },

  async getFileDiff(repoPath: string, file: string, staged: boolean): Promise<string> {
    const git = getGit(repoPath)
    const args = staged ? ['--cached', '--', file] : ['--', file]
    return await git.diff(args)
  },

  async getFullFileDiff(repoPath: string, file: string, staged: boolean): Promise<string> {
    const git = getGit(repoPath)
    const args = staged
      ? ['--unified=999999', '--cached', '--', file]
      : ['--unified=999999', '--', file]
    return await git.diff(args)
  },

  async init(repoPath: string): Promise<void> {
    const git = getGit(repoPath)
    await git.init()
  },

  async addRemote(repoPath: string, name: string, url: string): Promise<void> {
    const git = getGit(repoPath)
    try {
      const remotes = await git.getRemotes(false)
      if (remotes.some((r) => r.name === name)) {
        await git.remote(['set-url', name, url])
        return
      }
    } catch {
      // getRemotes may fail on fresh repos without config, ignore
    }
    await git.addRemote(name, url)
  },

  async pushWithUpstream(repoPath: string, remote: string, branch: string): Promise<void> {
    const git = getGit(repoPath)
    await git.push(remote, branch, ['-u'])
  },

  async resetToCommit(repoPath: string, hash: string): Promise<void> {
    const git = getGit(repoPath)
    await git.reset(['--hard', hash])
  },

  async clone(url: string, targetDir: string): Promise<{ repoPath: string }> {
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    const repoName = url.split('/').pop()?.replace('.git', '') || 'repo'
    const destPath = path.join(targetDir, repoName)
    await createGit().clone(url, destPath)
    return { repoPath: destPath }
  }
}
