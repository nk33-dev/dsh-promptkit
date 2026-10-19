# PromptKit

[中文](README.md) · **English**

A DeepSeek Harness plugin that turns a rough draft in the composer into a prompt that is ready to send. When the requirements are still unclear, it asks a few key questions first. Prompts worth keeping can be saved for next time.

![Composer tools and mode menu](docs/images/composer-menu.png)

## Install

In Harness, open **Plugins → Add plugin** (arrow) → **Install a third-party plugin**, then paste:

```text
github:nk33-dev/dsh-promptkit#path:/packages/promptkit
```

Enable the plugin and restart Harness. Requires Harness `0.2.1-rc.2`. The repository ships the built output, so Node and pnpm are not required.

## Features

- **Enhance prompt**: completes a draft into a full prompt. Decisions that can be made are written out; facts only you know become blanks such as 【list page URL】 to fill in before sending.
- **Clarify needs**: asks about gaps in the draft. Single-choice questions come with a recommendation and rationale; you can also pick several, write your own, decide later or let the AI decide. It generates as soon as the direction is clear.
- **Saved prompts**: live search, tag filters and drag to reorder. Click to append to the composer; hover to replace or edit; deletion can be undone.
- **You confirm every write-back**: edit the result, then append or replace. Replacement can be undone, and nothing is sent automatically.

## Usage

With text in the composer, click ✨. If both modes are enabled, pick one first; with a single mode it starts immediately.

- **Clarify needs**: number keys select choices; `←` / `→` or the numbered dots move between questions, and the recommendation is listed first. Click the icon beside a question to have it rephrased; **Generate now** is always available.
- **Result**: type a change request below and click **Improve** or press Enter. You can also regenerate, copy, save, append or replace. **Change answers** returns to the questionnaire; continuing without changes restores the previous result without another model call.
- **Saved prompts**: click 🔖; **Save current input** stores the draft.

If the composer text changes while the card is open, the workflow locks and offers **Start over with new input** instead of overwriting your edits.

## Settings

Open **Harness Settings → PromptKit**.

| Setting | Description |
| --- | --- |
| Entries | Switch each of the three entries on or off and choose the first menu item |
| Depth | Polish only rewords and keeps the draft's length; Standard fills in goals, core content and key choices; Detailed writes out a concrete plan when useful. Switch temporarily from the entry menu |
| Audience | No technical experience or P4–P10. Changes explanations and depth of decisions, not project scale |
| Model | Use the Harness model, or configure a separate service, model and timeout |
| Rules | Custom enhance and question rules; leave blank for the built-in rules |
| Project context | Off by default; choose project name, instructions, manifests and directory separately |
| Import / export | `{"version":1,"favorites":[...]}`, up to 8 MiB and 5,000 entries |

API keys are stored by the Harness credential service; the settings page only shows whether one is configured.

## Screenshots

Plugin components rendered in a test composer, replaying real model output.

| Clarify needs | Enhance prompt |
|:---:|:---:|
| <img src="docs/images/clarify-dark.png" width="420" alt="Clarify needs"> | <img src="docs/images/rewrite-dark.png" width="420" alt="Enhance prompt"> |

<img src="docs/images/library-dark.png" width="760" alt="Saved prompts">

## Development

```sh
pnpm install
pnpm check
pnpm test
pnpm pack:plugin
```

See [Development](docs/development.md) (Chinese) for the source layout and committed build output, and [Validation](docs/validation.md) (Chinese) for coverage and limitations.

MIT
