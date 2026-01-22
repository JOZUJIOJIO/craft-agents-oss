# Craft Agents（中文版）

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Craft Agents 是一款面向 Craft 文档工作流的桌面智能代理工具。它提供更直观的多会话协作方式、对接任意 API / 服务的数据源能力、可共享的会话记录，以及更“以文档为中心”（而不仅仅是代码）的工作体验。

项目基于 Claude Agent SDK（Claude Code 同源能力）构建，并在交互体验、可视化与可定制性上做了大量增强。仓库采用 Apache 2.0 许可证开源，你可以自由二次开发与定制。

<img width="1578" height="894" alt="image" src="https://github.com/user-attachments/assets/3f1f2fe8-7cf6-4487-99ff-76f6c8c0a3fb" />

## 安装

### 一行安装（推荐）

**macOS / Linux：**
```bash
curl -fsSL https://agents.craft.do/install-app.sh | bash
```

**Windows（PowerShell）：**
```powershell
irm https://agents.craft.do/install-app.ps1 | iex
```

### 源码构建

```bash
git clone https://github.com/lukilabs/craft-agents-oss.git
cd craft-agents-oss
bun install
bun run electron:start
```

## 功能亮点

- **多会话收件箱**：桌面端会话管理、状态流转、标记与筛选
- **接近 Claude Code 的体验**：流式输出、工具调用可视化、实时进度与状态提示
- **Craft MCP 深度集成**：内置多种 Craft 文档工具（区块、集合、搜索、任务等）
- **数据源（Sources）**：支持 MCP Server、REST API（Google / Slack / Microsoft 等）与本地文件系统
- **权限模式**：探索 / 询问后编辑 / 自动 三档权限，可配置规则
- **后台任务**：长任务后台运行，进度可追踪
- **动态状态系统**：可自定义会话工作流状态（待办、进行中、已完成等）
- **主题系统**：应用级与工作区级主题联动
- **中英文切换**：Electron + Viewer 均支持中文/英文界面切换
- **多文件 Diff**：一次操作产生的多文件改动可统一查看（类 VS Code）
- **技能（Skills）**：每个工作区可保存专属 Agent 指令/能力配置
- **附件支持**：拖拽图片、PDF、Office 文档并自动转换

## 快速开始

1. 安装后启动应用
2. 选择计费方式：使用 Anthropic API Key 或 Claude 订阅
3. 创建工作区：用于组织会话与数据源
4. （可选）连接数据源：添加 MCP Server、REST API 或本地文件夹
5. 新建会话开始使用

## 桌面端核心能力

### 会话管理

- **收件箱/归档**：按状态组织会话
- **标记**：重要会话快速访问
- **状态流转**：例如 待办 → 进行中 → 需复核 → 已完成
- **会话命名**：支持 AI 自动命名或手动命名
- **会话持久化**：对话历史写入本地磁盘

### 数据源（Sources）

| 类型 | 示例 |
|------|------|
| **MCP Server** | Craft、Linear、GitHub、Notion、任意自定义 Server |
| **REST API** | Google（Gmail/Calendar/Drive）、Slack、Microsoft |
| **本地文件** | 文件系统、Obsidian Vault、Git 仓库等 |

### 权限模式

| 模式 | 显示名 | 行为 |
|------|--------|------|
| `safe` | 探索 | 只读探索，阻止所有写入/修改 |
| `ask` | 询问后编辑 | 修改前弹窗询问（默认） |
| `allow-all` | 自动 | 自动批准命令与修改 |

在聊天界面可使用 **SHIFT+TAB** 循环切换权限模式。

### 快捷键

| 快捷键 | 作用 |
|--------|------|
| `Cmd+N` | 新建对话 |
| `Cmd+1/2/3` | 聚焦侧边栏 / 会话列表 / 输入框 |
| `Cmd+/` | 打开快捷键帮助 |
| `SHIFT+TAB` | 循环切换权限模式 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |

## 项目结构

```
craft-agent/
├── apps/
│   └── electron/              # 桌面端（主要入口）
│       └── src/
│           ├── main/          # Electron 主进程
│           ├── preload/       # Context Bridge
│           └── renderer/      # React UI（Vite + shadcn）
└── packages/
    ├── core/                  # 通用类型
    └── shared/                # 业务逻辑
        └── src/
            ├── agent/         # Agent 与权限
            ├── auth/          # OAuth / Token
            ├── config/        # 配置、偏好、主题
            ├── credentials/   # AES-256-GCM 加密存储
            ├── sessions/      # 会话持久化
            ├── sources/       # MCP / API / 本地数据源
            └── statuses/      # 状态系统
```

## 开发

```bash
# 热更新开发
bun run electron:dev

# 构建并运行
bun run electron:start

# TypeScript 类型检查
bun run typecheck:all

# 单元测试
bun test
```

## 一键同步上游更新（推荐）

如果你已将官方仓库配置为 `upstream`，可用一条命令完成：拉取上游 → 合并/变基 →（可选）按最新 tag 同步版本号 → 安装依赖 → 类型检查 → 测试 →（可选）打包 DMG → 提交 → 推送。

```bash
bun run upstream:update
```

生成 macOS DMG（arm64 + x64）：

```bash
bun run upstream:update:dmg
```

常用参数：

```bash
# 使用 rebase（默认 merge，更安全不改历史）
bun run upstream:update --strategy=rebase

# 禁用自动暂存（默认会自动暂存未提交改动）
bun run upstream:update --no-auto-stash

# 不提交/不推送
bun run upstream:update --no-commit --no-push

# 跳过 install/typecheck/test
bun run upstream:update --no-install --no-typecheck --no-test

# 仅查看解析后的参数（不执行）
bun run upstream:update --dry-run
```

## 环境变量

如需启用 Google / Slack / Microsoft 等 OAuth 集成，请创建 `.env` 文件：

```bash
MICROSOFT_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
SLACK_OAUTH_CLIENT_ID=your-slack-client-id
SLACK_OAUTH_CLIENT_SECRET=your-slack-client-secret
```

可在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 创建 OAuth 凭据。

## 配置目录

默认配置存储在 `~/.craft-agent/`：

```
~/.craft-agent/
├── config.json              # 主配置（工作区、认证类型等）
├── credentials.enc          # 加密凭据（AES-256-GCM）
├── preferences.json         # 用户偏好
├── theme.json               # 应用级主题
└── workspaces/
    └── {id}/
        ├── config.json      # 工作区设置
        ├── theme.json       # 工作区主题覆盖
        ├── sessions/        # 会话数据（JSONL）
        ├── sources/         # 数据源配置
        ├── skills/          # 技能配置
        └── statuses/        # 状态配置
```

### 语言 / i18n

- **Electron（桌面端）**：在 **设置 → 偏好设置 → 语言** 中选择 `English` 或 `中文`，会写入 `~/.craft-agent/preferences.json` 并即时生效
- **Viewer（Web）**：右上角切换语言，保存在 `localStorage` 的 `craft-language` 键

## 高级能力

### 大响应处理

当工具响应超过一定大小（例如 ~60KB）时，系统会自动进行摘要处理以保证对话体验；同时会向 MCP 工具 schema 注入 `_intent` 字段以提升摘要的针对性。

### 深度链接（Deep Linking）

支持使用 `craftagents://` URL 进行外部跳转：

```
craftagents://allChats
craftagents://allChats/chat/session123
craftagents://settings
craftagents://sources/source/github
craftagents://action/new-chat
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh/) |
| AI | [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) |
| Desktop | [Electron](https://www.electronjs.org/) + React |
| UI | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS v4 |
| Build | esbuild (main) + Vite (renderer) |
| Credentials | AES-256-GCM encrypted file storage |

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project uses the [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), which is subject to [Anthropic's Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms).

### Trademark

"Craft" and "Craft Agents" are trademarks of Craft Docs Ltd. See [TRADEMARK.md](TRADEMARK.md) for usage guidelines.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

### Local MCP Server Isolation

When spawning local MCP servers (stdio transport), sensitive environment variables are filtered out to prevent credential leakage to subprocesses. Blocked variables include:

- `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` (app auth)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`
- `GITHUB_TOKEN`, `GH_TOKEN`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `STRIPE_SECRET_KEY`, `NPM_TOKEN`

To explicitly pass an env var to a specific MCP server, use the `env` field in the source config.

To report security vulnerabilities, please see [SECURITY.md](SECURITY.md).
