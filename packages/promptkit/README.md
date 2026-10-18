# PromptKit

Turn rough drafts into actionable prompts in DeepSeek Harness: enhance a prompt, clarify requirements with guided questions, and keep reusable prompts beside the composer.

先写个大概，边问边把需求补齐，好用的提示词留着下次接着用。

Supports DeepSeek Harness **0.2.1-rc.2**.

Install from **Plugins → Add plugin → Install a third-party plugin**:

```text
github:nk33-dev/dsh-promptkit#path:/packages/promptkit
```

Then enable the plugin and restart Harness. Configure models, rules, project context and import/export under **Harness Settings → PromptKit**.

Choose **Concise / Standard / Detailed** and an audience profile from **No technical experience** through **P4–P10**. Clarification asks about actual gaps, supports multiple choices and custom answers, and generates once the direction is clear. “Decide later” and “You decide” keep separate meanings. Saved prompts are shared across sessions; General means untagged.

MIT. Source: https://github.com/nk33-dev/dsh-promptkit
