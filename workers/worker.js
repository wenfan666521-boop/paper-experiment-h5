// Cloudflare Worker - 统一入口，按路径分发
// 路由: young-sunset-ca8f.wenfan666521.workers.dev/chat|log-message|submit-survey

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ============ 百炼应用级 API 调用 ============
async function bailianChat(appId, apiKey, history, temperature) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/' + appId + '/completion', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { prompt: history },
      parameters: { stream: false, temperature: temperature, max_tokens: 800 }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Bailian API error');
  return data.output?.text || data.output?.content || '抱歉，暂时无法回复。';
}

// ============ 飞书写入 ============
async function writeToFeishusheet(token, sheetId, range, values, accessToken) {
  await fetch('https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/' + token + '/values', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ valueRange: { range: sheetId + '!' + range, values: [values] } })
  });
}

async function getFeishuToken(appId, appSecret) {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const data = await res.json();
  return data.tenant_access_token;
}

// ============ Chat Handler ============
async function handleChat(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResp(400, { error: 'Invalid JSON' }); }
  
  const { aiType, messages } = body;
  if (!aiType || !messages) return jsonResp(400, { error: '缺少 aiType 或 messages' });

  const appId = aiType === 'exp' ? env.BAILIAN_APP_ID_EXP : env.BAILIAN_APP_ID_UTIL;
  const apiKey = aiType === 'exp' ? env.BAILIAN_API_KEY_EXP : env.BAILIAN_API_KEY_UTIL;
  if (!appId || !apiKey) return jsonResp(500, { error: 'credentials not configured' });

  const history = messages.slice(-20).map(m => m.content).join('\n');
  const temperature = aiType === 'exp' ? 0.9 : 0.3;

  try {
    const reply = await bailianChat(appId, apiKey, history, temperature);
    return jsonResp(200, { message: reply });
  } catch (e) {
    return jsonResp(500, { error: e.message });
  }
}

// ============ Log Message Handler ============
async function handleLogMessage(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResp(400, { error: 'Invalid JSON' }); }

  const { subjectId, aiType, turn, role, content, responseTimeMs } = body;
  if (!subjectId || !aiType) return jsonResp(400, { error: '缺少参数' });

  try {
    const token = await getFeishuToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    if (!token) return jsonResp(500, { error: 'token failed' });

    const logId = 'LOG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const logTime = new Date().toISOString();
    await writeToFeishusheet(env.FEISHU_SHEET_TOKEN, env.FEISHU_SHEET_CHAT_LOGS, 'A:H', 
      [logId, subjectId, aiType, turn, role, String(content || '').slice(0, 2000), logTime, responseTimeMs || ''], token);
    return jsonResp(200, { ok: true });
  } catch (e) { return jsonResp(500, { error: e.message }); }
}

// ============ Submit Survey Handler ============
async function handleSubmitSurvey(request, env) {
  const p = await request.json();
  const { subject_id, start_time, finish_time, gender, age_group, ai_usage_freq, scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util } = p;
  const taskCode = 'TASK_' + Math.random().toString(36).slice(2, 8).toUpperCase();

  try {
    const token = await getFeishuToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    if (!token) return jsonResp(500, { error: 'token failed' });

    const ts = new Date().toISOString();
    const sr = survey_exp || {};
    const su = survey_util || {};
    const sc = scenario_mc || {};

    // participants 表：11列 A:K
    const pRow = [subject_id || '', start_time || ts, finish_time || ts, gender || '', age_group || '', ai_usage_freq || '', scenario || '', ai_order || '', 'completed', user_agent || '', taskCode];

    // survey_responses 表：39列 A:AN
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

    const st = env.FEISHU_SHEET_TOKEN;
    await Promise.all([
      writeToFeishusheet(st, env.FEISHU_SHEET_PARTICIPANTS, 'A:K', pRow, token),
      writeToFeishusheet(st, env.FEISHU_SHEET_SURVEY_RESPONSES, 'A:AN', sRow, token)
    ]);
    return jsonResp(200, { ok: true, taskCode });
  } catch (e) { return jsonResp(500, { error: e.message }); }
}

function jsonResp(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response('', { headers: CORS });
    const path = new URL(request.url).pathname;
    if (path.endsWith('/chat')) return handleChat(request, env);
    if (path.endsWith('/log-message')) return handleLogMessage(request, env);
    if (path.endsWith('/submit-survey')) return handleSubmitSurvey(request, env);
    return jsonResp(404, { error: 'Not Found: ' + path });
  }
};
