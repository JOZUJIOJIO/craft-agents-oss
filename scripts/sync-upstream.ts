import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Strategy = 'merge' | 'rebase'

type Options = {
  remote: string
  branch: string
  strategy: Strategy
  install: boolean
  typecheck: boolean
  test: boolean
  dmgMac: boolean
  commit: boolean
  push: boolean
  pushRemote: string
  autoStash: boolean
  dryRun: boolean
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    remote: 'upstream',
    branch: 'main',
    strategy: 'merge',
    install: true,
    typecheck: true,
    test: true,
    dmgMac: false,
    commit: true,
    push: true,
    pushRemote: 'origin',
    autoStash: true,
    dryRun: false,
  }

  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const [rawKey, rawValue] = arg.slice(2).split('=', 2)
    const key = rawKey.trim()
    const value = (rawValue ?? '').trim()

    if (key === 'remote' && value) opts.remote = value
    else if (key === 'branch' && value) opts.branch = value
    else if (key === 'push-remote' && value) opts.pushRemote = value
    else if (key === 'strategy' && (value === 'merge' || value === 'rebase')) opts.strategy = value
    else if (key === 'no-install') opts.install = false
    else if (key === 'no-typecheck') opts.typecheck = false
    else if (key === 'no-test') opts.test = false
    else if (key === 'dmg-mac') opts.dmgMac = true
    else if (key === 'no-commit') opts.commit = false
    else if (key === 'no-push') opts.push = false
    else if (key === 'no-auto-stash') opts.autoStash = false
    else if (key === 'dry-run') opts.dryRun = true
  }

  return opts
}

function sh(cmd: string, args: string[] = [], options?: { quiet?: boolean }): string {
  const quiet = options?.quiet ?? false
  const result = execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
  })
  return result.trim()
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

function isDirtyWorkingTree(): boolean {
  const status = sh('git', ['status', '--porcelain=v1'], { quiet: true })
  return status.length > 0
}

function stashIfNeeded(autoStash: boolean): boolean {
  const dirty = isDirtyWorkingTree()
  if (!dirty) return false
  if (!autoStash) fail('工作区有未提交改动，请先提交或清理后再执行，或使用默认自动暂存。')
  sh('git', ['stash', 'push', '-u', '-m', 'sync-upstream auto stash'])
  return true
}

function popStashIfNeeded(didStash: boolean) {
  if (!didStash) return
  sh('git', ['stash', 'pop'])
}

function ensureRemoteExists(name: string) {
  const remotes = sh('git', ['remote'], { quiet: true }).split('\n').filter(Boolean)
  if (!remotes.includes(name)) fail(`未找到 git remote: ${name}`)
}

function checkoutBranch(branch: string) {
  sh('git', ['checkout', branch])
}

function fetchUpstream(remote: string) {
  sh('git', ['fetch', remote, '--tags'])
}

function integrate(remote: string, branch: string, strategy: Strategy) {
  const upstreamRef = `${remote}/${branch}`
  if (strategy === 'rebase') {
    sh('git', ['rebase', upstreamRef])
    return
  }
  sh('git', ['merge', '--no-edit', upstreamRef])
}

function getLatestVersionTag(): string | null {
  const tags = sh('git', ['tag', '--list', 'v*', '--sort=-v:refname'], { quiet: true })
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
  const first = tags[0]
  if (!first) return null
  return first
}

function normalizeVersion(tag: string): string | null {
  const v = tag.startsWith('v') ? tag.slice(1) : tag
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(v)) return null
  return v
}

function readAppVersion(appVersionFile: string): string {
  const content = readFileSync(appVersionFile, 'utf8')
  const match = content.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
  if (!match) fail('无法从 app-version.ts 读取 APP_VERSION')
  return match[1]
}

function writeAppVersion(appVersionFile: string, version: string) {
  const content = readFileSync(appVersionFile, 'utf8')
  const next = content.replace(
    /export\s+const\s+APP_VERSION\s*=\s*['"][^'"]+['"]\s*;/,
    `export const APP_VERSION = '${version}';`
  )
  if (next === content) fail('更新 APP_VERSION 失败：未匹配到版本常量行')
  writeFileSync(appVersionFile, next, 'utf8')
}

function runBun(args: string[]) {
  sh('bun', args)
}

function maybeCommit(message: string) {
  const status = sh('git', ['status', '--porcelain=v1'], { quiet: true })
  if (!status) return false
  sh('git', ['add', '-A'])
  sh('git', ['commit', '-m', message])
  return true
}

function push(remote: string, branch: string) {
  sh('git', ['push', remote, branch])
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const repoRoot = process.cwd()
  const appVersionFile = resolve(repoRoot, 'packages/shared/src/version/app-version.ts')

  ensureRemoteExists(opts.remote)
  ensureRemoteExists(opts.pushRemote)
  if (opts.dryRun) {
    process.stdout.write(JSON.stringify(opts, null, 2) + '\n')
    return
  }
  const didStash = stashIfNeeded(opts.autoStash)

  checkoutBranch(opts.branch)
  fetchUpstream(opts.remote)
  integrate(opts.remote, opts.branch, opts.strategy)

  const latestTag = getLatestVersionTag()
  if (latestTag) {
    const latestVersion = normalizeVersion(latestTag)
    if (latestVersion) {
      const current = readAppVersion(appVersionFile)
      if (current !== latestVersion) {
        writeAppVersion(appVersionFile, latestVersion)
        runBun(['run', 'scripts/sync-version.ts'])
      }
    }
  }

  if (opts.install) runBun(['install'])
  if (opts.typecheck) runBun(['run', 'typecheck:all'])
  if (opts.test) runBun(['test'])
  if (opts.dmgMac) runBun(['run', 'electron:dist:mac'])

  if (opts.commit) {
    const msg = latestTag ? `chore: sync ${opts.remote} (${latestTag})` : `chore: sync ${opts.remote}`
    maybeCommit(msg)
  }

  if (opts.push) push(opts.pushRemote, opts.branch)
  popStashIfNeeded(didStash)
}

main()
