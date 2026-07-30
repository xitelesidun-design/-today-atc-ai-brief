# 移动端部署与每日更新

## 部署结果

部署完成后，手机直接访问 GitHub Pages 提供的网址即可阅读。浏览器菜单中的“添加到主屏幕”可将其作为桌面入口。

## 首次部署（约 10 分钟）

1. 在 GitHub 创建一个新的**公开**仓库，例如 `today-atc-ai-brief`。
2. 将本目录的文件推送到该仓库的 `main` 分支。
3. 在仓库的 **Settings → Pages** 中，将发布来源选择为 **GitHub Actions**。
4. 在 **Settings → Secrets and variables → Actions** 中创建仓库密钥：
   - 名称：`OPENAI_API_KEY`
   - 值：你的 OpenAI API 密钥。
5. 打开 **Actions**，手动运行一次 **Generate daily ATC brief**。成功后，任务页面会显示网页地址。
6. 在手机浏览器打开该地址，并添加到主屏幕。

不要把 API 密钥写入 `news.js`、`data` 文件或 Git 提交记录；工作流只会从 GitHub Secrets 读取它。

## 每日运行方式

- 定时任务：每天北京时间约 08:17 自动运行；若无足够官方来源或生成结果未通过校验，任务失败，网站保留上一期日报。
- 手动补跑：在 GitHub 仓库的 **Actions** 页面运行 **Generate daily ATC brief**。
- 历史日报：成功生成后会写入 `data/archive/YYYY-MM-DD.json`，网页顶部的“历史日报”可切换最近 60 期。

## 内容和安全边界

- 仅抓取 `config/sources.json` 中的来源。新增来源前应确认其权威性、语言和使用条款。
- 模型只能从已抓取的来源中选题和使用链接；生成器会拒绝白名单外链接。
- 每条英文摘录限制为 25 个英文词以内；中国无英文原文时，应明确显示“中文官方原文 + AI英文译文”。
- 快报是辅助研判，不替代航行情报、气象预报、运行通告及单位指令。

## 常用维护位置

| 需求 | 文件 |
| --- | --- |
| 增删新闻来源 | `config/sources.json` |
| 调整每日名词库 | `config/terms.json` |
| 调整 AI 选择与审核规则 | `tools/generate-daily-report.mjs` |
| 调整每天运行时间 | `.github/workflows/daily-brief.yml` |
| 调整网页样式 | `styles.css` |

## 已知限制

GitHub Actions 的定时任务并非实时调度服务，偶有延迟。若日后需要严格按秒、更多来源或多人审核，可平移到 Cloudflare Workers + Pages；网页和日报数据结构无需重写。
