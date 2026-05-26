// API 调用封装 - 全部本地化：AI对话直连百炼，数据存localStorage，被试自行导出
const API = {
  // ======= 百炼AI直连配置 =======
  BAILIAN: {
    appIdExp: '467708a331474605b5d30d999417edd0',
    appIdUtil: '7f59b8a020ff4311a376f0a685f1024d',
    apiKey: 'sk-41ec25d4bc7246b39f1706750dcac482',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/apps/'
  },

  // ======= localStorage 数据存储 =======
  _getStore(aiType) {
    const key = 'paper_exp_' + aiType;
    return JSON.parse(localStorage.getItem(key) || '{"chatLogs":[],"survey":null}');
  },
  _setStore(aiType, data) {
    localStorage.setItem('paper_exp_' + aiType, JSON.stringify(data));
  },

  // ======= AI对话（直连百炼） =======
  async chat(aiType, messages, subjectId) {
    if (this.MOCK) return this.mockChat(aiType, messages);

    const appId = aiType === 'exp' ? this.BAILIAN.appIdExp : this.BAILIAN.appIdUtil;
    const temperature = aiType === 'exp' ? 0.9 : 0.3;

    const prompt = messages.map(m => {
      if (m.role === 'user') return '「用户」：' + m.content;
      if (m.role === 'assistant') return '「助手」：' + m.content;
      return m.content;
    }).join('\n');

    try {
      const response = await Promise.race([
        fetch(this.BAILIAN.endpoint + appId + '/completion', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + this.BAILIAN.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: { prompt: prompt },
            parameters: { stream: false, temperature: temperature, max_tokens: 800 }
          })
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI请求超时')), 30000)
        )
      ]);

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'AI调用失败');
      return data.output?.text || data.output?.content || '抱歉，暂时无法回复。';
    } catch (e) {
      throw new Error(e.message);
    }
  },

  // ======= 对话日志（存localStorage） =======
  async logMessage(subjectId, aiType, turn, role, content, responseTimeMs = null) {
    if (this.MOCK) { console.log('[MOCK logMessage]', { subjectId, aiType, turn, role, content }); return; }
    try {
      const store = this._getStore(aiType);
      store.chatLogs.push({
        subjectId, turn, role, content, responseTimeMs,
        ts: new Date().toISOString()
      });
      this._setStore(aiType, store);
    } catch (e) { console.warn('log failed', e); }
  },

  // ======= 提交量表（存localStorage） =======
  async submitSurvey(payload) {
    if (this.MOCK) {
      console.log('[MOCK submitSurvey]', payload);
      return { ok: true, taskCode: 'MOCK_' + Math.random().toString(36).slice(2,7).toUpperCase() };
    }
    try {
      const store = this._getStore(payload.aiType || 'exp');
      store.survey = { ...payload, submittedAt: new Date().toISOString() };
      this._setStore(payload.aiType || 'exp', store);
      return { ok: true, taskCode: 'LOCAL_' + Math.random().toString(36).slice(2,7).toUpperCase() };
    } catch (e) {
      throw new Error(e.message);
    }
  },

  // ======= 数据导出（被试手动触发） =======
  exportData(aiType) {
    const store = this._getStore(aiType);
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_data_' + aiType + '_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  // 导出全部数据（两个AI的数据）
  exportAllData() {
    const exp = this._getStore('exp');
    const util = this._getStore('util');
    const all = { exp, util, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_data_all_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  // ======= Mock模式 =======
  async mockChat(aiType, messages) {
    await new Promise(r => setTimeout(r, 800 + Math.random()*1000));
    const last = messages[messages.length-1].content;
    if (aiType === 'exp') {
      return '🌟 [体验AI Mock] 嗷～收到啦！你说"' + last.slice(0,15) + '..."呀～让我帮你想想～你是想自由探索，还是希望我直接帮我定下方案呀？😊';
    } else {
      return '✈️ [功利AI Mock] 步骤 X/5\n\n已收到信息。\n请选择：\n[1] 选项一\n[2] 选项二\n[3] 选项三\n\n请回复编号 [1/2/3]。';
    }
  }
};
