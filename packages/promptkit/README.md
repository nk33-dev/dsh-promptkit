# PromptKit

A DeepSeek Harness plugin that turns a rough draft in the composer into a prompt that is ready to send, asks a few key questions first when requirements are unclear, and keeps reusable prompts at hand.

在输入框旁把草稿整理成可直接发送的提示词；需求不清楚时先问几个关键问题；好用的提示词收藏起来下次用。

Requires DeepSeek Harness **0.2.1-rc.2**. Install from **Plugins → Add plugin → Install a third-party plugin**:

```text
github:nk33-dev/dsh-promptkit#path:/packages/promptkit
```

Enable the plugin and restart Harness. Depth (Polish / Standard / Detailed), audience profile, model, rules, project context and import/export are under **Harness Settings → PromptKit**.

MIT. Source and documentation: https://github.com/nk33-dev/dsh-promptkit
