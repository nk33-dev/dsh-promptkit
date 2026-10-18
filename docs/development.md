# 开发说明

TypeScript、React 18、Cordis；pnpm、tsdown、Vitest。Host 使用宿主存储域、凭据服务、模型目录与调用服务。Client 注册公开的输入框和设置槽位，沿用 Harness 主题变量。

`App.tsx` 管入口和右侧面板。`Enhance.tsx` 管生成和问答，`Library.tsx` 管收藏，`Management.tsx` 管设置。`workflow.ts` 按插件实例、会话和模式缓存整理过程，不写磁盘或宿主聊天。`draft.ts` 和 `useDraft.ts` 共用原生写回、草稿与项目检查，恢复时沿用原快照。

弹出层复用 Chromium 原生 Popover，Escape 和点击外部由浏览器处理。插件仅计算入口附近的位置并恢复焦点；没有新增弹层依赖。键盘支持方向键、Home、End，中文输入法组合事件不触发菜单导航。

数据按需读取：配置、模型、项目、收藏摘要和正文分别请求。生成协议保留 `history/forceFinal`，支持 `messages/currentText`；响应为 questions、summary 或 final。未确认的 final 按 summary 处理，结构错误提示重试；历史与补充消息合计最多 120000 字节，不限制轮数。反馈新增接口停用，旧数据结构保持兼容。收藏仍使用版本检查和串行提交。

运行 `pnpm check`、`pnpm test`、`pnpm pack:plugin`、`node scripts/verify-pack.mjs`。`scripts/native-quick.mjs` 使用真实 Windows Harness 和本地确定性模型服务，需先以 `scripts/restart-harness.ps1` 启动调试端口。脚本会暂时切换模型配置并清理测试凭据，验收前应保存个人草稿。

浏览器客户端通过 Harness 模块表加载，不能直接读取插件的 node_modules。
`tsdown.client.config.ts` 将 Lucide 内联，其他外部模块须由宿主提供。
构建后自动运行 `scripts/verify-client.mjs`，按宿主模块白名单执行真实产物并注册界面入口。
打包检查从 tgz 中取出客户端再次验证，不以源码测试代替安装包加载检查。

规则与追问流程移植自同一作者的 Codex3N，参考源码提交 `dd48ebfbab12aeaea7350e6f925aba74dbe6e208`。宿主 SDK 与第三方运行依赖保留各自许可，插件代码采用 MIT。
