# 刘梓恩 · AIGC 作品集

当前首页为六章节滚动体验：幕布开场 → 海报展廊 → 创作工作台 → 影像工作站 → 创意空间 → 红幕谢幕。向下滚动推进，向上滚动回看，停止滚动停帧。顶部保留全部作品与菜单入口，全站当前共 23 个作品。

场景使用最高 2560×1440 的 H.265 CRF23 视频跟随滚动定位，文字与交互层独立运动。不支持或不能流畅硬件解码 H.265 时，自动使用最高 1920×1080 的 H.264 版本。原始 4K 文件保留。点击场景海报或作品入口进入独立作品子页面，返回时恢复场景位置。调用 LibTV 生成前须取得用户明确同意。

## 本地运行

安装依赖后，生成网页图片并启动 Vite：

```powershell
npm run prepare:studio
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

浏览 `http://127.0.0.1:5173/`。当前界面不需要后端接口。

## 构建

```powershell
npm run build:local
```

构建会自动生成衍生图，不修改原素材。既有完整构建流程仍通过 `npm run build` 执行。

## 文档与内容

- [线上部署与后续更新说明](docs/DEPLOYMENT.md)
- [新对话续接记录与当前取舍](docs/PROJECT-HANDOFF.md)
- [当前版本与参考站纠偏说明](docs/cinematic-reference-correction.md)
- [原创场景素材与提示词](docs/cinematic-assets.md)
- [艺术馆远景到海报近景的分镜与待替换素材](docs/gallery-camera-sequence.md)
- [历史原型说明与分镜](docs/studio-prototype.md)
- [作品与个人资料清单](docs/studio-content-checklist.md)
- [首版验收记录](docs/studio-verification.md)，原全屏版本交互记录见 `output/cinematic-interaction-results.json`；新增艺术馆检查见 `output/gallery-interaction-results.json`。
- 项目与个人资料在 `src/data/studio.js` 维护；素材清单由 `scripts/prepare-studio-assets.mjs` 自动生成。

当前以桌面端体验为主。

## 高画质部署

运行 `npm run build` 生成部署包，`npm run build:pages` 额外适配 GitHub Pages 路径。只压缩三个滚动背景；作品图片、完整视频、音轨和品牌手册的原文件保留。背景同时生成 2K HEVC 和 1080p AVC 的 MSE / HLS 片段，浏览器只加载可用的一个版本。原背景约 332.8 MiB，HEVC 版本约 90.4 MiB，AVC 约 52.9 MiB；完整发布包约 491 MiB。首次构建会编码，后续复用忽略目录中的缓存。

`node scripts/verify-static-build.mjs` 核对发布文件和原始素材，`node scripts/verify-scroll-decoding.mjs` 真正解码首、中、末片段核对定位。`node --test scripts/test-scroll-video.mjs scripts/test-portfolio-routes.mjs` 检查定位、格式选择与子页面路由；`node scripts/test-work-pages.mjs` 渲染作品页，确认未挂载滚动背景。

独立链接采用 `#/works/poster`、`#/work/lze-workbench` 等路由，可直接打开与刷新，不需要额外的服务器路由配置。

当前生产部署在 GitHub Pages；部署源码目录为 `outputs/github-deploy`，分支为 `codex/portfolio-live`，后续更新流程见部署文档。测试截图及部署目录位于忽略的 `artifacts/`、`outputs/`，不进入主工作区的源码提交。
