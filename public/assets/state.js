// 全局状态管理 - 基于 sessionStorage
const State = {
  KEY: 'experiment_state',

  init() {
    if (!this.get('subject_id')) {
      const id = 'P_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '_' + Math.random().toString(36).slice(2,8);
      this.set('subject_id', id);
      this.set('start_time', new Date().toISOString());
      this.set('user_agent', navigator.userAgent);
    }
  },

  set(key, value) {
    const data = this.getAll();
    data[key] = value;
    sessionStorage.setItem(this.KEY, JSON.stringify(data));
  },

  get(key) {
    return this.getAll()[key];
  },

  getAll() {
    try {
      return JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
    } catch { return {}; }
  },

  clear() {
    sessionStorage.removeItem(this.KEY);
  },

  // 场景随机分配（在 demographics 提交后调用）
  assignScenario() {
    if (!this.get('scenario')) {
      this.set('scenario', Math.random() < 0.5 ? 'exp' : 'util');
    }
  },

  // AI顺序随机分配
  assignAiOrder() {
    if (!this.get('ai_order')) {
      this.set('ai_order', Math.random() < 0.5 ? 'exp_first' : 'util_first');
      this.set('current_ai_index', 0); // 0: 第一个AI, 1: 第二个AI
    }
  },

  getCurrentAi() {
    const order = this.get('ai_order');
    const idx = this.get('current_ai_index') || 0;
    if (order === 'exp_first') return idx === 0 ? 'exp' : 'util';
    return idx === 0 ? 'util' : 'exp';
  },

  nextAi() {
    this.set('current_ai_index', (this.get('current_ai_index') || 0) + 1);
  },

  hasMoreAi() {
    return (this.get('current_ai_index') || 0) < 2;
  },

  // 答卷数据（按AI类型存）
  saveSurvey(aiType, data) {
    this.set(`survey_${aiType}`, data);
  },

  // 导航
  navigate(page) {
    window.location.href = page;
  }
};

// 工具函数
function navigate(page) { State.navigate(page); }

// 高亮选中
function highlightChecked(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
    const parent = input.closest('.radio-item');
    if (parent) parent.classList.toggle('checked', input.checked);
  });
}

document.addEventListener('change', (e) => {
  if (e.target.type === 'radio') {
    highlightChecked(e.target.name);
  }
});

// 初始化（仅在非entry页）
State.init();
