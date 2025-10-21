import { createHash } from 'node:crypto'

export function hashContent(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex')
}

export function generateRevision(content: string): string {
  return hashContent(content + Date.now().toString()).substring(0, 16)
}
