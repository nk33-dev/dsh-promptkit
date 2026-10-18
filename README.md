# PromptKit

先写个大概，边问边把需求补齐。好用的提示词，留着下次用。

Rewrite rough drafts, ask the missing questions, and keep prompts worth reusing in DeepSeek Harness.

- 输入框旁提供提示词优化和需求梳理，右侧面板完成操作。问答每组最多三题，轮数不限，确认后生成。
- 结果先预览，可编辑、替换、追加、复制；保留宿主草稿检查、引用和撤销能力。
- 独立收藏面板：搜索、标签、置顶、项目分类、最近使用。
- 模型、规则、场景和收藏导入导出位于 Harness 设置。
- 支持宿主模型及独立服务；项目上下文默认关闭。中英文、亮暗主题。

Supports **Harness 0.2.1-rc.2**, Windows validation. MIT.

```sh
pnpm install
pnpm check
pnpm test
pnpm pack:plugin
node scripts/verify-pack.mjs
```

在 Harness 插件管理器安装 `dist/dsh-promptkit-0.1.2.tgz`，启用后重启。

Install the archive in Harness's plugin manager, enable it, then restart. Choose **Enhance → Rewrite / Clarify** beside the composer, or open **Library**. Configuration and maintenance live in **Settings → PromptKit**.

[使用说明](docs/usage.zh.md) · [English guide](docs/README.en.md) · [开发说明](docs/development.md) · [验证记录](docs/validation.md)
