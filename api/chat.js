// 百炼对话代理 API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const { aiType, messages, subjectId } = req.body;

  if (!aiType || !messages) {
    return res.status(400).json({ error: '缺少 aiType 或 messages' });
  }

  const appId = aiType === 'exp'
    ? process.env.BAILIAN_APP_ID_EXP
    : process.env.BAILIAN_APP_ID_UTIL;
  const apiKey = aiType === 'exp'
    ? process.env.BAILIAN_API_KEY_EXP
    : process.env.BAILIAN_API_KEY_UTIL;

  if (!appId || !apiKey) {
    return res.status(500).json({ error: 'BAILIAN credentials not configured' });
  }

  // 构造消息历史（取最近20条，控制token）
  const history = messages.slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  try {
    const response = await fetch(`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`, {
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
      return res.status(502).json({ error: data.error?.message || 'Bailian API error' });
    }

    const reply = data.choices?.[0]?.message?.content || '抱歉，暂时无法回复，请稍后再试。';
    return res.status(200).json({ message: reply });
  } catch (err) {
    console.error('chat proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
