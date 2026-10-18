# PromptKit

先写个大概，边问边把需求补齐。好用的提示词，留着下次用。

DeepSeek Harness 插件：把草稿补成能直接执行的提示词，或先问几个关键问题再写。

[English](README.en.md)

![输入框旁的两个入口与模式菜单](docs/images/composer-menu.png)

## 安装

在 Harness 中打开 **插件 → 添加插件** 右侧箭头 → **安装第三方插件**，粘贴：

```text
github:nk33-dev/dsh-promptkit#path:/packages/promptkit
```

安装后启用并重启 Harness。支持 Harness `0.2.1-rc.2`。仓库已带构建产物，不需要在本机安装 Node 或 pnpm。

从源码安装或开发时，见[开发说明](docs/development.md)。

## 功能

- **增强提示词**：补全草稿的范围、实现步骤和验收方式；新增的设定标为建议或假设。
- **需求对齐**：一次一题，点选后自动进入下一题；一轮答完自动提交。方向明确后给出需求小结，确认后写提示词。
- **常用提示词**：即时搜索、项目与标签筛选、拖动排序；点一条追加到输入框，悬停可替换或编辑，删除可撤销。
- **安全的写回**：结果可继续修改，确认后追加或替换；替换后可撤销，不会自动发送。
- 可选项目上下文、宿主模型或独立服务、中英文与亮暗主题。

## 使用

在输入框旁点击 ✨。两种模式都开启时先选模式，只开一种时直接开始。

- 需求对齐的数字键 `1`–`9` 选择选项，`←`/`→` 切换题目；底部可以「不问了，直接写」。
- 结果下方输入「还想改哪里」可继续调整；操作区提供重新生成、复制、存为常用、追加和替换。
- 点击 🔖 打开常用提示词；「存当前输入」把当前草稿存为收藏。

输入框内容在卡片打开后被改动时，流程会锁定并提示「按新内容重来」，不会静默覆盖。

## 设置

打开 **Harness 设置 → PromptKit**。

- 三个入口开关、默认模式、模型连接、超时。
- 改写与提问规则，留空使用内置规则。
- 项目上下文默认关闭；开启后可选择项目名、说明、清单和目录。
- 收藏导入导出：`{"version":1,"favorites":[...]}`，最多 8 MiB、5000 条。

API Key 由 Harness 凭据服务保存，页面只显示是否已配置。

## 界面

| 需求对齐 | 增强提示词 |
|:---:|:---:|
| <img src="docs/images/clarify-dark.png" width="420" alt="需求对齐"> | <img src="docs/images/rewrite-dark.png" width="420" alt="增强提示词"> |

<img src="docs/images/library-dark.png" width="760" alt="常用提示词">

## 开发与验证

```sh
pnpm install
pnpm check
pnpm test
pnpm pack:plugin
```

开发入口、提交构建产物的约定见[开发说明](docs/development.md)；自动检查、真实 Harness 范围和限制见[验证记录](docs/validation.md)。

MIT
