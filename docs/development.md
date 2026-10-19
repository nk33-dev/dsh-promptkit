# 开发说明

TypeScript、React 18、Cordis；pnpm、tsdown、Vitest。Host 使用宿主存储域、凭据服务、模型目录与调用服务；Client 注册输入框和设置槽位，沿用 Harness 主题变量。

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

配置、模型、项目、收藏摘要和正文分别按需读取。生成请求保留 `history/forceFinal` 和 `messages/currentText`；响应为 questions、summary 或 final，final 直接进入可编辑结果，summary 保留旧协议兼容。历史与补充消息合计最多 120000 字节，累计问卷最多 128 题；每次只发送当前答案快照。结构错误保留状态并提示重试。

`shared/preferences.json` 集中深度、画像、问题上限及输出预算，与 Codex3N 对应资产一致。默认标准 + P4，旧设置缺字段时补齐。微调/标准/详细每次上限为 5/10/15，输出预算为 2048/4096/8192 tokens；实际题数通常更少。入口菜单的深度以请求 `detail` 覆盖当前流程，设置页保存默认值与画像。每次只发送选中规则，微调以原意等价的专业化表达为边界。

两种模式先理解实际任务、对象和阶段，再组织内容；简单请求可用短段，复杂请求按内容分段。
深度控制相关内容的展开程度，画像只调整用词与必要解释，用户指定的读者、格式、篇幅和动作优先。
新建方案按需提出具体选择，已有项目审查以代码事实和证据为起点；追问只确认影响结果的选择，
可调查事实交给执行者核实。任务类别开放，不通过关键词分类器或固定章节拼装。
P4＋详细原型仅展示一个任务的输出。回归覆盖审查、修复、写作、翻译、解释与组合动作，
确定性测试只验证规则传递与结果保留，真实模型输出另行评估。

多选即时记录，分页箭头继续；完整问卷在末题通过右箭头提交检查，直接生成始终可用。重新设计的题目清空旧选择，其他已答信息保留。Api 缓存最近成功配置，输入框重挂载时可立即显示入口；菜单和弹窗只在键盘操作时突出焦点，菜单按可用空间定位。收藏空状态通过「全部」或搜索框恢复，`untagged` 表示无标签，项目字段保留旧数据兼容。

项目上下文预算 14000 字符，文件与目录有独立上限。收藏导入先预览新增与重复数量，整次校验失败时不修改原库。

## 原生验收

`scripts/native-quick.mjs`、`native-lifecycle.mjs` 保留历史原生验收记录，包含旧界面定位，当前版本不作为验收入口。当前交互以组件测试和真实浏览器手动检查验证；完整 Harness 安装、升级、停用与恢复需另行执行原生回归。历史启动脚本会切换调试端口，不在日常运行中自动执行。

浏览器客户端通过 Harness 模块表加载，不能直接读取插件的 node_modules；`tsdown.client.config.ts` 只把 Lucide 内联，其他外部模块由宿主提供。

规则与追问流程移植自同一作者的 Codex3N，参考提交 `f9ac5a3711022a057d42a03b7afe3d3176379d89`。宿主 SDK 与第三方运行依赖保留各自许可，插件代码采用 MIT。

## 提示词模块同步

与 Codex3N 的 `docs/prompt-enhance.md` 保持行为契约一致。`rules/rewrite.md`、`rules/grill.md` 分别对应其 `assets/prompt-enhance/system-prompt.md`、`grill-system-prompt.md`，内容相同。改规则时两边一起更新，不在运行时依赖另一个仓库。

Harness 继续使用官方输入框槽位、InputActions、消息工厂和 BlockAssembler；独立服务保留三种协议适配。后续修改按 user/assistant 消息发送，currentText 保存用户当前编辑稿。Responses 用 `reasoning.effort`，Chat Completions 用 `reasoning_effort`。空草稿禁用入口，问卷未完整时末题禁用下一题，跳过独立；改进支持按钮和回车、输入法保护、错误重试和无变化提示，重新生成保留补充要求。原生 popover 随窗口尺寸与滚动定位。

规则参考 OpenAI 提示词工程与 Anthropic 上下文工程：以明确目标和实际输出评估，保留充分信息，减少重复限制和固定流程。来源和语义回归用例见 Codex3N 文档；不把全部画像、长示例和固定执行步骤塞进每次请求。用户自定义规则保持不变，清空规则字段后使用内置版本。
