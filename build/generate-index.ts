/**
 * Build script to generate scripts-index.json
 * Parses userscript metadata from .user.js files and bookmarks from BOOKMARKS.md
 */
import { glob } from 'glob'
import { readFileSync, writeFileSync, mkdirSync, realpathSync, existsSync } from 'fs'
import { basename, dirname, resolve } from 'path'

// Configuration
const MAX_METADATA_SIZE = 10 * 1024 // 10KB limit for metadata block
const MAX_OUTPUT_SIZE = 1024 * 1024 // 1MB limit for output JSON
const SCRIPTS_DIR = resolve('scripts')

interface ScriptMeta {
  name: string
  version: string
  description: string // Optional - may be empty
  author: string // Optional - may be empty
  category: string
  filename: string
  matches: string[]
  installUrl: string
  sourceUrl: string
  readmeUrl?: string // Optional markdown readme URL
}

interface Bookmark {
  name: string
  url: string
  description: string // Optional - may be empty
  category: string
  tags?: string[]
  source: 'greasyfork' | 'openuserjs' | 'github' | 'other'
}

const REPO_URL = 'https://github.com/lamngockhuong/userjs'
const RAW_URL = 'https://raw.githubusercontent.com/lamngockhuong/userjs/main'

/**
 * Validates that a file path is within the allowed scripts directory
 * Prevents path traversal attacks via symlinks
 */
function isPathSafe(filepath: string): boolean {
  try {
    const realPath = realpathSync(filepath)
    return realPath.startsWith(SCRIPTS_DIR)
  } catch {
    return false
  }
}

/**
 * Encodes path segments for use in URLs
 */
function encodeFilePath(filepath: string): string {
  return filepath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

/**
 * Validates URL format (basic check)
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Detects the source platform from URL
 */
function detectSource(url: string): Bookmark['source'] {
  try {
    const hostname = new URL(url).hostname
    if (hostname.includes('greasyfork.org')) return 'greasyfork'
    if (hostname.includes('openuserjs.org')) return 'openuserjs'
    if (hostname.includes('github.com')) return 'github'
    return 'other'
  } catch {
    return 'other'
  }
}

function parseUserscriptMeta(content: string, filepath: string): ScriptMeta | null {
  const metaMatch = content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/)
  if (!metaMatch) {
    console.warn(`⚠️ Skipping ${filepath}: No metadata block found`)
    return null
  }

  const meta = metaMatch[1]
  if (!meta) {
    console.warn(`⚠️ Skipping ${filepath}: Empty metadata block`)
    return null
  }

  // Check metadata size limit
  if (meta.length > MAX_METADATA_SIZE) {
    console.warn(`⚠️ Skipping ${filepath}: Metadata block exceeds ${MAX_METADATA_SIZE / 1024}KB limit`)
    return null
  }

  const get = (key: string): string => {
    const match = meta.match(new RegExp(`// @${key}\\s+(.+)`))
    return match?.[1]?.trim() ?? ''
  }

  const getAll = (key: string): string[] => {
    const matches = [...meta.matchAll(new RegExp(`// @${key}\\s+(.+)`, 'g'))]
    return matches.map(m => m[1]?.trim() ?? '').filter(Boolean)
  }

  const name = get('name')
  if (!name) {
    console.warn(`⚠️ Skipping ${filepath}: Missing @name`)
    return null
  }

  const category = dirname(filepath).split('/').pop() ?? 'general'
  const filename = basename(filepath)
  const encodedPath = encodeFilePath(filepath)

  // Check for optional readme markdown file (same name, .md extension)
  const readmePath = filepath.replace(/\.user\.js$/, '.md')
  const hasReadme = existsSync(readmePath) && isPathSafe(readmePath)

  const result: ScriptMeta = {
    name,
    version: get('version') || '1.0.0',
    description: get('description'),
    author: get('author'),
    category,
    filename,
    matches: getAll('match'),
    installUrl: `${RAW_URL}/${encodedPath}`,
    sourceUrl: `${REPO_URL}/blob/main/${encodedPath}`,
  }

  if (hasReadme) {
    result.readmeUrl = `${RAW_URL}/${encodeFilePath(readmePath)}`
  }

  return result
}

function parseBookmarks(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = []
  let currentCategory = 'general'

  for (const line of content.split('\n')) {
    const categoryMatch = line.match(/^## (.+)/)
    if (categoryMatch?.[1]) {
      currentCategory = categoryMatch[1].toLowerCase()
      continue
    }

    const linkMatch = line.match(/^- \[(.+?)\]\((.+?)\)(?: - (.+))?/)
    if (linkMatch) {
      const url = linkMatch[2] ?? ''

      // Validate URL format
      if (!isValidUrl(url)) {
        console.warn(`⚠️ Skipping bookmark "${linkMatch[1]}": Invalid URL format`)
        continue
      }

      // Parse description and extract tags (format: description #tag1 #tag2)
      const rawDescription = linkMatch[3] ?? ''
      const tagMatches = rawDescription.match(/#[\w-]+/g)
      const tags = tagMatches?.map(t => t.slice(1)) // Remove # prefix
      const description = rawDescription.replace(/#[\w-]+/g, '').trim()

      const bookmark: Bookmark = {
        name: linkMatch[1] ?? '',
        url,
        description,
        category: currentCategory,
        source: detectSource(url),
      }

      if (tags?.length) {
        bookmark.tags = tags
      }

      bookmarks.push(bookmark)
    }
  }

  return bookmarks
}

async function main() {
  console.log('🔨 Generating scripts-index.json...')

  // Parse userscripts (skip invalid with warning)
  const files = await glob('scripts/**/*.user.js')
  const scripts = files
    .filter(f => {
      // Path traversal protection
      if (!isPathSafe(f)) {
        console.warn(`⚠️ Skipping ${f}: Path outside scripts directory`)
        return false
      }
      return true
    })
    .map(f => {
      const content = readFileSync(f, 'utf-8')
      return parseUserscriptMeta(content, f)
    })
    .filter((s): s is ScriptMeta => s !== null)

  // Parse bookmarks
  let bookmarks: Bookmark[] = []
  try {
    const bookmarkContent = readFileSync('BOOKMARKS.md', 'utf-8')
    bookmarks = parseBookmarks(bookmarkContent)
  } catch {
    console.log('ℹ️ No BOOKMARKS.md file found, skipping bookmarks')
  }

  // Generate output
  const output = JSON.stringify({ scripts, bookmarks }, null, 2)

  // Check output size
  const outputSize = Buffer.byteLength(output, 'utf-8')
  if (outputSize > MAX_OUTPUT_SIZE) {
    console.error(`❌ Output size (${(outputSize / 1024).toFixed(1)}KB) exceeds ${MAX_OUTPUT_SIZE / 1024}KB limit`)
    process.exit(1)
  }

  // Write index
  mkdirSync('public', { recursive: true })
  writeFileSync('public/scripts-index.json', output)

  console.log(`✅ Generated index: ${scripts.length} scripts, ${bookmarks.length} bookmarks (${(outputSize / 1024).toFixed(1)}KB)`)
}

main().catch(console.error)
