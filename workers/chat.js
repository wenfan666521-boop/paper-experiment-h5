export default {
  async fetch(request, env) {
    // CORS headers
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

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const { aiType, messages, subjectId } = body;
    if (!aiType || !messages) {
      return new Response(JSON.stringify({ error: '缺少 aiType 或 messages' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const appId = aiType === 'exp' ? env.BAILIAN_APP_ID_EXP : env.BAILIAN_APP_ID_UTIL;
    const apiKey = aiType === 'exp' ? env.BAILIAN_API_KEY_EXP : env.BAILIAN_API_KEY_UTIL;

    if (!appId || !apiKey) {
      return new Response(JSON.stringify({ error: 'BAILIAN credentials not configured' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const history = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          appid: appId,
          messages: history,
          max_tokens: 800,
          temperature: aiType === 'exp' ? 0.9 : 0.3
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Bailian error:', data);
        return new Response(JSON.stringify({ error: data.error?.message || 'Bailian API error' }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      const reply = data.choices?.[0]?.message?.content || '抱歉，暂时无法回复，请稍后再试。';
      return new Response(JSON.stringify({ message: reply }), {
        status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('chat proxy error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
