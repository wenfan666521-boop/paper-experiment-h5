// API 调用封装
const API = {
  BASE: 'https://young-sunset-ca8f.wenfan666521.workers.dev',
  MOCK: window.location.search.includes('mock=1'),

  async chat(aiType, messages, subjectId) {
    if (this.MOCK) return this.mockChat(aiType, messages);
    const res = await fetch(`${this.BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiType, messages, subjectId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API错误');
    return data.message;
  },

  async logMessage(subjectId, aiType, turn, role, content, responseTimeMs = null) {
    if (this.MOCK) { console.log('[MOCK logMessage]', { subjectId, aiType, turn, role, content }); return; }
    try {
      await fetch(`${this.BASE}/log-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, aiType, turn, role, content, responseTimeMs })
      });
    } catch (e) { console.warn('log failed', e); }
  },

  async submitSurvey(payload) {
    if (this.MOCK) {
      console.log('[MOCK submitSurvey]', payload);
      return { ok: true, taskCode: 'MOCK_' + Math.random().toString(36).slice(2,7).toUpperCase() };
    }
    const res = await fetch(`${this.BASE}/submit-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async mockChat(aiType, messages) {
    await new Promise(r => setTimeout(r, 800 + Math.random()*1000));
    const last = messages[messages.length-1].content;
    if (aiType === 'exp') {
      return '🌟 [体验AI Mock] 嗷～收到啦！你说"' + last.slice(0,15) + '..."呀～让我帮你想想～你是想自由探索，还是希望我直接帮你定下方案呀？😊';
    } else {
      return '✈️ [功利AI Mock] 步骤 X/5\n\n已收到信息。\n请选择：\n[1] 选项一\n[2] 选项二\n[3] 选项三\n\n请回复编号 [1/2/3]。';
    }
  }
};
