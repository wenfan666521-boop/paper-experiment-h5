// 实时记录对话到飞书表格
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const { subjectId, aiType, turn, role, content, responseTimeMs } = req.body;
  if (!subjectId || !aiType) return res.status(400).json({ error: '缺少必要参数' });

  const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
  const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
  const FEISHU_SHEET_TOKEN = process.env.FEISHU_SHEET_TOKEN;

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_SHEET_TOKEN) {
    return res.status(500).json({ error: 'FEISHU credentials not configured' });
  }

  try {
    // 获取tenant_access_token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.tenant_access_token;
    if (!accessToken) return res.status(500).json({ error: 'Failed to get Feishu token' });

    const logTime = new Date().toISOString();
    const sheetToken = FEISHU_SHEET_TOKEN;

    // 追加一行到chat_logs表（第2张sheet）
    const appendRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueRange: {
          range: 'chat_logs!A:G',
          values: [[
            `LOG_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            subjectId,
            aiType,
            turn,
            role,
            content.slice(0, 2000), // 截断超长内容
            logTime,
            responseTimeMs || ''
          ]]
        }
      })
    });

    const result = await appendRes.json();
    if (!appendRes.ok) {
      console.error('Feishu log error:', result);
      return res.status(200).json({ ok: false, error: result.msg });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('log-message error:', err);
    return res.status(500).json({ error: err.message });
  }
}
