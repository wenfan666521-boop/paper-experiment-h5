// API 调用封装
const API = {
  BASE: window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api',
  MOCK: window.location.search.includes('mock=1') || !window.location.hostname.includes('vercel'),

  // 发送对话消息
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

  // 记录对话日志（每条消息发送后调用）
  async logMessage(subjectId, aiType, turn, role, content, responseTimeMs = null) {
    if (this.MOCK) {
      console.log('[MOCK logMessage]', { subjectId, aiType, turn, role, content, responseTimeMs });
      return;
    }
    try {
      await fetch(`${this.BASE}/log-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, aiType, turn, role, content, responseTimeMs })
      });
    } catch (e) { console.warn('log failed', e); }
  },

  // 提交完整量表
  async submitSurvey(payload) {
    if (this.MOCK) {
      console.log('[MOCK submitSurvey]', payload);
      return { ok: true, taskCode: 'MOCK_TASK_' + Math.random().toString(36).slice(2,7).toUpperCase() };
    }
    const res = await fetch(`${this.BASE}/submit-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Mock AI 响应（开发用）
  async mockChat(aiType, messages) {
    await new Promise(r => setTimeout(r, 800 + Math.random()*1000));
    const last = messages[messages.length-1].content;
    if (aiType === 'exp') {
      return `[体验AI Mock] 嗷～收到啦 😊 你说"${last.slice(0,15)}..."呀～这个我懂的！让我帮你想想哈 ✨ 你是更想自由探索一点呢，还是希望我帮你直接定下方案？`;
    } else {
      return `[功利AI Mock] 步骤 X/5\n\n已收到信息。请选择：\n[1] 选项一\n[2] 选项二\n[3] 选项三\n\n请回复编号 [1/2/3]。`;
    }
  }
};
