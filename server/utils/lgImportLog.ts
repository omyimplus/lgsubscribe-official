import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PREFIX = '[lg-import]'
const LOG_DIR = join(process.cwd(), '.data')
const LOG_FILE = join(LOG_DIR, 'lg-import.log')

let sessionStartMs = Date.now()

/** Reset elapsed-ms clock at the start of each import request. */
export function resetImportLogClock() {
  sessionStartMs = Date.now()
}

function elapsedMs() {
  return Date.now() - sessionStartMs
}

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true })
  }
}

function writeLine(level: 'INFO' | 'WARN' | 'ERROR', scope: string, message: string) {
  const line = `+${elapsedMs()}ms ${PREFIX}[${scope}] ${level}: ${message}`

  if (level === 'WARN') console.warn(line)
  else if (level === 'ERROR') console.error(line)
  else console.log(line)

  // Temporary debug logging — also append to .data/lg-import.log for tail -f
  try {
    ensureLogDir()
    appendFileSync(LOG_FILE, `${line}\n`, 'utf8')
  }
  catch {
    // ignore file write errors
  }
}

export type ImportLogger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  step: (label: string) => void
  done: (label: string, ms?: number) => void
}

export function createImportLogger(scope: string): ImportLogger {
  let stepStartMs: number | null = null

  return {
    info(message) {
      writeLine('INFO', scope, message)
    },
    warn(message) {
      writeLine('WARN', scope, message)
    },
    error(message) {
      writeLine('ERROR', scope, message)
    },
    step(label) {
      stepStartMs = Date.now()
      writeLine('INFO', scope, `→ ${label}`)
    },
    done(label, ms) {
      const elapsed = ms ?? (stepStartMs !== null ? Date.now() - stepStartMs : undefined)
      const suffix = elapsed !== undefined ? ` (${elapsed}ms)` : ''
      writeLine('INFO', scope, `✓ ${label}${suffix}`)
      stepStartMs = null
    },
  }
}
