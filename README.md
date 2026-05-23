# Paper Experiment H5

## 论文实验配套H5 | AI交互风格 × 服务场景 | 2×2混合设计

**部署方案**：Cloudflare Workers（API）+ Cloudflare Pages（H5）

---

## 技术架构

```
Cloudflare Pages（H5页面）
    ↓
Cloudflare Workers（统一入口，按路由分发）
    ↓
百炼AI（体验/功利两套）+ 飞书表格（数据存储）
```

---

## 项目结构

```
├── public/                   # H5 页面（→ Cloudflare Pages）
│   ├── index.html           # 入口
│   ├── consent.html         # 知情同意
│   ├── demographics.html     # 人口学信息
│   ├── scenario.html        # 场景启动（10秒阅读）
│   ├── scenario-mc.html     # 场景操控检验
│   ├── chat.html            # 对话核心页（≥5轮）
│   ├── survey.html           # 量表评价
│   ├── thanks.html          # 致谢+任务码
│   └── assets/
│       ├── api.js           # API调用（改BASE指向你的Workers URL）
│       ├── state.js        # 全局状态
│       ├── scenarios.js    # 场景材料
│       ├── survey-data.js   # 量表配置
│       └── style.css
├── workers/
│   └── [chat].js           # Cloudflare Worker（统一入口）
└── docs/
    ├── cloudflare-deploy.md # Cloudflare部署详细指南
    ├── feishu-schema.md     # 飞书表格结构
    └── flow.md              # 实验流程图
```

---

## 实验流程

```
欢迎页 → 知情同意 → 人口学信息
    ↓
随机分配【场景】（体验式 OR 功利式）
    ↓
场景启动（10秒强制阅读）→ 场景操控检验（3题）
    ↓
随机【AI顺序】（A先B后 OR B先A后）
    ┌─ AI助手1 对话（≥5轮）→ 量表评价
    └─ AI助手2 对话（≥5轮）→ 量表评价
    ↓
致谢 + 任务码
```

---

## 部署指南

详见 `docs/cloudflare-deploy.md`

### 快速步骤

**Workers（API）**：
1. Cloudflare Dashboard → Workers & Pages → Create Worker
2. 上传 `workers/[chat].js` 代码
3. Settings → Variables 添加所有环境变量
4. Triggers → Routes 绑定：`api.aowuaowu2026.xyz`（或你的域名）

**Pages（H5）**：
1. Workers & Pages → Create application → Pages → Connect to Git
2. 选择本仓库，Output directory: `public`
3. 添加自定义域名（如 `paper.aowuaowu2026.xyz`）

---

## 环境变量（Workers）

| 变量名 | 值 |
|---|---|
| `BAILIAN_APP_ID_EXP` | `467708a331474605b5d30d999417edd0` |
| `BAILIAN_API_KEY_EXP` | `sk-41e…c482` |
| `BAILIAN_APP_ID_UTIL` | `7f59b8a020ff4311a376f0a685f1024d` |
| `BAILIAN_API_KEY_UTIL` | `sk-41e…c482` |
| `FEISHU_APP_ID` | `cli_a92b1db5a7f89bc4` |
| `FEISHU_APP_SECRET` | （飞书开发者后台获取） |
| `FEISHU_SHEET_TOKEN` | `LkoJsvZ0Ohxl6ctvDkFcEU0YnCh` |

---

## 飞书表格

**Token**: `LkoJsvZ0Ohxl6ctvDkFcEU0YnCh`
**地址**: https://xcn6gvimkp72.feishu.cn/sheets/LkoJsvZ0Ohxl6ctvDkFcEU0YnCh

包含3个Sheet：participants（11列）/ chat_logs（8列）/ survey_responses（39列）

---

## License

仅供学术研究使用 © 2026
