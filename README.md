# EmailCheck 站（email.newkwlab.com）— 待部署包

静态站，GitHub Pages 托管，一仓一站。首页＝免费单查工具页（调生产 API
https://emailcheck-api.pages.dev），另有 10 个问题页（/questions/<slug>/）。
全站中英双语切换（默认英文）。本地构建完成于 2026-11-09，尚未部署。

页面由两部分组成：`index.html` 手写；问题页由
`~/workspace/emd-sites/gen-emailcheck-questions.py` 生成（改问题页内容先改生成器再重跑，
不要直接改生成出来的 HTML）。

## 部署顺序单

0. **DNS — 已完成**（2026-11-09）：Vision 已在阿里云给 newkwlab.com 加 CNAME
   `email → binbin7418-dotcom.github.io`，主会话 DoH 实查生效（TTL 600）。
   phone / card / iban 三个子域名同批完成，供后续三站使用。
1. **上传前替换 BingSiteAuth.xml**：仓内现在是占位说明文件。部署批次先把 EC2 上
   `/var/www/bingsiteauth/BingSiteAuth.xml`（与现行六站共用的 85 字节正本）原样
   覆盖进来，逐字节一致，Bing 逐站验证靠它。
2. **后端 CORS 修复（工具页浏览器调通的前置，阻塞项）**：emailcheck-api 当前响应
   无 `Access-Control-Allow-Origin`、OPTIONS 预检回 404，浏览器从
   email.newkwlab.com 直调会被拦（服务端调用不受影响）。部署批次需给
   /validate 与 /validate/batch 加 `Access-Control-Allow-Origin: *` 并处理
   OPTIONS，再部署后端并用带 Origin 头的请求复验。此步完成前，站内工具框在
   真实浏览器里调不通，只能先上内容页。
3. **建仓上传**：新建公开仓 `emd-emailcheck-site`，把本目录内容原样放仓根
   （含 CNAME 文件，内容 `email.newkwlab.com`）。网页上传按单文件逐个传的定式；
   推完后用 GitHub API 核文件树与字节数。
4. **仓库侧绑定自定义域名**：开 GitHub Pages（main 分支根目录）；仓根 CNAME 文件
   即域名绑定声明，Pages 设置里确认 Custom domain 显示 email.newkwlab.com。
5. **HTTPS 证书观察**：等 GitHub 为该子域名自动签发证书（DNS 已生效，通常数小时内）；
   证书就绪后开 Enforce HTTPS；48 小时内复查一次（foundation-checklist 第 1 节口径）。
6. **上线自验**：首页＋10 个问题页逐页 200；sitemap.xml 200 且 11 条 URL 与
   canonical 逐条一致；robots.txt / llms.txt 可达；在真实浏览器里跑一次站内
   工具框（依赖第 2 步）与双语切换。
7. **收录提交（foundation-checklist 第 3 节 R1–R5，逐页验收）**：
   - R1：GSC（sc-domain:newkwlab.com 域名属性，已覆盖子域名）提交
     https://email.newkwlab.com/sitemap.xml；Bing 站长添加本站（用仓内
     BingSiteAuth.xml 验证）并提交同一 sitemap。
   - R2：GSC 里对首页＋10 个问题页逐页「网址检查 → 请求编入索引」，逐页记台账。
   - R3：Bing 里逐页提交 URL，逐页记台账。
   - 台账落 `~/workspace/emd-foundation/indexing-log-<上线日期>.md`（URL／GSC 状态／
     Bing 状态／复查时间，逐页一行）。
   - R4：48 小时内逐页验索引状态并回填；R5：未进的页先按 SOP-05 第 0 步自查
     （前 2 段答主问题／主词进标题、meta、首段／内链在位），补完再请求一次，
     仍未进则记台账观察，不删页、不重复轰炸提交。
8. **零基线**：上线当日在台账记零基线（收录页数、外部调用数、外部用户数），
   后续增量并入每日 11:00 复盘。

## 本地自测

```
cd ~/workspace/emd-sites/emailcheck
python3 -m http.server 8811
# 打开 http://localhost:8811/ 与 /questions/<slug>/ 逐页核对
```

注意：本地自测时工具框的 fetch 会被浏览器 CORS 拦下（见顺序单第 2 步），这是后端
待修项，不是站内代码问题；fetch 逻辑本身已用 node 对生产 API 验通（见 graph.md
N5 自测记录）。
