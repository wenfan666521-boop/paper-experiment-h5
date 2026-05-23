// 提交完整量表 → 飞书 participants + survey_responses 表
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const payload = req.body;
  const {
    subject_id, start_time, finish_time, gender, age_group, ai_usage_freq,
    scenario, ai_order, user_agent, scenario_mc, survey_exp, survey_util
  } = payload;

  const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
  const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
  const FEISHU_SHEET_TOKEN = process.env.FEISHU_SHEET_TOKEN;

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_SHEET_TOKEN) {
    return res.status(500).json({ error: 'FEISHU credentials not configured' });
  }

  // 生成任务码
  const taskCode = 'TASK_' + Math.random().toString(36).slice(2,8).toUpperCase();

  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.tenant_access_token;
    if (!accessToken) return res.status(500).json({ error: 'Failed to get Feishu token' });

    const sheetToken = FEISHU_SHEET_TOKEN;
    const ts = new Date().toISOString();

    // 构建 participants 表一行
    const participantRow = [
      subject_id, start_time || ts, finish_time || ts, gender || '', age_group || '',
      ai_usage_freq || '', scenario || '', ai_order || '',
      'completed', user_agent || '', taskCode
    ];

    // 构建 survey_responses 表一行（所有字段按顺序）
    const sr = survey_exp || {};
    const su = survey_util || {};
    const sc = scenario_mc || {};
    const surveyRow = [
      subject_id, ts, scenario || '', ai_order || '',
      // 场景操控检验
      sc.scen_mc_1 || '', sc.scen_mc_2 || '', sc.scen_mc_3 || '',
      // exp_*
      sr.attention_check ?? '',
      sr.style_mc_1 || '', sr.style_mc_2 || '', sr.style_mc_3 || '',
      sr.pleasure_1 || '', sr.pleasure_2 || '', sr.pleasure_3 || '',
      sr.effort_1 || '', sr.effort_2 || '', sr.effort_3 || '',
      sr.value_1 || '', sr.value_2 || '',
      sr.wtp_slider ?? '', sr.wtp_1 || '', sr.wtp_2 || '', sr.wtp_3 || '',
      // util_*
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
        body: JSON.stringify({ valueRange: { range: 'participants!A:L', values: [participantRow] } })
      }),
      fetch(`https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueRange: { range: 'survey_responses!A:AW', values: [surveyRow] } })
      })
    ]);

    const pData = await pRes.json();
    const sData = await sRes.json();

    if (pData.code !== 0) console.error('participants write error:', pData);
    if (sData.code !== 0) console.error('survey_responses write error:', sData);

    return res.status(200).json({ ok: true, taskCode });
  } catch (err) {
    console.error('submit-survey error:', err);
    return res.status(500).json({ error: err.message });
  }
}
