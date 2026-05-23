// Cloudflare Worker - 统一入口，按路径分发
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResp(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// 获取飞书 tenant token
async function getFeishuToken(appId, appSecret) {
  console.log('[Feishu] Getting token with appId:', appId);
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const data = await res.json();
  console.log('[Feishu] Token response:', JSON.stringify(data));
  if (data.code !== undefined && data.code !== 0) {
    throw new Error('Feishu token error: ' + data.msg);
  }
  return data.tenant_access_token;
}

// 写飞书表格
async function writeFeishu(token, sheetToken, sheetId, range, values) {
  console.log('[Feishu] Writing to sheet:', sheetToken, sheetId, range);
  const res = await fetch('https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/' + sheetToken + '/values', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ valueRange: { range: sheetId + '!' + range, values: [values] } })
  });
  const data = await res.json();
  console.log('[Feishu] Write result:', JSON.stringify(data));
  if (data.code !== 0) throw new Error('Write failed: ' + data.msg);
}

// ====== chat ======
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
  console.log('[Bailian] Calling app:', appId, 'history len:', history.length);

  try {
    const r = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/' + appId + '/completion', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt: history }, parameters: { stream: false, temperature: aiType === 'exp' ? 0.9 : 0.3, max_tokens: 800 } })
    });
    const d = await r.json();
    if (!r.ok) return jsonResp(502, { error: d.error?.message || 'Bailian error', detail: d });
    const reply = d.output?.text || d.output?.content || '抱歉，暂时无法回复。';
    return jsonResp(200, { message: reply });
  } catch (e) {
    console.error('[Bailian] Error:', e);
    return jsonResp(500, { error: e.message });
  }
}

// ====== log-message ======
async function handleLogMessage(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResp(400, { error: 'Invalid JSON' }); }

  const { subjectId, aiType, turn, role, content, responseTimeMs } = body;
  console.log('[LogMessage] Received:', { subjectId, aiType, turn, role, content: String(content).slice(0,50) });
  
  if (!subjectId || !aiType) return jsonResp(400, { error: '缺少参数' });

  try {
    const token = await getFeishuToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    console.log('[LogMessage] Token obtained, writing...');
    const logId = 'LOG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await writeFeishu(token, env.FEISHU_SHEET_TOKEN, env.FEISHU_SHEET_CHAT_LOGS, 'A:H', 
      [logId, subjectId, aiType, turn, role, String(content || '').slice(0, 2000), new Date().toISOString(), responseTimeMs || '']);
    console.log('[LogMessage] Write success');
    return jsonResp(200, { ok: true });
  } catch (e) {
    console.error('[LogMessage] Error:', e);
    return jsonResp(500, { error: e.message, stack: e.stack });
  }
}

// ====== submit-survey ======
async function handleSubmitSurvey(request, env) {
  const p = await request.json();
  const { subject_id, start_time, finish_time, gender, age_group, ai_usage_freq, scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util } = p;
  const taskCode = 'TASK_' + Math.random().toString(36).slice(2, 8).toUpperCase();

  try {
    const token = await getFeishuToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
    const ts = new Date().toISOString();
    const sr = survey_exp || {};
    const su = survey_util || {};
    const sc = scenario_mc || {};
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
      writeFeishu(token, env.FEISHU_SHEET_TOKEN, env.FEISHU_SHEET_PARTICIPANTS, 'A:K', pRow),
      writeFeishu(token, env.FEISHU_SHEET_TOKEN, env.FEISHU_SHEET_SURVEY_RESPONSES, 'A:AN', sRow)
    ]);
    return jsonResp(200, { ok: true, taskCode });
  } catch (e) {
    console.error('[SubmitSurvey] Error:', e);
    return jsonResp(500, { error: e.message });
  }
}

// ====== Main Fetch ======
export default {
  async fetch(request, env, ctx) {
    console.log('[Worker] Request:', request.method, request.url);
    if (request.method === 'OPTIONS') return new Response('', { headers: CORS });
    const path = new URL(request.url).pathname;
    console.log('[Worker] Path:', path);
    if (path.endsWith('/chat')) return handleChat(request, env);
    if (path.endsWith('/log-message')) return handleLogMessage(request, env);
    if (path.endsWith('/submit-survey')) return handleSubmitSurvey(request, env);
    return jsonResp(404, { error: 'Not Found: ' + path });
  }
};
