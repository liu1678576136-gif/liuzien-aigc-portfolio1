# 刘梓恩 · AIGC 作品集

高画质 GitHub Pages 部署分支。当前网站包含 23 个作品及六场景滚动体验。

运行 `npm ci`、`npm run build:pages`，然后运行 `node scripts/verify-static-build.mjs`。

正式构建仅清理未使用资源，视频、音轨、图片和品牌手册保持本地来源字节不变。三段较大的场景视频在源码中保存为 8 MiB 分段，构建时无损还原为原 MP4；最终网页直接播放完整原视频。GitHub Pages 路径由构建脚本适配。
