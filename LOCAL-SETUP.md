# 悟道渡己 · 听记
渡友整理「人生悟道 · 渡人渡己」直播对话。本站为非官方听记。文字稿根据直播内容整理，直播分析与投资分析均由 AI 生成。

## 本地阅读
在 WorkBuddy 打开仓库根目录。有 Python 3 时，Windows 双击 start-windows.cmd，或在终端运行 python start.py（macOS/Linux 可用 python3 start.py）。浏览器访问 http://127.0.0.1:8765/ 。阅读进度和笔记保存在当前浏览器。

## 维护与部署
静态网站文件集中在 dist/。场次目录位于 dist/catalog.js，正文、海报和原始文档分别位于 dist/content/、dist/posters/、dist/originals/。更新正文或目录后运行 node scripts/index-search.mjs 重建搜索索引并更新文件版本。仅修改样式、脚本、海报或下载文件时，发布前运行 `node scripts/version-assets.mjs`。发布根目录为 dist/。

发布前运行 `node scripts/check-release.mjs`，核对各场正文、专题来源链接、全文搜索索引、原始文档及静态文件版本。
