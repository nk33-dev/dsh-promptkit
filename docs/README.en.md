# PromptKit usage

Requires DeepSeek Harness 0.2.1-rc.2. Install `dist/dsh-promptkit-0.1.2.tgz` through the plugin manager, enable it and restart Harness. To build locally, run `pnpm install` and `pnpm pack:plugin`.

Write a draft and choose **Optimize prompt** or **Explore requirements** from the composer tools. Results appear in a 600px side panel, full width on narrow windows. Edit, replace, append or copy; PromptKit never sends the message.

Explore requirements asks up to three questions per group, one at a time, with no fixed round limit. The requirements summary waits for user confirmation before generating the prompt. Answers can be edited and results refined. Closing the side panel preserves the workflow until the client exits. Failed requests preserve input; draft changes pause generation. Writing checks session, project, draft revision, references and attachments.

**Library** opens independently of the model connection. Search, pin, tag and scope prompts to projects. Select a prompt to preview it; choose Edit to change it. Lists load summaries; full text is fetched on selection. More results load in batches of 50.

Open **Harness Settings → PromptKit** for feature switches, model connection, rules, presets and library import/export. Feedback collection is retired; existing records are retained. Disabling a feature keeps its data. Credentials use Harness's credential service and are never returned to the page. Independent services support Chat Completions, Responses, Anthropic Messages and automatic selection. Include the API prefix in the base URL.

Context is off by default. Enable selected project information, instructions, manifests or a two-level directory tree. The preview shows exactly what was included. A total 14,000-character budget and path/size restrictions apply.

Imports use `{ "version": 1, "favorites": [...] }`, at most 8 MiB and 5,000 entries. Review the added/duplicate counts before committing. Validation and revision checks keep invalid imports from partially changing the library. Duplicate IDs are skipped.

Review exports before sharing: user-written text may contain private information. Plugin disable aborts requests and releases listeners; provider billing depends on the service.

Component tests run in Windows Chromium with deterministic model responses. This does not verify a new native Harness installation, other platforms or external model reliability; see the validation record.
