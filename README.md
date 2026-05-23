# Paper Experiment H5

## 📖 项目简介

毕业论文实验配套 H5：**AI交互风格 × 服务场景 对用户支付意愿的影响**

- **设计**：2(场景，被试间) × 2(AI风格，被试内) 混合实验
- **场景**：体验式（家庭度假）/ 功利式（商务出差）
- **AI风格**：体验导向AI（星程）/ 功利导向AI（出行助手）

## 🏗️ 技术栈

- **前端**：纯 HTML5 + Vanilla JS + TailwindCSS（移动端优先）
- **后端**：Vercel Serverless Functions
- **AI**：阿里云百炼（Bailian）API
- **数据**：飞书表格 API
- **部署**：GitHub Pages（H5）+ Vercel（API代理）

## 📁 项目结构

```
paper-experiment-h5/
├── public/                      # H5 静态页面（部署到 GitHub Pages）
│   ├── index.html              # 入口 / 欢迎页
│   ├── consent.html            # 知情同意
│   ├── demographics.html       # 人口学信息
│   ├── scenario.html           # 场景启动
│   ├── scenario-mc.html        # 场景操控检验
│   ├── chat.html               # 对话核心页 ⭐
│   ├── survey.html             # AI评价量表
│   ├── thanks.html             # 致谢
│   └── assets/                 # CSS/JS/图片
│       ├── style.css
│       ├── state.js            # 全局状态管理
│       ├── api.js              # API 调用封装
│       └── survey-data.js      # 量表题目配置
├── api/                         # Vercel Serverless Functions
│   ├── chat.js                 # 百炼对话代理
│   ├── log-message.js          # 实时记录对话
│   └── submit-survey.js        # 提交量表 → 飞书
├── docs/                        # 文档
│   ├── flow.md                 # 实验流程图
│   ├── feishu-schema.md        # 飞书表格结构
│   └── deployment.md           # 部署说明
└── vercel.json                  # Vercel 配置
```

## 🚀 实验流程

```
欢迎页 → 知情同意 → 人口学信息
   ↓
随机分配【场景】（体验式 OR 功利式）
   ↓
场景启动（5秒倒计时）→ 场景操控检验
   ↓
随机【AI顺序】（A→B OR B→A）
   ┌─ AI助手1 真实对话（≥5轮）→ 量表
   └─ AI助手2 真实对话（≥5轮）→ 量表
   ↓
致谢 + 任务码
```

## 🔑 必需的环境变量

部署到 Vercel 时配置：

```
BAILIAN_APP_ID_EXP      # 体验导向AI APP ID
BAILIAN_API_KEY_EXP     # 体验导向AI API KEY
BAILIAN_APP_ID_UTIL     # 功利导向AI APP ID
BAILIAN_API_KEY_UTIL    # 功利导向AI API KEY
FEISHU_APP_ID           # 飞书自建应用
FEISHU_APP_SECRET       # 飞书自建应用密钥
FEISHU_SHEET_TOKEN      # 飞书表格 token
```

## 📊 数据收集

3 张飞书表格：
1. **被试信息表** — 人口学 + 分组 + 完成状态
2. **对话日志表** — 每轮消息实时落表
3. **量表答案表** — 所有量表答题数据

详见 `docs/feishu-schema.md`

## 🛠️ 本地开发

```bash
# 启动本地静态服务器（任选其一）
cd public && python3 -m http.server 8000
# 或
npx serve public

# Vercel CLI 本地调试 API
npm i -g vercel
vercel dev
```

## 📝 License

仅供学术研究使用 © 2026
