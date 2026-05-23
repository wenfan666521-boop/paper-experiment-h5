# 部署说明

## 凭证汇总（机密，请勿外传）

| 变量名 | 值 |
|---|---|
| `BAILIAN_APP_ID_EXP` | `467708a331474605b5d30d999417edd0` |
| `BAILIAN_APP_ID_UTIL` | `7f59b8a020ff4311a376f0a685f1024d` |
| `BAILIAN_API_KEY_EXP` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `BAILIAN_API_KEY_UTIL` | `sk-41ec25d4bc7246b39f1706750dcac482` |
| `FEISHU_APP_ID` | （待补充） |
| `FEISHU_APP_SECRET` | （待补充） |
| `FEISHU_SHEET_TOKEN` | （待补充） |

## Vercel 部署步骤

### Step 1：导入项目
访问：https://vercel.com/new/import?template=https://github.com/wenfan666521-boop/paper-experiment-h5

### Step 2：配置环境变量
在 Vercel → Project Settings → Environment Variables 添加上表所有变量。

### Step 3：部署
点 Deploy，等待约1分钟，获得 API 地址（如 `https://paper-experiment-h5.vercel.app`）。

### Step 4：配置前端API地址
在 `public/assets/api.js` 里找到 `BASE`，改为你的 Vercel API 地址，然后 Redeploy。

## GitHub Pages 部署（H5前端）

### 方法一：在 GitHub Pages 设置选 /public

1. 仓库 → Settings → Pages → Source: "Deploy from a branch"
2. Branch 选 `main`，Folder 选 `/ (root)` 
   - **前提**：先把 `public/` 里的内容移到根目录

### 方法二：移到根目录（推荐）

```bash
# 把 public/ 里所有文件移到根目录
cd /root/paper-experiment-h5
mv public/* .
# 然后 git push 到 GitHub，再在 Pages 设置里选 /(root)
```

### GitHub Pages 地址（部署成功后）
`https://wenfan666521-boop.github.io/paper-experiment-h5/`
