// 量表题目配置
const SurveyData = {
  // 场景操控检验（3题）
  scenarioMC: [
    { id: 'scen_mc_1', q: '在本研究描述的情境中，您觉得您本次获取服务最关注的是', left: '体验和探索乐趣', right: '结果、速度和效率' },
    { id: 'scen_mc_2', q: '在本研究描述的情境中，您觉得您本次获取服务的目的是', left: '放松享受', right: '高效完成' },
    { id: 'scen_mc_3', q: '在本研究描述的情境中，您觉得您本次获取服务场景更倾向于是', left: '体验式场景', right: '功利式场景' }
  ],

  // 注意力检查
  attentionCheck: {
    q: '材料阅读检查：在刚才的对话中，AI助手是否使用了 emoji 表情符号？',
    options: [
      { value: 1, label: '有使用 emoji 表情' },
      { value: 0, label: '没有使用 emoji 表情' }
    ]
  },

  // AI风格操控检验（3题）
  styleMC: [
    { id: 'style_mc_1', q: '在上述交互的过程中，我觉得这个 AI 客服', left: '像在与真人聊天', right: '像在使用工具' },
    { id: 'style_mc_2', q: '在上述交互的过程中，我觉得这个 AI 客服', left: '很友好、健谈', right: '很冷静、高效' },
    { id: 'style_mc_3', q: '在上述交互的过程中，我觉得这个 AI 客服', left: '沟通较为开放自由', right: '沟通的目的性强' }
  ],

  // 乐趣感知（3题）
  pleasure: [
    { id: 'pleasure_1', q: '我觉得参与这个AI服务的过程令人愉悦', left: '非常不同意', right: '非常同意' },
    { id: 'pleasure_2', q: '我觉得和这个AI的交互过程充满了娱乐性', left: '非常不同意', right: '非常同意' },
    { id: 'pleasure_3', q: '我觉得参与这个AI服务的过程充满乐趣', left: '非常不同意', right: '非常同意' }
  ],

  // 努力感知（3题）
  effort: [
    { id: 'effort_1', q: '我觉得和这个AI的交互过程，让我感觉较为复杂', left: '非常不同意', right: '非常同意' },
    { id: 'effort_2', q: '我觉得参与这个AI服务的过程，需要我投入不少努力', left: '非常不同意', right: '非常同意' },
    { id: 'effort_3', q: '我觉得使用这个AI服务，会消耗我的时间和精力', left: '非常不同意', right: '非常同意' }
  ],

  // 感知价值（2题）
  value: [
    { id: 'value_1', q: '该AI服务为我的出行规划带来了显著的价值提升', left: '非常不同意', right: '非常同意' },
    { id: 'value_2', q: '该AI服务所带来的实用价值，远超其使用成本与所需付出的精力', left: '非常不同意', right: '非常同意' }
  ],

  // 支付意愿（4题 + 1滑块）
  wtpSlider: {
    id: 'wtp_slider',
    q: '您愿意为该旅游平台提供的这项AI服务花费多少钱？',
    min: 0,
    max: 30,
    unit: '元'
  },
  wtp: [
    { id: 'wtp_1', q: '我愿意为这项AI服务多花钱', left: '非常不同意', right: '非常同意' },
    { id: 'wtp_2', q: '我认为，为这项AI服务多支付25%的费用是可以接受的', left: '非常不同意', right: '非常同意' },
    { id: 'wtp_3', q: '我认为，为这AI服务额外加价购买是合理的', left: '非常不同意', right: '非常同意' }
  ]
};
