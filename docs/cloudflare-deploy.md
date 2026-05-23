# Cloudflare 部署指南

## 方案优势

- **Cloudflare Workers（API）**：每天 10 万次请求免费额度
- **Cloudflare Pages（H5）**：无限带宽，CDN全球加速
- **自定义域名**：`aowuaowu2026.xyz` 可直接绑定，无额外费用

---

## Step 1：部署 Cloudflare Workers（API）

### 1.1 登录 Cloudflare Dashboard

访问：https://dash.cloudflare.com

### 1.2 创建 Workers

1. 左侧菜单 → **Workers & Pages** → **Create application** → **Create Worker**
2. 名字随便填（如 `paper-experiment-api`），点 **Deploy**
3. 进入 Worker 后 → **Settings** → **Variables and Secrets** → **Add variable**：

添加以下环境变量（**Encrypt 全部勾选**）：

| Variable name | Value |
|---|---|
| `BAILIAN_APP_ID_EXP` | `467708a331474605b5d30d999417edd0` |
| `BAILIAN_API_KEY_EXP` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `BAILIAN_APP_ID_UTIL` | `7f59b8a020ff4311a376f0a685f1024d` |
| `BAILIAN_API_KEY_UTIL` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `FEISHU_APP_ID` | `cli_a92b1db5a7f89bc4` |
| `FEISHU_APP_SECRET` | （飞书开发者后台获取） |
| `FEISHU_SHEET_TOKEN` | `LkoJsvZ0Ohxl6ctvDkFcEU0YnCh` |

4. 回到 Worker 详情页 → **Edit Code**，把 `/root/paper-experiment-h5/workers/chat.js` 内容粘贴进去（3个文件分别对应3个Worker，或者把3个合并为1个用路由分发）

### 1.3 路由配置（3个端点）

在 Worker 的 **Settings** → **Triggers** → **Routes** 添加：

| Route | Worker |
|---|---|
| `api.aowuaowu2026.xyz/chat` | 这 Worker |
| `api.aowuaowu2026.xyz/log-message` | 这 Worker |
| `api.aowuaowu2026.xyz/submit-survey` | 这 Worker |

或者直接用 **一个 Worker + 路由分发**，在 Worker 代码入口判断 `request.url` 分发到不同处理器。

### 1.4 更简单：3个独立 Worker

分别创建 3 个 Worker，部署对应代码：

```
Worker 1: paper-exp-chat     → 代码: chat.js
Worker 2: paper-exp-log      → 代码: log-message.js
Worker 3: paper-exp-submit   → 代码: submit-survey.js
```

然后绑定路由：
```
api.aowuaowu2026.xyz/chat         → paper-exp-chat
api.aowuaowu2026.xyz/log-message  → paper-exp-log
api.aowuaowu2026.xyz/submit-survey → paper-exp-submit
```

---

## Step 2：部署 H5 到 Cloudflare Pages

### 2.1 导入 GitHub 仓库

1. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 选择 `wenfan666521-boop/paper-experiment-h5`
3. **Build settings**：
   - Build command: （留空）
   - Output directory: `public`
4. **Environment variables**（可选，Pages也可以通过 `_routes.json` 配置）：
   - `API_BASE`: `https://api.aowuaowu2026.xyz`（等Workers部署好再填）
5. **Deploy**

### 2.2 绑定自定义域名

在 Pages → **Custom domains** 添加：
- Domain: `aowuaowu2026.xyz`
- Subdomain: `paper`（或留空使用根域名）

---

## Step 3：配置前端 API 地址

Workers 部署好后，在 `public/assets/api.js` 里修改 `BASE`：

```javascript
BASE: 'https://api.aowuaowu2026.xyz',
```

然后重新 Push 到 GitHub，Cloudflare Pages 会自动重新构建部署。

---

## Step 4：飞书 App Secret 获取

如果还没拿到 `FEISHU_APP_SECRET`：

1. 打开 https://open.feishu.cn/app
2. 找到你的自建应用（`cli_a92b1db5a7f89bc4`）
3. **凭证与基础信息** → 复制 **App Secret**

---

## 最终访问地址

| 服务 | 地址 |
|---|---|
| H5 页面 | `https://paper.aowuaowu2026.xyz`（或你自己的域名） |
| 对话 API | `https://api.aowuaowu2026.xyz/chat` |
| 日志 API | `https://api.aowuaowu2026.xyz/log-message` |
| 提交 API | `https://api.aowuaowu2026.xyz/submit-survey` |
