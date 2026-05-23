# 部署说明

## 凭证汇总（机密，请勿外传）

| 变量名 | 值 |
|---|---|
| `BAILIAN_APP_ID_EXP` | `467708a331474605b5d30d999417edd0` |
| `BAILIAN_APP_ID_UTIL` | `7f59b8a020ff4311a376f0a685f1024d` |
| `BAILIAN_API_KEY_EXP` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `BAILIAN_API_KEY_UTIL` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `FEISHU_APP_ID` | `cli_a92b1db5a7f89bc4` |
| `FEISHU_APP_SECRET` | （系统keychain已存，可通过lark-cli认证获取）|
| `FEISHU_SHEET_TOKEN` | `LkoJsvZ0Ohxl6ctvDkFcEU0YnCh` |

## 飞书表格

**已创建好，地址**：
https://xcn6gvimkp72.feishu.cn/sheets/LkoJsvZ0Ohxl6ctvDkFcEU0YnCh

包含3个Sheet：
- `participants`（11列，已写好表头）
- `chat_logs`（8列，已写好表头）
- `survey_responses`（39列，已写好表头）

## Vercel 部署步骤

### Step 1：导入项目
访问：https://vercel.com/new/import?template=https://github.com/wenfan666521-boop/paper-experiment-h5

### Step 2：配置环境变量
在 Vercel → Project Settings → Environment Variables 添加上表所有变量。

> ⚠️ 注意：`FEISHU_APP_SECRET` 需要从飞书开发者后台获取自建应用的 App Secret。

### Step 3：部署
点 Deploy，约1分钟后获得 API 地址（如 `https://paper-experiment-h5.vercel.app`）。

### Step 4：配置前端API地址
在 `public/assets/api.js` 里修改 `BASE` 为你的 Vercel API 地址，然后 Redeploy。

## GitHub Pages（H5前端）

在仓库 Settings → Pages → Source: "Deploy from a branch" → Branch: `main` → Folder: **`/public`**

访问地址：`https://wenfan666521-boop.github.io/paper-experiment-h5/`
