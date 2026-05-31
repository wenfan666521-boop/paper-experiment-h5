// 全局状态管理 - 基于 sessionStorage
const PHASE_ORDER = [
  'init',           // 0: index（实验未开始）
  'consented',      // 1: consent 完成
  'demographics',   // 2: demographics 完成，场景和AI顺序已分配
  'scenario_read',  // 3: scenario 阅读完成
  'scenario_mc',    // 4: 场景操控检验完成
  'chat_1',         // 5: 第1个AI对话完成
  'survey_1',       // 6: 第1个AI评价完成
  'transition',     // 6.5: 两次实验之间的引导页
  'chat_2',         // 7: 第2个AI对话完成
  'survey_2',       // 8: 第2个AI评价完成 → 最终提交
];

const State = {
  KEY: 'experiment_state',

  init() {
    // 解析 URL 参数（仅首次加载时生效）
    if (!this.get('_url_parsed')) {
      const params = new URLSearchParams(window.location.search);
      const urlSubject = params.get('subject');
      const urlScenario = params.get('scenario');
      const urlOrder = params.get('order');
      
      if (urlSubject) this.set('subject_id', urlSubject);
      if (urlScenario && (urlScenario === 'exp' || urlScenario === 'util')) this.set('scenario', urlScenario);
      if (urlOrder && (urlOrder === 'exp_first' || urlOrder === 'util_first')) {
        this.set('ai_order', urlOrder);
        this.set('current_ai_index', 0);
      }
      this.set('_url_parsed', true);
    }
    
    if (!this.get('subject_id')) {
      const id = 'P_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '_' + Math.random().toString(36).slice(2,8);
      this.set('subject_id', id);
      this.set('start_time', new Date().toISOString());
      this.set('user_agent', navigator.userAgent);
    }
    // 保证 phase 字段存在
    if (!this.get('phase')) {
      this.set('phase', 'init');
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

  // 重置整个实验（从首页重新开始时调用）
  resetExperiment() {
    this.clear();
    this.init();
  },

  // ---- phase 管理 ----
  setPhase(phase) {
    this.set('phase', phase);
  },

  getPhase() {
    return this.get('phase') || 'init';
  },

  getPhaseIndex(phase) {
    return PHASE_ORDER.indexOf(phase);
  },

  // 校验当前 phase 是否在某个阶段之后（用于页面进入校验）
  // expectAfter = true 表示 "必须已经经过了这些阶段才合法"
  checkPhase(neededPhase) {
    const current = this.getPhase();
    const currentIdx = this.getPhaseIndex(current);
    const neededIdx = this.getPhaseIndex(neededPhase);
    // 允许当前 phase == neededPhase，或在 neededPhase 之后
    return currentIdx >= neededIdx;
  },

  // 页面进入时校验，不通过则强制重置
  validatePhase(neededPhase) {
    if (!this.checkPhase(neededPhase)) {
      console.warn(`[State] Phase mismatch: expected ${neededPhase}, got ${this.getPhase()}. Resetting.`);
      this.resetExperiment();
      navigate('index.html');
      return false;
    }
    return true;
  },

  // ---- 场景分配（URL指定优先，否则随机） ----
  assignScenario() {
    if (!this.get('scenario')) {
      this.set('scenario', Math.random() < 0.5 ? 'exp' : 'util');
    }
  },

  // ---- AI顺序分配（URL指定优先，否则随机） ----
  assignAiOrder() {
    if (!this.get('ai_order')) {
      this.set('ai_order', Math.random() < 0.5 ? 'exp_first' : 'util_first');
      this.set('current_ai_index', 0);
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

// 初始化
State.init();