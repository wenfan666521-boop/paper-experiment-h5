# Paper Experiment H5

## 📖 项目简介

毕业论文实验配套 H5：**AI交互风格 × 服务场景 对用户支付意愿的影响**

- **设计**：2(场景，被试间) × 2(AI风格，被试内) 混合实验
- **场景**：体验式（家庭度假）/ 功利式（商务出差）
- **AI风格**：体验导向AI（星程）/ 功利导向AI（出行助手）
- **部署**：GitHub Pages（H5前端）+ Vercel（API代理）
- **数据**：飞书表格

## 📁 项目结构

```
paper-experiment-h5/
├── public/                  # H5 静态页面（→ GitHub Pages）
│   ├── index.html          # 入口
│   ├── consent.html        # 知情同意
│   ├── demographics.html   # 人口学信息
│   ├── scenario.html       # 场景启动
│   ├── scenario-mc.html    # 场景操控检验
│   ├── chat.html           # 对话核心页
│   ├── survey.html         # 量表评价
│   ├── thanks.html         # 致谢
│   └── assets/
│       ├── state.js       # 全局状态
│       ├── scenarios.js    # 场景材料
│       ├── survey-data.js # 量表配置
│       ├── api.js         # API调用
│       └── style.css
├── api/                     # Vercel Serverless（→ Vercel）
│   ├── chat.js             # 百炼对话代理
│   ├── log-message.js      # 实时记录对话到飞书
│   └── submit-survey.js    # 提交量表到飞书
├── docs/
│   ├── flow.md             # 实验流程图
│   └── feishu-schema.md    # 飞书表格结构
└── vercel.json
```

## 🚀 实验流程

```
欢迎页 → 知情同意 → 人口学信息
   ↓
随机分配【场景】（体验式 OR 功利式）
   ↓
场景启动（10秒强制阅读）→ 场景操控检验
   ↓
随机【AI顺序】（A→B OR B→A）
   ┌─ AI助手1 真实对话（≥5轮）→ 量表评价
   └─ AI助手2 真实对话（≥5轮）→ 量表评价
   ↓
致谢 + 任务码
```

## 🛠️ 部署步骤

### Step 1：部署 H5 前端到 GitHub Pages

1. Fork 或直接推送本仓库到 GitHub
2. 在 GitHub 仓库 → Settings → Pages → Source: `main` branch `/ (root)`
3. 等待部署（约2分钟），获得地址如 `https://wenfan666521-boop.github.io/paper-experiment-h5/`

### Step 2：部署 API 到 Vercel（免费）

1. 登录 [vercel.com](https://vercel.com)，Import 本仓库
2. 在 Vercel Project Settings → Environment Variables 设置以下变量：

| 变量名 | 说明 |
|---|---|
| `BAILIAN_APP_ID_EXP` | 体验导向AI（星程）的 APP ID |
| `BAILIAN_API_KEY_EXP` | 体验导向AI 的 API Key |
| `BAILIAN_APP_ID_UTIL` | 功利导向AI 的 APP ID |
| `BAILIAN_API_KEY_UTIL` | 功利导向AI 的 API Key |
| `FEISHU_APP_ID` | 飞书自建应用 App ID |
| `FEISHU_APP_SECRET` | 飞书自建应用 App Secret |
| `FEISHU_SHEET_TOKEN` | 飞书表格 Token |

3. Deploy → 获得 API 地址如 `https://paper-experiment-h5.vercel.app/api/`
4. 修改 `public/assets/api.js` 中的 `BASE` 指向你的 Vercel API 地址

### Step 3：创建飞书表格

1. 新建飞书表格，命名如「论文实验数据」
2. 创建3个 Sheet：
   - `participants`（字段参考 `docs/feishu-schema.md`）
   - `chat_logs`
   - `survey_responses`
3. 将表格 Token（URL 中 `/sheets/` 到 `/` 之间的字符）填入 `FEISHU_SHEET_TOKEN`
4. 在飞书自建应用管理后台，开通「获取与更新电子表格内容」权限

## 🔧 本地开发

```bash
# H5前端（mock模式，无需配置任何凭证）
cd public && python3 -m http.server 8000
# 访问 http://localhost:8000

# API本地调试（需要配置.env）
vercel dev
```

## 📊 数据流程

1. 每条对话消息 → `/api/log-message` → 实时写入飞书 `chat_logs` 表
2. 完成后所有数据 → `/api/submit-survey` → 写入飞书 `participants` + `survey_responses` 表
3. `thanks.html` 显示任务码，用户凭此码在 Credamo 兑换奖励

## ⚠️ 重要说明

- 支付意愿滑块范围：**¥0 - ¥30**
- 对话结束条件：最少 **5轮** 用户消息后可点「完成对话」
- 被试ID 由前端 UUID 生成，无需收集任何个人信息

## 📝 License

仅供学术研究使用 © 2026
