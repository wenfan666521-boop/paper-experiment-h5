// Cloudflare Worker - 统一入口，按路径分发
// 数据存储：Cloudflare Workers KV
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResp(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// CSV BOM 标记，解决 Excel 中文乱码
const CSV_BOM = '\uFEFF';

// ========== 百炼应用级 API（支持多轮对话 + SSE流式） ==========
async function* bailianChatStream(appId, apiKey, messages, temperature) {
  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));
  const r = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/' + appId + '/completion', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable'
    },
    body: JSON.stringify({
      input: { messages: history },
      parameters: { temperature, max_tokens: 800, stream: true }
    })
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error?.message || 'Bailian API error: ' + r.status);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  try {
    while (true) {
      const { done, chunk } = await reader.read();
      if (done) break;
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.output?.text || parsed.output?.content || '';
              if (text) {
                fullText += text;
                yield text;
              }
            } catch (_) {}
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (!fullText) throw new Error('Empty response from Bailian');
  return fullText;
}

// 非流式版本（备用）
async function bailianChat(appId, apiKey, messages, temperature) {
  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));
  const r = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/' + appId + '/completion', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { messages: history },
      parameters: { temperature, max_tokens: 800 }
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'Bailian API error');
  return d.output?.text || d.output?.content || '抱歉，暂时无法回复。';
}

// ========== Chat ==========
async function handleChat(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResp(400, { error: 'Invalid JSON' }); }
  
  const { aiType, messages } = body;
  if (!aiType || !messages) return jsonResp(400, { error: '缺少 aiType 或 messages' });

  const appId = aiType === 'exp' ? env.BAILIAN_APP_ID_EXP : env.BAILIAN_APP_ID_UTIL;
  const apiKey = aiType === 'exp' ? env.BAILIAN_API_KEY_EXP : env.BAILIAN_API_KEY_UTIL;
  if (!appId || !apiKey) return jsonResp(500, { error: 'credentials not configured' });

  const history = messages.slice(-20);
  try {
    const reply = await bailianChat(appId, apiKey, history, aiType === 'exp' ? 0.9 : 0.3);
    return jsonResp(200, { message: reply });
  } catch (e) {
    return jsonResp(500, { error: e.message });
  }
}

// ========== Log Message → KV ==========
async function handleLogMessage(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResp(400, { error: 'Invalid JSON' }); }

  const { subjectId, aiType, turn, role, content, responseTimeMs } = body;
  if (!subjectId || !aiType) return jsonResp(400, { error: '缺少参数' });

  try {
    const kv = env.DATA_KV;
    const key = 'chat:' + subjectId;
    const logEntry = {
      logId: 'LOG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      subjectId, aiType, turn, role,
      content: String(content || '').slice(0, 2000),
      logTime: new Date().toISOString(),
      responseTimeMs: responseTimeMs || null
    };
    
    // 读取现有日志数组，追加新条目
    const existing = await kv.get(key, 'json') || [];
    existing.push(logEntry);
    await kv.put(key, JSON.stringify(existing));
    
    return jsonResp(200, { ok: true });
  } catch (e) {
    return jsonResp(500, { error: e.message });
  }
}

// ========== Submit Survey → KV ==========
async function handleSubmitSurvey(request, env) {
  const p = await request.json();
  const {
    subject_id, start_time, finish_time, gender, age_group, ai_usage_freq,
    scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util
  } = p;

  const taskCode = 'TASK_' + Math.random().toString(36).slice(2, 8).toUpperCase();

  try {
    const kv = env.DATA_KV;
    
    // 写入 participants
    const participantKey = 'participant:' + subject_id;
    await kv.put(participantKey, JSON.stringify({
      subject_id, start_time, finish_time, gender, age_group, ai_usage_freq,
      scenario, ai_order, status: 'completed', user_agent, taskCode,
      submittedAt: new Date().toISOString()
    }));

    // 写入 survey_responses
    const surveyKey = 'survey:' + subject_id;
    await kv.put(surveyKey, JSON.stringify({
      subject_id, scenario, ai_order, scenario_mc, survey_exp, survey_util,
      submittedAt: new Date().toISOString()
    }));

    // 记录 subject_id 到列表（方便后续批量导出）
    const listKey = 'subjects';
    const subjects = await kv.get(listKey, 'json') || [];
    if (!subjects.includes(subject_id)) {
      subjects.push(subject_id);
      await kv.put(listKey, JSON.stringify(subjects));
    }

    return jsonResp(200, { ok: true, taskCode });
  } catch (e) {
    return jsonResp(500, { error: e.message });
  }
}

// ========== Admin: List Subjects ==========
async function handleAdminList(request, env) {
  try {
    const kv = env.DATA_KV;
    const subjects = await kv.get('subjects', 'json') || [];
    return jsonResp(200, { subjects });
  } catch (e) {
    return jsonResp(500, { error: e.message });
  }
}

// ========== Admin: Export All Data as CSV (量表数据) ==========
async function handleExport(request, env) {
  try {
    const kv = env.DATA_KV;
    const subjects = await kv.get('subjects', 'json') || [];
    
    const rows = [];
    rows.push(['subject_id','scenario','ai_order','gender','age_group','ai_usage_freq',
      'start_time','finish_time','taskCode',
      'exp_attention','exp_style_mc_1','exp_style_mc_2','exp_style_mc_3',
      'exp_pleasure_1','exp_pleasure_2','exp_pleasure_3',
      'exp_effort_1','exp_effort_2','exp_effort_3',
      'exp_value_1','exp_value_2',
      'exp_wtp_slider','exp_wtp_1','exp_wtp_2','exp_wtp_3',
      'util_attention','util_style_mc_1','util_style_mc_2','util_style_mc_3',
      'util_pleasure_1','util_pleasure_2','util_pleasure_3',
      'util_effort_1','util_effort_2','util_effort_3',
      'util_value_1','util_value_2',
      'util_wtp_slider','util_wtp_1','util_wtp_2','util_wtp_3',
      'scen_mc_1','scen_mc_2','scen_mc_3'
    ].join(','));
    
    for (const sid of subjects) {
      const p = await kv.get('participant:' + sid, 'json');
      const s = await kv.get('survey:' + sid, 'json');
      if (!p || !s) continue;
      const exp = s.survey_exp || {}, util = s.survey_util || {}, sc = s.scenario_mc || {};
      const row = [
        p.subject_id, p.scenario, p.ai_order,
        p.gender, p.age_group, p.ai_usage_freq,
        p.start_time, p.finish_time, p.taskCode,
        exp.attention_check ?? '', exp.style_mc_1 || '', exp.style_mc_2 || '', exp.style_mc_3 || '',
        exp.pleasure_1 || '', exp.pleasure_2 || '', exp.pleasure_3 || '',
        exp.effort_1 || '', exp.effort_2 || '', exp.effort_3 || '',
        exp.value_1 || '', exp.value_2 || '',
        exp.wtp_slider ?? '', exp.wtp_1 || '', exp.wtp_2 || '', exp.wtp_3 || '',
        util.attention_check ?? '', util.style_mc_1 || '', util.style_mc_2 || '', util.style_mc_3 || '',
        util.pleasure_1 || '', util.pleasure_2 || '', util.pleasure_3 || '',
        util.effort_1 || '', util.effort_2 || '', util.effort_3 || '',
        util.value_1 || '', util.value_2 || '',
        util.wtp_slider ?? '', util.wtp_1 || '', util.wtp_2 || '', util.wtp_3 || '',
        sc.scen_mc_1 || '', sc.scen_mc_2 || '', sc.scen_mc_3 || ''
      ];
      rows.push(row.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','));
    }
    // 添加 BOM 解决 Excel 中文乱码
    return new Response(CSV_BOM + rows.join('\r\n'), {
      headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Content-Disposition': 'attachment; filename="survey_data.csv"' }
    });
  } catch (e) { return jsonResp(500, { error: e.message }); }
}

// ========== Admin: Export Chat Logs (对话日志) ==========
async function handleExportChats(request, env) {
  try {
    const kv = env.DATA_KV;
    const url = new URL(request.url);
    const aiType = url.searchParams.get('type') || 'exp'; // exp or util
    const subjects = await kv.get('subjects', 'json') || [];
    
    const rows = [];
    rows.push(['subject_id','turn','role','content','responseTimeMs','logTime']);
    
    for (const sid of subjects) {
      const chatLogs = await kv.get('chat:' + sid, 'json') || [];
      // 过滤出指定 aiType 的消息
      const filtered = chatLogs.filter(m => m.aiType === aiType);
      for (const msg of filtered) {
        rows.push([
          sid,
          msg.turn ?? '',
          msg.role || '',
          (msg.content || '').replace(/"/g, '""'),
          msg.responseTimeMs ?? '',
          msg.logTime || ''
        ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','));
      }
    }
    return new Response(CSV_BOM + rows.join('\r\n'), {
      headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Content-Disposition': `attachment; filename="chat_${aiType}.csv"` }
    });
  } catch (e) { return jsonResp(500, { error: e.message }); }
}

// ========== Admin: Export All Chat Logs (全部对话，不区分AI类型) ==========
async function handleExportAllChats(request, env) {
  try {
    const kv = env.DATA_KV;
    const subjects = await kv.get('subjects', 'json') || [];
    
    const rows = [];
    rows.push(['subject_id','aiType','turn','role','content','responseTimeMs','logTime']);
    
    for (const sid of subjects) {
      const chatLogs = await kv.get('chat:' + sid, 'json') || [];
      for (const msg of chatLogs) {
        rows.push([
          sid, msg.aiType || '', msg.turn ?? '', msg.role || '',
          (msg.content || '').replace(/"/g, '""'),
          msg.responseTimeMs ?? '', msg.logTime || ''
        ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','));
      }
    }
    return new Response(CSV_BOM + rows.join('\r\n'), {
      headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Content-Disposition': 'attachment; filename="chat_all.csv"' }
    });
  } catch (e) { return jsonResp(500, { error: e.message }); }
}

// ========== Main ==========
export default {
  async fetch(request, env, ctx) {
    console.log('[Worker]', request.method, request.url);
    if (request.method === 'OPTIONS') return new Response('', { headers: CORS });
    const path = new URL(request.url).pathname;
    if (path.endsWith('/chat')) return handleChat(request, env);
    if (path.endsWith('/log-message')) return handleLogMessage(request, env);
    if (path.endsWith('/submit-survey')) return handleSubmitSurvey(request, env);
    if (path === '/admin/list-subjects') return handleAdminList(request, env);
    if (path === '/admin/export') return handleExport(request, env);
    if (path === '/admin/export-chats') return handleExportChats(request, env);
    if (path === '/admin/export-all-chats') return handleExportAllChats(request, env);
    return jsonResp(404, { error: 'Not Found' });
  }
};
