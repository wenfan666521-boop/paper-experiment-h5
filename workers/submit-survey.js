export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response('', { headers: cors });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
        status: 405, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const payload = await request.json();
    const {
      subject_id, start_time, finish_time, gender, age_group, ai_usage_freq,
      scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util
    } = payload;

    // 生成任务码
    const taskCode = 'TASK_' + Math.random().toString(36).slice(2, 8).toUpperCase();

    // 获取飞书 access token
    let accessToken;
    try {
      const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: env.FEISHU_APP_ID,
          app_secret: env.FEISHU_APP_SECRET
        })
      });
      const tokenData = await tokenRes.json();
      accessToken = tokenData.tenant_access_token;
      if (!accessToken) throw new Error('no token');
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Failed to get Feishu token', detail: err.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const ts = new Date().toISOString();
    const sheetToken = env.FEISHU_SHEET_TOKEN;

    // participants 表一行
    const participantRow = [
      subject_id || '', start_time || ts, finish_time || ts,
      gender || '', age_group || '',
      ai_usage_freq || '', scenario || '', ai_order || '',
      'completed', user_agent || '', taskCode
    ];

    // survey_responses 表一行（39列）
    const sr = survey_exp || {};
    const su = survey_util || {};
    const sc = scenario_mc || {};
    const surveyRow = [
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

    // 并发写入两张表
    const [pRes, sRes] = await Promise.all([
      fetch(`https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueRange: { range: 'participants!A:K', values: [participantRow] } })
      }),
      fetch(`https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueRange: { range: 'survey_responses!A:AN', values: [surveyRow] } })
      })
    ]);

    const pData = await pRes.json();
    const sData = await sRes.json();
    if (pData.code !== 0) console.error('participants write error:', pData);
    if (sData.code !== 0) console.error('survey_responses write error:', sData);

    return new Response(JSON.stringify({ ok: true, taskCode }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
