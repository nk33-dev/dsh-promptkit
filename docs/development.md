# 开发说明

TypeScript、React 18、Cordis；pnpm、tsdown、Vitest。Host 使用宿主存储域、凭据服务、模型目录与调用服务；Client 注册输入框和设置槽位，沿用 Harness 主题变量。

0.1.6 使用 Harness `0.2.2-rc.1` SDK、Cordis `4.1.0` 和 Node.js `24.9+`。
项目目录从 `sessionController.projections({ sessionId }, signal)` 的
`values.workingDirectory` 读取，只接受 `sequenced` 结果；缺失或需迁移的会话返回空项目。
宿主模型请求携带 `sessionId` 和 `purpose: "promptkit"`，供提供商的会话路由与动态请求头使用。

## 结构

- `App.tsx`：入口、模式菜单、浮层与状态恢复。
- `Enhance.tsx`：生成、累计问卷、补问和结果操作；`questionnaire.ts` 处理推荐排序、多选和历史合并。
- `Library.tsx`：常用提示词的搜索、筛选、排序、编辑和导入导出。
- `Management.tsx` / `Settings.tsx`：Harness 设置页。
- `Popover.tsx`：native popover 定位；鼠标打开聚焦容器，键盘打开聚焦首个控件。
- `workflow.ts`：按插件实例、会话和模式缓存整理过程，不写磁盘或宿主聊天。
- `draft.ts` / `useDraft.ts`：原生写回、草稿和项目检查。

## 构建产物

`packages/promptkit/lib/` 已提交，Git 安装可直接加载，不需要在用户机器上构建。修改源码后必须执行 `pnpm build` 并一起提交 `lib/`，否则从 GitHub 安装的版本仍是旧代码。

`pnpm pack:plugin` 会重新构建、生成 `dist/dsh-promptkit-<版本>.tgz`，并从归档中取出客户端再次验证入口注册和宿主模块白名单。

```sh
pnpm install
pnpm check
pnpm test
pnpm build
pnpm pack:plugin
```

`lib/` 中的 `*.tsbuildinfo` 不提交。CI 在 Linux 上构建并检查 `lib/` 是否有未提交差异。

## 数据与协议

一次生成请求带五个字段：`sessionId`、`purpose`、`history`、`forceFinal`、`messages/currentText`。响应三种：`questions`（追加问卷）、`summary`（旧协议兼容）、`final`（直接进可编辑结果）。历史上限 120000 字节，累计问卷 128 题，每次只发当前答案快照。

模型响应按字节流读，声明长度和实际数据都限 2 MiB，超限取消 reader；分块 UTF-8 流式解码，断流、非法编码、取消分开处理。错误不带响应正文或密钥。

上限和默认值集中在 `shared/preferences.json`：

| 深度 | 题数上限 | 输出预算 |
| --- | --- | --- |
| 微调 | 5 | 8192 |
| 标准 | 10 | 12288 |
| 详细 | 15 | 16384 |

默认标准 + P4。题数是上限不是目标，实际题数看输入缺口。画像按阿里 P4–P10 参照，只改讲解方式和决策深度，不改基础质量与范围。

写回用点击那一刻的草稿快照，读取期间的手工修改和迟到的项目检查都覆盖不了用户输入。收藏筛选期间保留已显示数据和滚动位置，用 `aria-busy` 表达后台读取；关闭或切会话会取消未完成的请求。

`parseResult` 逐题规整模型输出：选项去重超过 6 个截掉，推荐越界当无推荐，超题数上限的题截掉，重复 id 加后缀，缺选项或题干的题丢弃，JSON 前后夹带文字时取出其中对象。

项目上下文预算 14000 字符，文件和目录各有独立上限。收藏导入先预览新增与重复数量，校验失败时原库不动。

## 原生验收

`scripts/native-quick.mjs`、`native-lifecycle.mjs` 是旧界面的原生验收脚本，当前版本不能直接用，需要按现界面调整。日常验证走组件测试加真实浏览器手动检查。

浏览器客户端通过 Harness 模块表加载，读不到插件的 node_modules；`tsdown.client.config.ts` 只内联 Lucide，其余外部模块由宿主提供。

## 规则与宿主接入

内置规则在 `rules/rewrite.md`（增强）和 `rules/grill.md`（需求对齐），追问输出格式在 `src/shared/defaults.ts` 的 `GRILL_FORMAT`。改完重新构建 `lib/`，再用评估集对比真实输出。

Client 用官方的输入框槽位、InputActions、消息工厂和 BlockAssembler。Host 侧独立服务支持三种协议：Responses 用 `reasoning.effort`，Chat Completions 用 `reasoning_effort`，第三种走自动回退。修改按 user/assistant 消息发送，`currentText` 存用户当前编辑稿。

规则写法参考 OpenAI 提示词工程和 Anthropic 上下文工程：以明确目标和实际输出评估，保留充分信息，减少重复限制和固定流程。不把全部画像、长示例和固定步骤塞进每次请求。用户自定义规则原样保留，清空后回落到内置版本。

回归用例在 `docs/prompt-evaluation-cases.json`，不随请求发送。
