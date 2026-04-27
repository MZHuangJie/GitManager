export interface DiffLine {
  type: 'add' | 'del' | 'ctx'
  oldNum?: number
  newNum?: number
  content: string
}

export interface DiffPair {
  left: DiffLine | null
  right: DiffLine | null
}

export interface DiffHunk {
  header: string
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  lines: DiffLine[]
  pairs: DiffPair[]
}

export interface FileDiff {
  path: string
  oldPath?: string
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

/** Convert a hunk's lines into side-by-side pairs */
export function pairLines(lines: DiffLine[]): DiffPair[] {
  const pairs: DiffPair[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.type === 'ctx') {
      pairs.push({ left: line, right: line })
      i++
    } else if (line.type === 'del' && i + 1 < lines.length && lines[i + 1].type === 'add') {
      pairs.push({ left: line, right: lines[i + 1] })
      i += 2
    } else if (line.type === 'del') {
      pairs.push({ left: line, right: null })
      i++
    } else if (line.type === 'add') {
      pairs.push({ left: null, right: line })
      i++
    } else {
      i++
    }
  }
  return pairs
}

function parseHunkHeader(header: string): {
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
} | null {
  const m = header.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
  if (!m) return null
  return {
    oldStart: parseInt(m[1], 10),
    oldCount: m[2] !== undefined ? parseInt(m[2], 10) : 1,
    newStart: parseInt(m[3], 10),
    newCount: m[4] !== undefined ? parseInt(m[4], 10) : 1
  }
}

export function parseDiff(raw: string): FileDiff[] {
  if (!raw) return []

  const files: FileDiff[] = []
  const parts = raw.split(/^diff --git /m)

  for (const part of parts) {
    if (!part.trim()) continue
    const chunk = 'diff --git ' + part.trimEnd()

    // Extract file paths from the diff header
    const headerMatch = chunk.match(/^diff --git a\/(.*?) b\/(.*?)$/m)
    if (!headerMatch) continue
    const filePath = headerMatch[2] || headerMatch[1]

    // Skip the diff header lines and find hunks
    const hunkPattern = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/gm
    const hunkMatches = [...chunk.matchAll(hunkPattern)]

    if (hunkMatches.length === 0) {
      // Binary file or no changes — still show the file
      files.push({ path: filePath, additions: 0, deletions: 0, hunks: [] })
      continue
    }

    const hunks: DiffHunk[] = []
    const lines = chunk.split('\n')

    for (const hm of hunkMatches) {
      const hunkHeader = hm[0]
      const info = parseHunkHeader(hunkHeader)
      if (!info) continue

      const hunkLines: DiffLine[] = []
      let oldLine = info.oldStart
      let newLine = info.newStart

      // Find where this hunk starts in the full chunk
      const hunkStartIdx = lines.indexOf(hunkHeader)
      if (hunkStartIdx < 0) continue

      // Scan lines after the hunk header
      for (let i = hunkStartIdx + 1; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('@@')) break // next hunk
        if (line.startsWith('diff --git ')) break // next file

        if (line.startsWith('+')) {
          hunkLines.push({ type: 'add', newNum: newLine, content: line.slice(1) })
          newLine++
        } else if (line.startsWith('-')) {
          hunkLines.push({ type: 'del', oldNum: oldLine, content: line.slice(1) })
          oldLine++
        } else if (line.startsWith(' ')) {
          hunkLines.push({ type: 'ctx', oldNum: oldLine, newNum: newLine, content: line.slice(1) })
          oldLine++
          newLine++
        }
        // skip \ No newline lines and other noise
      }

      hunks.push({ header: hunkHeader, ...info, lines: hunkLines, pairs: pairLines(hunkLines) })
    }

    const additions = hunks.reduce((s, h) => s + h.lines.filter((l) => l.type === 'add').length, 0)
    const deletions = hunks.reduce((s, h) => s + h.lines.filter((l) => l.type === 'del').length, 0)

    files.push({ path: filePath, additions, deletions, hunks })
  }

  return files
}

/** Get file extension for display */
export function getFileLang(file: string): string {
  const ext = file.split('.').pop() || ''
  return ext.toUpperCase()
}

/** Extract the raw diff section for a specific file from a full diff */
export function extractFileDiff(raw: string, filePath: string): string {
  if (!raw) return ''
  const parts = raw.split(/^diff --git /m)
  for (const part of parts) {
    if (!part.trim()) continue
    const chunk = 'diff --git ' + part.trimEnd()
    const headerMatch = chunk.match(/^diff --git a\/(.*?) b\/(.*?)$/m)
    if (!headerMatch) continue
    const matchPath = headerMatch[2] || headerMatch[1]
    if (matchPath === filePath) {
      return chunk
    }
  }
  return ''
}
