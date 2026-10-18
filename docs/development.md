# 开发说明

TypeScript、React 18、Cordis；pnpm、tsdown、Vitest。Host 使用宿主存储域、凭据服务、模型目录与调用服务；Client 注册输入框和设置槽位，沿用 Harness 主题变量。

## 结构

- `App.tsx`：入口、模式菜单、浮层与状态恢复。
- `Enhance.tsx`：生成、追问、需求小结和结果操作。
- `Library.tsx`：常用提示词的搜索、筛选、排序、编辑和导入导出。
- `Management.tsx` / `Settings.tsx`：Harness 设置页。
- `Popover.tsx`：native popover 卡片定位；菜单不抢焦点。
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

配置、模型、项目、收藏摘要和正文分别按需读取。生成请求保留 `history/forceFinal`，支持 `messages/currentText`；响应为 questions、summary 或 final。未确认的 final 按 summary 处理，结构错误提示重试。历史与补充消息合计最多 120000 字节，不限制轮数。

项目上下文预算 14000 字符，文件与目录有独立上限。收藏导入先预览新增与重复数量，整次校验失败时不修改原库。

## 原生验收

`scripts/native-quick.mjs` 使用真实 Windows Harness 和本地确定性模型服务，需先以 `scripts/restart-harness.ps1` 启动调试端口。脚本会暂时切换模型配置并清理测试凭据，运行前应保存个人草稿。`scripts/native-lifecycle.mjs` 覆盖安装、升级、停用与恢复。

浏览器客户端通过 Harness 模块表加载，不能直接读取插件的 node_modules；`tsdown.client.config.ts` 只把 Lucide 内联，其他外部模块由宿主提供。

规则与追问流程移植自同一作者的 Codex3N，参考提交 `3d7e6c0dac947d6fb33aca1b84a614a2624dad68`。宿主 SDK 与第三方运行依赖保留各自许可，插件代码采用 MIT。
