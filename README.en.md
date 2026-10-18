# PromptKit

Rough draft in, useful prompt out. Ask the missing questions, then keep prompts worth reusing.

A DeepSeek Harness plugin that completes a draft into an actionable prompt, or clarifies the requirements first.

[中文](README.md)

![Composer tools and mode menu](docs/images/composer-menu.png)

## Install

In Harness, open **Plugins → Add plugin** (arrow) → **Install a third-party plugin**, then paste:

```text
github:nk33-dev/dsh-promptkit#path:/packages/promptkit
```

Enable the plugin and restart Harness. Requires Harness `0.2.1-rc.2`. The repository ships the built output, so Node and pnpm are not required.

For source installs and development, see [Development](docs/development.md).

## Features

- **Enhance prompt**: adds scope, implementation steps and acceptance checks. New decisions are labelled as suggestions or assumptions.
- **Clarify needs**: one question at a time; picking an option advances automatically and the round submits itself. A concise summary waits for confirmation before the final prompt.
- **Saved prompts**: live search, project and tag filters, drag to reorder. Click a row to append; hover to replace or edit; deletion can be undone.
- **Safe write-back**: edit the result, then append or replace. Replacement can be undone; nothing is sent automatically.
- Optional project context, host or independent model connection, Chinese/English and light/dark themes.

## Usage

Click ✨ beside the composer. With both modes enabled, choose one first; with a single mode it starts immediately.

- In Clarify needs, number keys `1`–`9` select options and `←`/`→` switch questions. **Stop asking and write** is always available.
- Use the follow-up field to refine the result. The action bar offers regenerate, copy, save, append and replace.
- Click 🔖 for saved prompts. **Save current input** stores the current draft.

If the draft changes while the card is open, the workflow locks and offers to restart with the new text instead of overwriting it.

## Settings

Open **Harness Settings → PromptKit**.

- Entry switches, default mode, model connection and timeout.
- Rewrite and question rules; leave blank to use the built-in rules.
- Project context is off by default. Enable project name, instructions, manifests and directory separately.
- Import/export uses `{"version":1,"favorites":[...]}`, up to 8 MiB and 5,000 entries.

API keys are stored by Harness's credential service; the page only shows whether one is configured.

## Screenshots

| Clarify needs | Enhance prompt |
|:---:|:---:|
| <img src="docs/images/clarify-dark.png" width="420" alt="Clarify needs"> | <img src="docs/images/rewrite-dark.png" width="420" alt="Enhance prompt"> |

<img src="docs/images/library-dark.png" width="760" alt="Saved prompts">

## Development and validation

```sh
pnpm install
pnpm check
pnpm test
pnpm pack:plugin
```

See [Development](docs/development.md) for the module layout and committed build output, and [Validation](docs/validation.md) for automated coverage, real-Harness scope and limitations.

MIT
