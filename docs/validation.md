# 验证记录

历次发布说明见 GitHub Releases。这里只记当前版本的验证状态和已知限制。

## 0.1.6

2026-11-05。Windows 11，Node.js `24.16.0`，Harness SDK `0.2.2-rc.1`，Cordis `4.1.0`。

### 自动检查

| 项目 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile`、`pnpm peers check` | 通过 |
| `pnpm check` | Host 与 Client 类型检查通过 |
| `pnpm test` | 12 个文件、152 项通过 |
| `pnpm pack:plugin` | 构建、客户端入口注册、发布包清单校验通过 |

测试覆盖：生成与追问流程、问题规整、深度与画像的规则选择、多选与推荐排序、补问与重述、改答案未改动时恢复上次结果、结果写回与撤销、草稿与项目变化、收藏排序与撤销、导入校验、三种协议与自动回退、凭据与敏感内容过滤。输入框保护覆盖 `sending`、`adjudicating`、`claimed`、`submitting`。CI 在 Windows、Ubuntu、macOS 上跑同样的检查，并确认提交的 `lib/` 与源码一致。

### 未验证

- 本轮没启动真实 Harness，没重跑安装升级和真实模型调用。
- macOS、Linux 上的 Harness 没测。
- 没通过插件管理器走完整的安装、升级、停用与恢复。
- 取消、切会话、改稿与多附件的组合没穷举；中文输入法候选窗没穷举。
- 宿主安装器对同版本归档重装可能报依赖变更错误，升级时用新的补丁版本。

### 历史记录

0.1.5 做过真实模型评估和界面检查，记录在 GitHub Releases。人工回归用例在 [prompt-evaluation-cases.json](prompt-evaluation-cases.json)，不随请求发送。README 截图来自浏览器夹具，不是 Harness 窗口截图。
