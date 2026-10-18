# 来源与第三方许可

PromptKit 原创代码按 MIT 发布，Copyright (c) 2026 nk33-dev。

内置 `rewrite.md` 与 `grill.md` 来自 nk33-dev 在 Codex3N 中原创的提示词增强规则。本插件由同一作者采用 MIT 授权。参考提交：`dd48ebfbab12aeaea7350e6f925aba74dbe6e208`，功能提交 `cd15a37c`、规则提交 `bd444e63` 等。

本插件调用下列现成能力，第三方组件保留各自许可：

| 组件 | 用途 | 许可证 |
| --- | --- | --- |
| DeepSeek Harness / Cordis | 插件、模型、凭据、存储、Gateway、Slots | MIT |
| React / React JSX Runtime | 宿主提供的界面运行时 | MIT |
| Zod | 持久化与 RPC 边界校验 | MIT |
| Lucide React | 工具图标 | ISC |
| TypeScript / tsdown / Vitest | 开发与验证 | Apache-2.0 / MIT / MIT |

Lucide 图标内联至客户端产物，许可随包内 `THIRD_PARTY_NOTICES.md` 提供。React、Zod 和宿主运行库沿用宿主模块，不内嵌副本。
