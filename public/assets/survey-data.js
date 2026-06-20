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
    q: '为确认您正在认真作答，请在本题选择“比较同意”。',
    options: [
      { value: 1, label: '非常不同意' },
      { value: 2, label: '比较不同意' },
      { value: 3, label: '有点不同意' },
      { value: 4, label: '不确定' },
      { value: 5, label: '有点同意' },
      { value: 6, label: '比较同意' },
      { value: 7, label: '非常同意' }
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

  // 感知效率（3题）
  // 改编自 E-S-QUAL 的 Efficiency 维度（Parasuraman, Zeithaml & Malhotra, 2005）
  // 以及 TAM 中关于有用性/易用性的相关测量逻辑（Davis, 1989）
  efficiency: [
    { id: 'efficiency_1', q: '这个AI帮助我更快速地完成出行规划', left: '非常不同意', right: '非常同意' },
    { id: 'efficiency_2', q: '这个AI减少了我搜索和比较信息所需的时间', left: '非常不同意', right: '非常同意' },
    { id: 'efficiency_3', q: '这个AI使整个服务过程更加高效', left: '非常不同意', right: '非常同意' }
  ],

  // 感知控制感（3题）
  // 改编自人机交互与智能系统用户交互中的 perceived control 测量逻辑，
  // 强调用户对交互进度、选项与调整空间的控制感。
  control: [
    { id: 'control_1', q: '在与这个AI交互时，我能清楚知道当前任务进行到哪一步', left: '非常不同意', right: '非常同意' },
    { id: 'control_2', q: '这个AI提供的选项让我觉得服务过程更容易掌控', left: '非常不同意', right: '非常同意' },
    { id: 'control_3', q: '这个AI让出行规划过程变得清晰、有条理', left: '非常不同意', right: '非常同意' }
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
