# 线上部署记录

更新日期：2026-10-28（Asia/Shanghai）。用户已确认优先画质、使用部署前本地素材、任何拿到链接的人都可访问。

- 正式网址：https://liu1678576136-gif.github.io/liuzien-aigc-portfolio1/
- 托管：GitHub Pages；GitHub Actions 工作流 `Deploy high-quality portfolio`。
- 仓库：`liu1678576136-gif/liuzien-aigc-portfolio1`；生产分支：`codex/portfolio-live`。
- 首次公开部署提交：`21436d7fd9a35a7edd1748cda7d100c2d3bcb93b`。后续版本以生产分支最新成功的 Actions 部署为准。
- 首次成功运行：https://github.com/liu1678576136-gif/liuzien-aigc-portfolio1/actions/runs/40593544064
- 部署源码目录：`C:/Users/刘大侠/Documents/作品集网站/outputs/github-deploy`。此目录为独立部署检出，现有主分支未改动。

## 画质与构建

当前构建约 680.4 MiB，只包含实际引用资源。23 个作品、六章节体验均使用本地版本。168 份作品媒体、音轨、图片、PDF 原文件保持一致。三段背景视频在 Git 源码中以 8 MiB 分段保存，由 `restore-source-media.mjs` 还原；构建再用 `prepare-scroll-streams.mjs` 无损封装为 145 个可按位置读取的 fMP4 片段。拆分前后全部视频编码包的 SHA-256 相同，没有缩小分辨率或重新编码。322 份发布文件逐文件核对；未将三份完整背景 MP4 重复放入上线包。

生产构建：`npm run build:pages`。它会生成图片衍生图、Vite 构建、按引用清理资源，并适配 `/liuzien-aigc-portfolio1/` 路径。随后运行 `node scripts/verify-static-build.mjs` 核对文件。工作流再上传 `dist/` 并部署到 `github-pages` 环境。

已在线验证：首页及当前应用代码 HTTP 200、无须登录；主场景原视频、工作台演示、品牌手册 HTTP HEAD 大小与本地一致，Range 请求 HTTP 206 且抽样字节相同。

首次发布已完成原 MP4 的上述在线验证。滚轮修复版本改为检查流清单、初始化文件、首尾片段以及作品原文件；最终运行结果另见 Actions。浏览器连接在交互检查中反复超时，不能将自动化模块测试记录为完整浏览器手感验收。

## 2026-10-28 滚轮卡顿修复

开场原先仅等待封面图片；现在会等待首个已解码视频帧（最多 8 秒），慢网时明确提示正在载入。播放器只读取目标位置附近的原编码片段，取消过期下载，限制缓冲范围，允许替换已过时的未缓冲定位，并保留最新滚轮目标。正在正常解码的帧最多保留 120 毫秒，避免滚轮频繁打断解码。视频定位按素材帧率取整，谢幕共用同一控制器。Safari 原生 HLS 使用相同片段。

13 项模块测试覆盖首次帧、快速滚动、过期定位、反向滚动、缓冲回收、失败重试、谢幕事件重入、卸载及原生 HLS 回退。首幕第一段约 1.50 MB，主场景第一段约 2.53 MB；场景原画质和作品原文件均保留。首次跨越未缓冲位置仍取决于网络速度。

## 后续更新

在主工作区编辑和预览内容；发布时将相应源码及原素材同步到 `outputs/github-deploy`，在该目录构建、核验并推送 `codex/portfolio-live`。同步新增大视频时更新 `source-media/manifest.json` 与分段，并将重建后的大 MP4 保持忽略。不要将主工作区之前的未发布大素材提交直接强推到生产分支。

本机已有代理为 `http://127.0.0.1:7890`。Git 如直连失败，可在单次命令中使用 `-c http.proxy=http://127.0.0.1:7890 -c http.sslBackend=openssl -c http.version=HTTP/1.1`；无需改变系统配置。GitHub 登录通过系统已有凭据管理器使用，凭据不写入文件或输出。

## 保留的历史尝试

Sites 路线因 256 MiB 总包限制停止，用户明确选择改用更合适的托管并恢复未压缩版本。`outputs/sites-source`、各压缩缓存和旧归档是历史尝试，不是生产发布来源；原 Sites 站点的内容与访问设置未改动。本地原文件均保留。`npm run build:sites` 为历史打包入口。

## 额度中断的兜底

本对话已设置 2026-10-28 08:15 的一次性续接检查：仅任务未完成且额度恢复时续做；已完成则保持安静，不重复部署。该检查依赖电脑开机联网、桌面应用运行。
