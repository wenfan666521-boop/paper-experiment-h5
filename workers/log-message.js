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

    let { subjectId, aiType, turn, role, content, responseTimeMs } = {};
    try {
      ({ subjectId, aiType, turn, role, content, responseTimeMs } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    if (!subjectId || !aiType) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

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

    const logTime = new Date().toISOString();
    const logId = `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    try {
      const res = await fetch(`https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${env.FEISHU_SHEET_TOKEN}/values`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueRange: {
            range: 'chat_logs!A:H',
            values: [[logId, subjectId, aiType, turn, role, (content || '').slice(0, 2000), logTime, responseTimeMs || '']]
          }
        })
      });
      const result = await res.json();
      if (!res.ok) console.error('Feishu log error:', result);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('log-message error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
