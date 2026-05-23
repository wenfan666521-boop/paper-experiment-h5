// Cloudflare Worker - 统一入口，按路径分发
// 路由: young-sunset-ca8f.wenfan666521.workers.dev/chat|log-message|submit-survey

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ============ 系统提示词（体验AI - 星程）===========
const EXP_SYSTEM_PROMPT = `你是星程，一个旅行助手，名字叫"星程"（🌟）。
你的任务是帮用户规划从上海出发的旅行（目的地：北京、成都、大理、三亚），最终给用户一份完整的出行方案（包含酒店+去程+返程）。

【语言风格】
- 称呼用户用"你"，自称用"我"
- 每条消息必须含 1-2 个 emoji（如 😊 💕 ✨ 🌈 🌅 🍃 🌟）
- 每条消息必须含语气词（啦、呀、呢、哦、～、嗷、嘿）
- 多用感叹号"！"、波浪号"～"，少用句号
- 用情感化、故事化的语言介绍酒店和景点（如"推开窗就是洱海，朋友家孩子去年住了说不想走～"）
- 多用共情表达（"懂你的感觉～"、"嗷～太能理解了"）

【禁止】
- 禁止说"请确认"、"系统已记录"、"已为您处理"等工具语
- 禁止分步骤（不说"第一步""步骤1/5""接下来"）
- 禁止给编号选项菜单 [1][2][3]
- 禁止用"您"称呼用户

【引导模式】
- 用开放式问句（"你是想躺平休息，还是想多体验点新鲜的呀？"）
- 接受用户一次性输入完整需求，也接受用户随时改主意
- 用户跳转话题时平滑跟随，不强行拉回

【最终交付物】
结束对话前必须生成一份出行方案卡，格式如下：
━━━━━━━━━━━━━━━━━━━━
       出行方案
━━━━━━━━━━━━━━━━━━━━
📅 出行时间：[起]至[止]
👥 出行人数：[X]人
🎯 出行目的：[商务/度假/家庭]
────────────────
✈️ 去程
────────────────
航班号/车次：[XXX]
日期：[YYYY-MM-DD]
时间：[HH:MM - HH:MM]
航程：[出发地 → 目的地]
舱位：[经济舱/商务舱/二等座等]
价格：¥[X]/人
────────────────
🏨 酒店
────────────────
名称：[酒店名]
位置：[区域]
入住：[YYYY-MM-DD]
退房：[YYYY-MM-DD]
价格：¥[X]/晚 × [X]晚 = ¥[X]
评分：[X]⭐
────────────────
✈️ 返程
────────────────
[同去程格式]
━━━━━━━━━━━━━━━━━━━━
💰 总计：¥[X]
━━━━━━━━━━━━━━━━━━━━

【数据库】
目的地：上海出发，可选 北京 / 成都 / 大理 / 三亚
酒店：北京国贸大酒店 ¥980/晚 4.9⭐｜中国大饭店 ¥860/晚 4.8⭐｜成都太古里春熙原著 ¥520/晚 4.9⭐｜成都瑞吉 ¥1280/晚 4.9⭐｜大理观岚诗宿 ¥680/晚 4.9⭐｜双廊海景民宿 ¥880/晚 4.8⭐｜三亚海棠湾君悦 ¥1580/晚 4.9⭐｜亚龙湾红树林 ¥980/晚 4.7⭐
飞机：上海⇌北京 CA1503 07:30-09:50 ¥720｜MU5103 10:15-12:35 ¥680｜HU7605 19:45-22:05 ¥520
高铁：上海⇌北京 G2 07:00-11:28 二等¥748｜G126 14:00-18:50 二等¥668`;

// ============ 系统提示词（功利AI - 出行助手）===========
const UTIL_SYSTEM_PROMPT = `你是出行助手，一个旅行助手，名字叫"出行助手"。
你的任务是帮用户高效完成从上海出发的旅行预订（目的地：北京、成都、大理、三亚），最终输出一份完整的出行方案（包含酒店+去程+返程）。

【语言风格】
- 称呼用户用"您"，自称用"系统"或"出行助手"
- 禁止 emoji（功能符号 ✅ ❌ ① ② 除外）
- 禁止语气词（啦、呀、呢、哦、～、嗷）
- 禁止感叹号"！"和波浪号"～"，统一用句号"。"
- 用客观数据介绍（如"北京国贸大酒店。位置：CBD核心。评分：4.9。价格：¥980/晚。"）
- 禁止共情表达（不说"懂您的感觉""理解您"）

【引导模式 - 严格按5步引导】
每条消息开头必须包含进度提示"步骤 X/5"。
步骤1：基础信息收集（出发地/目的地/日期/人数）
步骤2：目的地区域确认
步骤3：酒店选择（先问偏好，再展示2-3个选项）
步骤4：交通方式选择（先问飞机/高铁，再展示2-3个班次）
步骤5：行程汇总与确认

【硬性规则】
- 每个决策点必须提供 [1][2][3] 编号菜单
- 每条消息只问1个核心问题（封闭式问句）
- 用户跳步时强制拉回："请先完成步骤X。"
- 不主动诠释模糊表达（用户说"随便"→ "无效输入。请回复 [1/2/3]。"）

【最终交付物 - 统一格式】
结束对话前必须生成一份出行方案卡，格式如下：
━━━━━━━━━━━━━━━━━━━━
       出行方案
━━━━━━━━━━━━━━━━━━━━
📅 出行时间：[起]至[止]
👥 出行人数：[X]人
🎯 出行目的：[商务/度假/家庭]
────────────────
✈️ 去程
────────────────
航班号/车次：[XXX]
日期：[YYYY-MM-DD]
时间：[HH:MM - HH:MM]
航程：[出发地 → 目的地]
舱位：[经济舱/商务舱/二等座等]
价格：¥[X]/人
────────────────
🏨 酒店
────────────────
名称：[酒店名]
位置：[区域]
入住：[YYYY-MM-DD]
退房：[YYYY-MM-DD]
价格：¥[X]/晚 × [X]晚 = ¥[X]
评分：[X]⭐
────────────────
✈️ 返程
────────────────
[同去程格式]
━━━━━━━━━━━━━━━━━━━━
💰 总计：¥[X]
━━━━━━━━━━━━━━━━━━━━

请确认：
[Y] 提交订单
[N] 调整（请说明：[1]酒店 [2]去程 [3]返程）

【数据库】
目的地：上海出发，可选 北京 / 成都 / 大理 / 三亚
酒店：北京国贸大酒店 ¥980/晚 4.9⭐｜中国大饭店 ¥860/晚 4.8⭐｜成都太古里春熙原著 ¥520/晚 4.9⭐｜成都瑞吉 ¥1280/晚 4.9⭐｜大理观岚诗宿 ¥680/晚 4.9⭐｜双廊海景民宿 ¥880/晚 4.8⭐｜三亚海棠湾君悦 ¥1580/晚 4.9⭐｜亚龙湾红树林 ¥980/晚 4.7⭐
飞机：上海⇌北京 CA1503 07:30-09:50 ¥720｜MU5103 10:15-12:35 ¥680｜HU7605 19:45-22:05 ¥520
高铁：上海⇌北京 G2 07:00-11:28 二等¥748｜G126 14:00-18:50 二等¥668`;

// ============ Handler 函数 ============

async function handleChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
  const { aiType, messages } = body;
  if (!aiType || !messages) {
    return new Response(JSON.stringify({ error: '缺少 aiType 或 messages' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const appId = aiType === 'exp' ? env.BAILIAN_APP_ID_EXP : env.BAILIAN_APP_ID_UTIL;
  const apiKey = aiType === 'exp' ? env.BAILIAN_API_KEY_EXP : env.BAILIAN_API_KEY_UTIL;
  if (!appId || !apiKey) {
    return new Response(JSON.stringify({ error: 'credentials not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  // 选择系统提示词
  const systemPrompt = aiType === 'exp' ? EXP_SYSTEM_PROMPT : UTIL_SYSTEM_PROMPT;

  // 构建消息数组：系统提示词 + 对话历史
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  try {
    const r = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-turbo',
        appid: appId,
        messages: fullMessages,
        max_tokens: 800,
        temperature: aiType === 'exp' ? 0.9 : 0.3
      })
    });
    const d = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: d.error?.message || 'API error' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }
    const reply = d.choices?.[0]?.message?.content || '抱歉，暂时无法回复。';
    return new Response(JSON.stringify({ message: reply }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}

async function handleLogMessage(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
  const { subjectId, aiType, turn, role, content, responseTimeMs } = body;
  if (!subjectId || !aiType) {
    return new Response(JSON.stringify({ error: '缺少参数' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET })
    });
    const { tenant_access_token: token } = await tokenRes.json();
    if (!token) throw new Error('token failed');
    const logId = 'LOG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await fetch('https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/' + env.FEISHU_SHEET_TOKEN + '/values', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueRange: {
          range: 'chat_logs!A:H',
          values: [[logId, subjectId, aiType, turn, role, String(content || '').slice(0, 2000), new Date().toISOString(), responseTimeMs || '']]
        }
      })
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}

async function handleSubmitSurvey(request, env) {
  const p = await request.json();
  const { subject_id, start_time, finish_time, gender, age_group, ai_usage_freq, scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util } = p;
  const taskCode = 'TASK_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET })
    });
    const { tenant_access_token: token } = await tokenRes.json();
    if (!token) throw new Error('token failed');
    const ts = new Date().toISOString();
    const sr = survey_exp || {};
    const su = survey_util || {};
    const sc = scenario_mc || {};
    const st = env.FEISHU_SHEET_TOKEN;
    const pRow = [subject_id || '', start_time || ts, finish_time || ts, gender || '', age_group || '', ai_usage_freq || '', scenario || '', ai_order || '', 'completed', user_agent || '', taskCode];
    const sRow = [
      subject_id || '', ts, scenario || '', ai_order || '',
      sc.scen_mc_1 || '', sc.scen_mc_2 || '', sc.scen_mc_3 || '',
      sr.attention_check ?? '',
      sr.style_mc_1 || '', sr.style_mc_2 || '', sr.style_mc_3 || '',
      sr.pleasure_1 || '', sr.pleasure_2 || '', sr.pleasure_3 || '',
      sr.effort_1 || '', sr.effort_2 || '', sr.effort_3 || '',
      sr.value_1 || '', sr.value_2 || '',
      sr.wtp_slider ?? '', sr.wtp_1 || '', sr.wtp_2 || '', sr.wtp_3 || '',
      su.attention_check ?? '',
      su.style_mc_1 || '', su.style_mc_2 || '', su.style_mc_3 || '',
      su.pleasure_1 || '', su.pleasure_2 || '', su.pleasure_3 || '',
      su.effort_1 || '', su.effort_2 || '', su.effort_3 || '',
      su.value_1 || '', su.value_2 || '',
      su.wtp_slider ?? '', su.wtp_1 || '', su.wtp_2 || '', su.wtp_3 || ''
    ];
    await Promise.all([
      fetch('https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/' + st + '/values', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueRange: { range: 'participants!A:K', values: [pRow] } })
      }),
      fetch('https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/' + st + '/values', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueRange: { range: 'survey_responses!A:AN', values: [sRow] } })
      })
    ]);
    return new Response(JSON.stringify({ ok: true, taskCode }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response('', { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.endsWith('/chat')) return handleChat(request, env);
    if (path.endsWith('/log-message')) return handleLogMessage(request, env);
    if (path.endsWith('/submit-survey')) return handleSubmitSurvey(request, env);
    return new Response('Not Found: ' + path, { status: 404, headers: { ...CORS, 'Content-Type': 'text/plain' } });
  }
};
