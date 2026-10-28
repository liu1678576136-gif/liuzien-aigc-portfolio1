# 线上部署与性能记录

更新日期：2026-10-28（Asia/Shanghai）。用户已确认公开访问、保留六幕滚动，点击海报进入作品子页面；滚动背景改用 2K H.265 CRF23，作品高清原文件保留。

- 正式网址：https://liu1678576136-gif.github.io/liuzien-aigc-portfolio1/
- 仓库：liu1678576136-gif/liuzien-aigc-portfolio1；生产分支：codex/portfolio-live。
- 部署源码：C:/Users/刘大侠/Documents/作品集网站/outputs/github-deploy，独立于主工作区分支。
- GitHub Actions 工作流：Deploy high-quality portfolio。当前版本以生产分支最新成功的部署为准。

## 背景压缩与兼容性

三个背景的原 4K MP4 合计 332.8 MiB，均保留在本地。主版本限定最高 2560×1440，H.265 / hvc1、CRF23，合计约 90.4 MiB（减少 72.8%）。保持素材长宽比，因此各场景实际尺寸略有差异。兼容版本是最高 1920×1080 的 H.264 CRF21，合计约 81.8 MiB。取消初版兼容版本过紧的码率限制，避免强光转场出现块状压缩痕迹。

浏览器先检查实际编解码器支持；有 MediaCapabilities 时还检查 HEVC 硬件流畅性和效率，查询最多等 1 秒，不能高效处理时选择 AVC。只下载选中的版本。每约 0.2 秒一个独立片段，无 B 帧，快速和反向定位复用同一控制器。新 URL 使用 stream-web-v4，避免命中旧背景缓存。

背景转码是有损压缩，细纹理会有少量损失，不能称为原编码无损。已对比海报区域样片；2K HEVC CRF23 的三秒样片相对同尺寸参考 SSIM 约 0.990，不能将该指标等同于肉眼质量百分比。完整作品视频、原图、PDF 和音轨未按此方案压缩。

构建保持全部原帧时间和数量，转码后与原素材核对帧时间；分段后再逐包核对转码视频。18 个 HEVC / AVC 首、中、末片段单独解码，像素与对应的转码文件一致，验证随机进入片段可正确定位。

## 作品子页面

保留六幕首页，海报、VI/IP、影像和作品入口导航到独立页面。示例：#/works/poster、#/works/brand、#/work/lze-workbench。使用哈希路由，直接打开和刷新仍由 GitHub Pages 首页提供，避免路径 404。

进入作品页会卸载首页滚动场景、停止分段请求。原图和视频按子页面需要加载。返回按钮和浏览器后退保留作品列表滚动位置；返回展廊使用保存的场景进度，适配窗口高度变化。菜单“从头开始”重新播放开场。

## 构建与验证

npm run build:pages：还原 Git 中分段保存的三段原背景、生成衍生图片、生成并缓存 HEVC/AVC、Vite 构建、清理未引用资源并适配项目路径。源文件保存为 8 MiB 分段属于 Git 运输方式，与在线播放片段不同。

当前完整发布包约 520 MiB，739 份媒体文件逐一核对；其中 168 份原有作品媒体与附属文件保持不变。23 项模块测试覆盖定位、格式回退、下载取消、缓冲回收、路由和位置保存。另渲染作品索引、分类、详情、缺失作品与英文页面，确认作品子页不挂载背景视频。

检查命令：
- node --test scripts/test-scroll-video.mjs scripts/test-portfolio-routes.mjs
- node scripts/test-work-pages.mjs
- node scripts/verify-static-build.mjs
- node scripts/verify-scroll-decoding.mjs

浏览器控制连接多次超时；上述模块测试、页面渲染与视频解码不能记为实际浏览器滚轮手感验收。上线后另外核对新代码、公开片段以及作品原文件。

## 发布方式

将修改的源码同步至 outputs/github-deploy，完成构建及验证后，推送该目录的 codex/portfolio-live；不要强推主工作区历史。生成的 stream-web-* 目录和 outputs 缓存不提交，云端从原文件复现。

Git 若直连失败，沿用本机已开启代理，仅对单次命令指定 http.proxy=http://127.0.0.1:7890、http.sslBackend=openssl、http.version=HTTP/1.1。不更改系统代理或全局 Git 设置。使用系统已有 GitHub 登录，不输出或保存凭据。

Sites 256 MiB 路线和此前 4K 无损分段发布是历史版本，不是本次性能方案。额度恢复后的续接检查已在上次完成时删除，不会自动重复发布。
