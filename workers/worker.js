// Cloudflare Worker - 统一入口，按路径分发
// 绑定路由: api.aowuaowu2026.xyz/* → 这个Worker

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

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

  const history = messages.slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  try {
    const r = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-turbo',
        appid: appId,
        messages: history,
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
    if (request.method === 'OPTIONS') {
      return new Response('', { headers: CORS });
    }
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith('/chat')) return handleChat(request, env);
    if (path.endsWith('/log-message')) return handleLogMessage(request, env);
    if (path.endsWith('/submit-survey')) return handleSubmitSurvey(request, env);

    return new Response('Not Found: ' + path, { status: 404, headers: { ...CORS, 'Content-Type': 'text/plain' } });
  }
};
