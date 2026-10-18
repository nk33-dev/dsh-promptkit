# 验证记录

2026-10-18，Windows 11 x64，Harness `0.2.1-rc.2`，插件 `0.1.2`，Node.js 24，pnpm 11.3.0。

## 自动检查

- `pnpm check`：Host 与 Client 的 TypeScript 检查通过。
- `pnpm test`：10 个测试文件、89 项通过。覆盖生成与追问流程、结果写回、草稿与项目变化、收藏排序与撤销、导入校验、三种协议与自动回退、凭据和敏感内容过滤。
- `pnpm pack:plugin`：重新构建、打包，并从 tgz 中取出客户端验证模块工厂、入口注册和宿主模块白名单。
- Codex3N 的 Chromium 夹具同时渲染当前 PromptKit 组件，覆盖模式菜单、四轮自动问答、需求小结、替换撤销、收藏搜索/编辑/删除撤销和 400px 布局。

## 安装

`pnpm` 从 `github:nk33-dev/dsh-promptkit#path:/packages/promptkit` 安装成功，产物包含 `lib/client.js`、`lib/index.js`、`lib/remote.js` 和类型声明。仓库已提交构建产物，安装时不需要执行构建脚本。

尚未通过 Harness 插件管理器重新安装并走完整个安装对话框；上面的结果是 pnpm 层验证。

## 真实 Harness

当前浮动卡片、模式菜单和输入框旁的两个入口已在真实 Harness 中加载，页面无错误提示。改版后的完整问答、需求小结写回和收藏操作主要仍由 Chromium 夹具覆盖，尚未在真实 Harness 中逐项重跑。

此前的侧面板基线（三轮问答、原生替换撤销、文件引用写回、重启与停用恢复等）不代表当前界面；需要时用 `scripts/native-quick.mjs` 和 `scripts/native-lifecycle.mjs` 重新验收。

## 限制

- 未实测 macOS、Linux。
- 模型质量与外部服务的稳定性不在自动检查范围内；夹具使用确定性响应。
- 取消、切会话、改稿和多个附件组合未穷举；中文输入法候选窗未穷举。
- 宿主安装器对同版本归档重装可能报依赖变更错误，升级时使用新的补丁版本。
