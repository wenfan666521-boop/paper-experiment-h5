# 飞书表格结构设计

> 沿用 wenfan666521-boop 之前的飞书表格工作流。
> 推荐**新建独立表格**（避免与摸鱼模拟器/成就系统混淆），分3个 sheet。

---

## 📊 Sheet 1：被试信息表（participants）

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `subject_id` | 文本 | 被试唯一ID（前端生成 UUID） | `P_20260524_a1b2c3` |
| `start_time` | 时间 | 开始实验时间 | 2026-05-24 14:23:01 |
| `finish_time` | 时间 | 完成实验时间（可空） | 2026-05-24 14:51:33 |
| `gender` | 文本 | 性别 | 男/女 |
| `age_group` | 文本 | 年龄段 | 21-30岁 |
| `ai_usage_freq` | 数字 | AI使用频率（Q3, 1-7） | 5 |
| `scenario` | 文本 | 场景分组 | exp / util |
| `ai_order` | 文本 | AI体验顺序 | exp_first / util_first |
| `status` | 文本 | 完成状态 | completed / partial / dropout |
| `user_agent` | 文本 | 设备信息 | iPhone 14 / Chrome ... |
| `task_code` | 文本 | 任务码（用于Credamo发奖励） | TASK_X9K2M |

---

## 💬 Sheet 2：对话日志表（chat_logs）

> 每条消息一行，实时落表。即使被试中途退出也有数据。

| 字段 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `log_id` | 文本 | 日志ID（自动） | `LOG_xxx` |
| `subject_id` | 文本 | 关联被试ID | `P_20260524_a1b2c3` |
| `ai_type` | 文本 | 当前AI类型 | exp / util |
| `turn` | 数字 | 当前对话轮次 | 1, 2, 3... |
| `role` | 文本 | 消息角色 | user / assistant |
| `content` | 长文本 | 消息内容 | "我想去大理玩3天..." |
| `timestamp` | 时间 | 消息时间 | 2026-05-24 14:25:33 |
| `response_time_ms` | 数字 | AI响应耗时（毫秒，仅role=assistant） | 1820 |

---

## 📝 Sheet 3：量表答案表（survey_responses）

> 一个被试一行，包含所有量表答题。

### 基础字段

| 字段 | 说明 |
|---|---|
| `subject_id` | 关联被试ID |
| `submit_time` | 提交时间 |
| `scenario` | 场景分组（冗余字段方便SPSS分析） |
| `ai_order` | AI顺序 |

### 场景操控检验（3题，1-7量表）

| 字段 | 题目 |
|---|---|
| `scen_mc_1` | 您觉得获取服务最关注的是（体验探索1 ←→ 结果效率7） |
| `scen_mc_2` | 您觉得获取服务的目的是（放松享受1 ←→ 高效完成7） |
| `scen_mc_3` | 您觉得场景更倾向于（体验式1 ←→ 功利式7） |

### 体验导向AI部分（前缀 `exp_*`）

#### 注意力检查（1题）
| 字段 | 题目 |
|---|---|
| `exp_attention_check` | 当前AI是否发送了图片/表情？（1=有, 0=无）|

#### AI风格操控检验（3题，1-7量表）
| 字段 | 题目 |
|---|---|
| `exp_style_mc_1` | 像真人聊天1 ←→ 像使用工具7 |
| `exp_style_mc_2` | 友好健谈1 ←→ 冷静高效7 |
| `exp_style_mc_3` | 沟通开放自由1 ←→ 沟通目的性强7 |

#### 乐趣感知（3题，1-7）
| 字段 | 题目 |
|---|---|
| `exp_pleasure_1` | 参与过程令人愉悦 |
| `exp_pleasure_2` | 交互过程充满娱乐性 |
| `exp_pleasure_3` | 参与过程充满乐趣 |

#### 努力感知（3题，1-7，反向计分时注意）
| 字段 | 题目 |
|---|---|
| `exp_effort_1` | 交互过程较为复杂 |
| `exp_effort_2` | 需要我投入不少努力 |
| `exp_effort_3` | 会消耗我的时间和精力 |

#### 感知价值（2题，1-7）
| 字段 | 题目 |
|---|---|
| `exp_value_1` | 为出行规划带来显著价值提升 |
| `exp_value_2` | 实用价值远超使用成本 |

#### 支付意愿（4题，1-7 + 1题滑块）
| 字段 | 题目 |
|---|---|
| `exp_wtp_slider` | 愿意为此AI服务花费多少钱（滑块，¥0-X）|
| `exp_wtp_1` | 愿意为此AI服务多花钱 |
| `exp_wtp_2` | 多支付25%费用是可以接受的 |
| `exp_wtp_3` | 额外加价购买是合理的 |

### 功利导向AI部分（前缀 `util_*`，字段名同上）

| 字段 |
|---|
| `util_attention_check` |
| `util_style_mc_1` ~ `util_style_mc_3` |
| `util_pleasure_1` ~ `util_pleasure_3` |
| `util_effort_1` ~ `util_effort_3` |
| `util_value_1` ~ `util_value_2` |
| `util_wtp_slider` |
| `util_wtp_1` ~ `util_wtp_3` |

---

## 🔑 飞书API权限要求

自建应用需开启以下权限：
- `sheets:spreadsheet:readonly`（读表元数据）
- `sheets:spreadsheet`（写入数据）

API 调用方式参考之前的成就系统工作流。

---

## 📈 SPSS / R 分析准备

导出CSV后字段命名规则便于直接：
- 反向计分：`util_effort_*` → 反向（如需要）
- 因子合成：均值聚合 pleasure/effort/value/wtp 各构念
- 配对比较：被试内 `exp_xxx` vs `util_xxx`
- 场景调节：按 `scenario` 分组分析

---

## ⚠️ 数据隐私

- 不收集姓名/手机号/身份证号
- 仅保留 `subject_id`（UUID，无关联个人）
- 完成后 task_code 用于 Credamo 平台兑换奖励
