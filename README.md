# 刘梓恩 · AIGC 作品集

当前首页为六章节滚动体验：幕布开场 → 海报展廊 → 创作工作台 → 影像工作站 → 创意空间 → 红幕谢幕。向下滚动推进，向上滚动回看，停止滚动停帧。顶部保留全部作品与菜单入口，全站当前共 23 个作品。

场景使用 4K 视频跟随滚动定位，文字与交互层独立运动。背景视频按原编码无损拆分，按滚动位置加载，避免连续等待大 MP4 的旧定位请求。旧版多场景实现保留在 CinematicExperience.jsx。调用 LibTV 生成前须取得用户明确同意。

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

运行 `npm run build` 生成保留本地原素材的静态部署包，`npm run build:pages` 额外适配 GitHub Pages 路径。正式构建只排除未使用资源；视频、音轨、图片与品牌手册不做部署压缩。三个滚动背景视频生成 MSE / HLS 共用的无损片段，原 MP4 保留在本地及源码还原流程中，发布包只保留片段。拆分时核对全部编码包 SHA-256，`node scripts/verify-static-build.mjs` 再核对发布文件与原文件。`node --test scripts/test-scroll-video.mjs` 检查定位、反向滚动、缓冲回收及失败恢复。

当前生产部署在 GitHub Pages；部署源码目录为 `outputs/github-deploy`，分支为 `codex/portfolio-live`，后续更新流程见部署文档。测试截图及部署目录位于忽略的 `artifacts/`、`outputs/`，不进入主工作区的源码提交。
