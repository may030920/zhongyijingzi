(function () {
  var defaults = window.ZhongyiMirrorDefaults || {};
  var knowledgeBase = window.ZhongyiKnowledgeBase || { classics: [] };
  var stored = {};

  try {
    stored = JSON.parse(localStorage.getItem(defaults.storageKey) || '{}');
  } catch (error) {
    stored = {};
  }

  var config = Object.assign({}, defaults, stored);
  var agent = new window.ZhongyiMirrorAgent(config);
  var videoCheckinStorageKey = (defaults.storageKey || 'zhongyi-mirror-agent-config') + '-video-checkins';

  // 本地视频库：按体质倾向组织饮食与运动内容，纯前端即可完成推荐。
  var videoLibrary = {
    qixu: [
      { id: 'qixu-baduanjin', title: '补气养元操', category: '运动类', subtitle: '适合晨起微疲、先把气提起来', coach: 'AI 陪练 · 温和节奏', focus: '轻缓伸展 + 呼吸带动', durationSec: 36, palette: ['#8a6a4a', '#d0b17c'], externalUrl: 'https://search.bilibili.com/all?keyword=%E5%85%AB%E6%AE%B5%E9%94%A6%20%E8%B7%9F%E7%BB%83', externalLabel: '看真实八段锦', source: 'B站真实内容' },
      { id: 'qixu-huangqi', title: '黄芪山药小炖盅', category: '饮食类', subtitle: '补气不腻，适合今天做一份暖胃食疗', coach: 'AI 食养卡', focus: '补气养脾 + 易消化', durationSec: 24, palette: ['#7f7451', '#c2a76f'], externalUrl: 'https://search.bilibili.com/all?keyword=%E9%BB%84%E8%8A%AA%20%E5%B1%B1%E8%8D%AF%20%E7%82%96%E9%B8%A1%20%E5%81%9A%E6%B3%95', externalLabel: '看真实食谱', source: 'B站真实内容' },
      { id: 'qixu-breath', title: '午间提气呼吸法', category: '运动类', subtitle: '久坐后做一轮，帮你把专注度慢慢拉回来', coach: 'AI 陪练 · 呼吸引导', focus: '胸廓打开 + 慢吸慢呼', durationSec: 30, palette: ['#627d74', '#b8c8a6'], externalUrl: 'https://search.bilibili.com/all?keyword=%E6%8F%90%E6%B0%94%20%E5%91%BC%E5%90%B8%E6%B3%95', externalLabel: '看真实练法', source: 'B站真实内容' }
    ],
    shire: [
      { id: 'shire-baduanjin', title: '清爽舒展八段锦', category: '运动类', subtitle: '给今天偏闷的状态做一次舒展开机', coach: 'AI 陪练 · 清舒版', focus: '舒肝理气 + 出微汗', durationSec: 38, palette: ['#3f7a6c', '#8ec5a1'], externalUrl: 'https://search.bilibili.com/all?keyword=%E5%85%AB%E6%AE%B5%E9%94%A6%20%E7%A5%9B%E6%B9%BF', externalLabel: '看真实八段锦', source: 'B站真实内容' },
      { id: 'shire-yinpin', title: '薏米冬瓜轻食课', category: '饮食类', subtitle: '偏清润的搭配，更适合湿热感明显的时候', coach: 'AI 食养卡', focus: '清淡祛腻 + 减少辛辣', durationSec: 24, palette: ['#5a7d5d', '#c5d08e'], externalUrl: 'https://search.bilibili.com/all?keyword=%E8%96%8F%E7%B1%B3%20%E5%86%AC%E7%93%9C%20%E5%81%9A%E6%B3%95', externalLabel: '看真实食谱', source: 'B站真实内容' },
      { id: 'shire-stretch', title: '晚间去闷热拉伸', category: '运动类', subtitle: '睡前 30 秒，帮助身体从黏滞感里退出来', coach: 'AI 陪练 · 夜间版', focus: '脊柱舒展 + 稳定呼吸', durationSec: 32, palette: ['#467c78', '#79b3b0'], externalUrl: 'https://search.bilibili.com/all?keyword=%E7%A5%9B%E6%B9%BF%20%E6%8B%89%E4%BC%B8', externalLabel: '看真实练法', source: 'B站真实内容' }
    ],
    yangxu: [
      { id: 'yangxu-warmup', title: '暖阳微循环操', category: '运动类', subtitle: '节奏柔和，适合怕冷和清晨状态慢热的人', coach: 'AI 陪练 · 温养版', focus: '四肢回温 + 缓慢激活', durationSec: 34, palette: ['#9b694a', '#d99863'], externalUrl: 'https://search.bilibili.com/all?keyword=%E5%85%AB%E6%AE%B5%E9%94%A6%20%E6%B8%A9%E5%92%8C%20%E8%B7%9F%E7%BB%83', externalLabel: '看真实八段锦', source: 'B站真实内容' },
      { id: 'yangxu-soup', title: '桂圆红枣暖身饮', category: '饮食类', subtitle: '用一杯温热感把今天先稳住', coach: 'AI 食养卡', focus: '温养脾胃 + 少量慢饮', durationSec: 22, palette: ['#8e5b48', '#d69c7d'], externalUrl: 'https://search.bilibili.com/all?keyword=%E6%A1%82%E5%9C%86%20%E7%BA%A2%E6%9E%A3%20%E9%A5%AE%20%E5%81%9A%E6%B3%95', externalLabel: '看真实食谱', source: 'B站真实内容' }
    ],
    yinxu: [
      { id: 'yinxu-breath', title: '清润养息呼吸课', category: '运动类', subtitle: '把节奏放慢，先从降燥和稳呼吸开始', coach: 'AI 陪练 · 清润版', focus: '呼吸放松 + 降低耗散', durationSec: 32, palette: ['#5b6e88', '#96b9d9'], externalUrl: 'https://search.bilibili.com/all?keyword=%E6%B6%A6%E7%87%A5%20%E5%91%BC%E5%90%B8%E6%94%BE%E6%9D%BE', externalLabel: '看真实练法', source: 'B站真实内容' },
      { id: 'yinxu-soup', title: '百合银耳润养饮', category: '饮食类', subtitle: '偏清润的食养，更适合熬夜后补一补', coach: 'AI 食养卡', focus: '润燥养阴 + 减少辛辣', durationSec: 24, palette: ['#667a94', '#b9c6da'], externalUrl: 'https://search.bilibili.com/all?keyword=%E7%99%BE%E5%90%88%20%E9%93%B6%E8%80%B3%20%E5%81%9A%E6%B3%95', externalLabel: '看真实食谱', source: 'B站真实内容' }
    ],
    pinghe: [
      { id: 'pinghe-flow', title: '平衡舒缓晨练', category: '运动类', subtitle: '保持匀和状态，做短而轻的日常活动', coach: 'AI 陪练 · 平衡版', focus: '稳态维持 + 放松筋骨', durationSec: 28, palette: ['#5f7d75', '#c7c49a'], externalUrl: 'https://search.bilibili.com/all?keyword=%E8%88%92%E7%BC%93%20%E6%99%A8%E7%BB%83', externalLabel: '看真实练法', source: 'B站真实内容' },
      { id: 'pinghe-meal', title: '清淡均衡一餐', category: '饮食类', subtitle: '不做过补，延续今天的平和节奏', coach: 'AI 食养卡', focus: '规律饮食 + 少油少腻', durationSec: 20, palette: ['#5d806b', '#c4d4a5'], externalUrl: 'https://search.bilibili.com/all?keyword=%E6%B8%85%E6%B7%A1%20%E5%AE%B6%E5%B8%B8%E8%8F%9C%20%E5%81%9A%E6%B3%95', externalLabel: '看真实食谱', source: 'B站真实内容' }
    ],
    fallback: [
      { id: 'fallback-breath', title: '一分钟舒缓呼吸', category: '运动类', subtitle: '结果不明确时，先从低负担调息开始', coach: 'AI 陪练 · 通用版', focus: '降低紧张 + 稳住节奏', durationSec: 26, palette: ['#5f7d75', '#b8b08a'], externalUrl: 'https://search.bilibili.com/all?keyword=%E8%88%92%E7%BC%93%20%E5%91%BC%E5%90%B8%20%E7%BB%83%E4%B9%A0', externalLabel: '看真实练法', source: 'B站真实内容' },
      { id: 'fallback-meal', title: '今日清养饮食建议', category: '饮食类', subtitle: '先用更稳妥的清淡吃法过渡', coach: 'AI 食养卡', focus: '清淡均衡 + 规律作息', durationSec: 20, palette: ['#6d7056', '#c0ba84'], externalUrl: 'https://search.bilibili.com/all?keyword=%E6%B8%85%E6%B7%A1%20%E9%A3%9F%E8%B0%B1', externalLabel: '看真实食谱', source: 'B站真实内容' }
    ]
  };

  function loadVideoCheckins() {
    try {
      return JSON.parse(localStorage.getItem(videoCheckinStorageKey) || '{}');
    } catch (error) {
      return {};
    }
  }

  var state = {
    faceImageDataUrl: '',
    faceImageName: '',
    tongueImageDataUrl: '',
    tongueImageName: '',
    history: [],
    busy: false,
    lastAssistantText: '',
    recognition: null,
    latestAnalysis: null,
    latestFollowUps: [],
    latestSummaryText: '',
    videoRecommendations: [],
    activeVideoIndex: 0,
    playerPhase: 'idle',
    playerElapsed: 0,
    playerCountdown: 3,
    playerTimer: 0,
    countdownTimer: 0,
    touchStartY: 0,
    checkins: loadVideoCheckins()
  };

  var elements = {
    faceImageInput: document.getElementById('faceImageInput'),
    tongueImageInput: document.getElementById('tongueImageInput'),
    facePreviewImage: document.getElementById('facePreviewImage'),
    tonguePreviewImage: document.getElementById('tonguePreviewImage'),
    facePreviewPlaceholder: document.getElementById('facePreviewPlaceholder'),
    tonguePreviewPlaceholder: document.getElementById('tonguePreviewPlaceholder'),
    imageStatus: document.getElementById('imageStatus'),
    faceStatus: document.getElementById('faceStatus'),
    tongueStatus: document.getElementById('tongueStatus'),
    clearFaceBtn: document.getElementById('clearFaceBtn'),
    clearTongueBtn: document.getElementById('clearTongueBtn'),
    knowledgeSummary: document.getElementById('knowledgeSummary'),
    knowledgeReferences: document.getElementById('knowledgeReferences'),
    quickPrompts: document.getElementById('quickPrompts'),
    stageList: document.getElementById('stageList'),
    runtimeModeTag: document.getElementById('runtimeModeTag'),
    resultSummary: document.getElementById('resultSummary'),
    resultCards: document.getElementById('resultCards'),
    actionSummary: document.getElementById('actionSummary'),
    actionChecklist: document.getElementById('actionChecklist'),
    actionStatusBadge: document.getElementById('actionStatusBadge'),
    videoSummary: document.getElementById('videoSummary'),
    videoRecommendations: document.getElementById('videoRecommendations'),
    checkinStatusBadge: document.getElementById('checkinStatusBadge'),
    messages: document.getElementById('messages'),
    suggestionRow: document.getElementById('suggestionRow'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    micBtn: document.getElementById('micBtn'),
    speakBtn: document.getElementById('speakBtn'),
    resetChatBtn: document.getElementById('resetChatBtn'),
    toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
    startVoiceGuideBtn: document.getElementById('startVoiceGuideBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    modeSelect: document.getElementById('modeSelect'),
    providerSelect: document.getElementById('providerSelect'),
    modelInput: document.getElementById('modelInput'),
    temperatureInput: document.getElementById('temperatureInput'),
    endpointInput: document.getElementById('endpointInput'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    testBackendBtn: document.getElementById('testBackendBtn'),
    backendStatus: document.getElementById('backendStatus'),
    proxyStatusBadge: document.getElementById('proxyStatusBadge'),
    companionPlayer: document.getElementById('companionPlayer'),
    closePlayerBtn: document.getElementById('closePlayerBtn'),
    playerTitle: document.getElementById('playerTitle'),
    playerMeta: document.getElementById('playerMeta'),
    playerCover: document.getElementById('playerCover'),
    playerCategoryTag: document.getElementById('playerCategoryTag'),
    playerPhaseLabel: document.getElementById('playerPhaseLabel'),
    playerCountdownText: document.getElementById('playerCountdownText'),
    playerQueueDots: document.getElementById('playerQueueDots'),
    videoProgressBar: document.getElementById('videoProgressBar'),
    videoProgressText: document.getElementById('videoProgressText'),
    followProgressBar: document.getElementById('followProgressBar'),
    followProgressText: document.getElementById('followProgressText'),
    playerFeedback: document.getElementById('playerFeedback'),
    playerTip: document.getElementById('playerTip'),
    playerPrimaryBtn: document.getElementById('playerPrimaryBtn'),
    switchVideoBtn: document.getElementById('switchVideoBtn'),
    completeCheckinBtn: document.getElementById('completeCheckinBtn')
  };

  function setPromptText(text, shouldFocus) {
    elements.userInput.value = text || '';
    if (shouldFocus) {
      elements.userInput.focus();
    }
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.onerror = function () {
        reject(new Error('图片读取失败'));
      };
      reader.readAsDataURL(file);
    });
  }

  function renderKnowledgeReferences() {
    if (!elements.knowledgeSummary || !elements.knowledgeReferences) {
      return;
    }
    elements.knowledgeSummary.textContent = '将结合《黄帝内经》相关望色、辨神、辨寒热思路，以及舌色、舌苔、津液等规则辅助判读。';
    elements.knowledgeReferences.innerHTML = '';
    (knowledgeBase.classics || []).forEach(function (item) {
      var section = document.createElement('section');
      section.className = 'knowledge-reference';
      section.innerHTML = '<h4>' + item.title + '</h4><p>' + item.summary + '</p>';
      elements.knowledgeReferences.appendChild(section);
    });
  }

  function setModeTag() {
    elements.runtimeModeTag.textContent = config.mode === 'proxy' ? 'Proxy' : (config.mode === 'remote' ? 'Remote' : 'Mock');
  }

  function renderStages(stages) {
    elements.stageList.innerHTML = '';
    stages.forEach(function (stage) {
      var li = document.createElement('li');
      li.className = 'stage-item ' + (stage.state || 'pending');
      li.innerHTML = '<span class="stage-title">' + stage.title + '</span><span class="stage-desc">' + stage.description + '</span>';
      elements.stageList.appendChild(li);
    });
  }

  function renderBusyStages() {
    renderStages([
      { title: '接收输入', description: '正在读取面部图、舌象图和当前问题。', state: 'done' },
      { title: '面部理解', description: '正在整理面色、神采与区域分布。', state: 'active' },
      { title: '舌象理解', description: '正在整理舌色、舌苔与津液线索。', state: 'pending' },
      { title: '联合判断', description: '正在结合知识库规则生成本轮回答。', state: 'pending' }
    ]);
  }

  function addMessage(role, text, meta) {
    if (role === 'system') {
      return;
    }
    var wrapper = document.createElement('article');
    wrapper.className = 'message ' + role;
    var timeText = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    wrapper.innerHTML = [
      '<div class="message-meta">',
      '<span>' + (meta && meta.title ? meta.title : (role === 'user' ? '你' : role === 'assistant' ? '中医镜子 Agent' : '系统')) + '</span>',
      '<span>' + timeText + '</span>',
      '</div>',
      '<div class="message-content"></div>'
    ].join('');
    wrapper.querySelector('.message-content').textContent = text;
    elements.messages.appendChild(wrapper);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function renderResult(result) {
    elements.resultSummary.classList.remove('empty');
    elements.resultSummary.textContent = result.summary || '本轮已完成结构化输出。';
    state.latestSummaryText = result.summary || '';
    elements.resultCards.innerHTML = '';
    (result.cards || []).forEach(function (card) {
      var block = document.createElement('section');
      block.className = 'result-block';
      var title = document.createElement('h4');
      title.textContent = card.title;
      var list = document.createElement('ul');
      (card.items || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      block.appendChild(title);
      block.appendChild(list);
      elements.resultCards.appendChild(block);
    });
    renderResultCompletionCard(result.analysis || null);
    renderActionGuide(result.analysis || null);
    renderVideoRecommendations(result.analysis || null);
  }

  function renderResultCompletionCard(analysis) {
    var existing = elements.resultCards.querySelector('[data-role="completion-card"]');
    if (existing) {
      existing.remove();
    }
    if (!analysis || !analysis.constitution) {
      return;
    }
    var allRecommendations = getRecommendationsByConstitution(analysis);
    var completedItems = allRecommendations.filter(function (item) {
      return isVideoCheckedIn(item.id);
    });
    var block = document.createElement('section');
    block.className = 'result-block';
    block.dataset.role = 'completion-card';
    var list = document.createElement('ul');
    [
      '今日已完成行动：' + completedItems.length + ' 次',
      completedItems.length ? ('已打卡内容：' + completedItems.map(function (item) { return item.title; }).join('、')) : '当前还未打卡，建议先完成一条跟练或食养行动。',
      completedItems.length ? '你已经把视觉理解推进到了实际执行，适合继续追问今晚安排或复盘建议。' : '先完成一条行动，再返回继续追问，会更符合“看见 -> 理解 -> 探索”的完整体验。'
    ].forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    var title = document.createElement('h4');
    title.textContent = '今日进展';
    block.appendChild(title);
    block.appendChild(list);
    elements.resultCards.appendChild(block);
  }

  function buildRecommendationReason(item, analysis) {
    var constitutionName = analysis && analysis.constitution && analysis.constitution.name ? analysis.constitution.name : '当前状态';
    var constitutionDesc = analysis && analysis.constitution && analysis.constitution.desc ? analysis.constitution.desc : '需要先从低负担行动开始';
    var cueText = analysis && analysis.driverCues && analysis.driverCues.length ? ('主导线索里更明显的是' + analysis.driverCues.slice(0, 2).join('、') + '。') : '';
    if (item.category === '运动类') {
      return '因为你本轮更偏“' + constitutionName + '”，当前先做一条低门槛动作更容易马上进入调节状态。' + cueText + '它重点放在' + item.focus + '，能把“看懂结果”自然接到“现在就能开始做”。';
    }
    return '因为你本轮更偏“' + constitutionName + '”，饮食建议更适合做成当下可执行的一步。' + cueText + '它围绕' + item.focus + '展开，和这次联合判断里的“' + constitutionDesc + '”是一致的。';
  }

  function renderActionGuide(analysis) {
    elements.actionChecklist.innerHTML = '';
    if (!analysis || !analysis.constitution) {
      elements.actionSummary.textContent = '完成一轮联合分析后，这里会优先告诉你今天最值得马上做的一件事，并说明为什么这样推荐。';
      elements.actionSummary.classList.add('empty');
      elements.actionStatusBadge.textContent = '待生成';
      elements.actionStatusBadge.dataset.status = 'idle';
      return;
    }

    var recommendations = getRecommendationsByConstitution(analysis);
    var primary = recommendations[0];
    var secondary = recommendations[1] || recommendations[0];
    var completedCount = recommendations.filter(function (item) {
      return isVideoCheckedIn(item.id);
    }).length;
    elements.actionSummary.classList.remove('empty');
    elements.actionSummary.textContent = completedCount ? ('今天已完成 ' + completedCount + ' 次行动。建议接着复盘“' + primary.title + '”是否最适合当前状态，再继续追问下一步。') : ('先做“' + primary.title + '”。这是把这次视觉判断转成实际帮助的第一步：先给你一件现在就能做的动作或饮食选择，再决定要不要继续深入追问。');
    elements.actionStatusBadge.textContent = completedCount ? ('已完成 ' + completedCount + ' 次') : (isVideoCheckedIn(primary.id) ? '已执行' : '建议先做');
    elements.actionStatusBadge.dataset.status = completedCount ? 'success' : (isVideoCheckedIn(primary.id) ? 'success' : 'pending');

    [
      {
        title: '现在先做',
        desc: primary.category + '：' + primary.subtitle,
        meta: [primary.title, primary.durationSec + ' 秒', analysis.driverCues && analysis.driverCues.length ? analysis.driverCues.slice(0, 2).join('、') : primary.focus]
      },
      {
        title: '做完再问',
        desc: completedCount ? '你已经完成了今天的行动闭环，可以继续追问饮食、作息或晚上怎么调，让结果进入第二轮探索。' : '完成第一步后，继续追问饮食、作息或晚上怎么调，让体验从一次判断继续展开。',
        meta: completedCount ? ['已进入持续探索', '我刚做完了，接下来还要注意什么？', '请帮我复盘今天的状态变化。'] : ['推荐追问', '我刚做完了，接下来还要注意什么？', '我晚上应该怎么调？']
      },
      {
        title: '备用路径',
        desc: '如果你现在不方便动，可以先看“' + secondary.title + '”，把建议改成更低负担的一步。',
        meta: [secondary.category, secondary.title, secondary.focus]
      }
    ].forEach(function (item) {
      var block = document.createElement('section');
      block.className = 'action-item';
      block.innerHTML = [
        '<h4>' + item.title + '</h4>',
        '<p>' + item.desc + '</p>',
        '<div class="action-meta">' + item.meta.map(function (metaItem) {
          return '<span>' + metaItem + '</span>';
        }).join('') + '</div>'
      ].join('');
      elements.actionChecklist.appendChild(block);
    });
  }

  function getTodayKey() {
    return new Date().toLocaleDateString('sv-SE');
  }

  function saveVideoCheckins() {
    localStorage.setItem(videoCheckinStorageKey, JSON.stringify(state.checkins));
  }

  function getTodayCheckins() {
    return state.checkins[getTodayKey()] || [];
  }

  function isVideoCheckedIn(videoId) {
    return getTodayCheckins().some(function (item) {
      return item.id === videoId;
    });
  }

  function buildVideoCover(item) {
    var palette = item.palette || ['#5f7d75', '#d0b17c'];
    var lines = [item.title, item.subtitle || item.focus || ''];
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">',
      '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">',
      '<stop offset="0%" stop-color="' + palette[0] + '"/>',
      '<stop offset="100%" stop-color="' + palette[1] + '"/>',
      '</linearGradient></defs>',
      '<rect width="720" height="1280" fill="url(#g)"/>',
      '<circle cx="590" cy="190" r="150" fill="rgba(255,255,255,0.12)"/>',
      '<circle cx="130" cy="1030" r="190" fill="rgba(255,255,255,0.1)"/>',
      '<text x="56" y="132" font-size="30" fill="rgba(255,255,255,0.8)" font-family="PingFang SC, Microsoft YaHei, sans-serif">' + item.category + '</text>',
      '<text x="56" y="960" font-size="60" font-weight="700" fill="#fffefb" font-family="PingFang SC, Microsoft YaHei, sans-serif">' + lines[0] + '</text>',
      '<text x="56" y="1036" font-size="30" fill="rgba(255,255,255,0.84)" font-family="PingFang SC, Microsoft YaHei, sans-serif">' + lines[1] + '</text>',
      '<text x="56" y="1148" font-size="28" fill="rgba(255,255,255,0.7)" font-family="PingFang SC, Microsoft YaHei, sans-serif">中医镜子 · 本地陪伴模拟</text>',
      '</svg>'
    ].join('');
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function getRecommendationsByConstitution(analysis) {
    var constitutionKey = analysis && analysis.constitution && analysis.constitution.key;
    var items = videoLibrary[constitutionKey] || videoLibrary.fallback;
    return items.map(function (item) {
      return Object.assign({}, item, {
        constitutionKey: constitutionKey || 'fallback',
        cover: buildVideoCover(item),
        reason: buildRecommendationReason(item, analysis)
      });
    });
  }

  function updateCheckinBadge() {
    if (!elements.checkinStatusBadge) {
      return;
    }
    if (!state.videoRecommendations.length) {
      elements.checkinStatusBadge.textContent = '未开始';
      elements.checkinStatusBadge.dataset.status = 'idle';
      return;
    }
    var completedCount = state.videoRecommendations.filter(function (item) {
      return isVideoCheckedIn(item.id);
    }).length;
    if (completedCount) {
      elements.checkinStatusBadge.textContent = '已打卡 ' + completedCount + '/' + state.videoRecommendations.length;
      elements.checkinStatusBadge.dataset.status = 'success';
      return;
    }
    elements.checkinStatusBadge.textContent = '待练习';
    elements.checkinStatusBadge.dataset.status = 'pending';
  }

  function renderVideoRecommendations(analysis) {
    state.latestAnalysis = analysis;
    elements.videoRecommendations.innerHTML = '';
    if (!analysis || !analysis.constitution) {
      state.videoRecommendations = [];
      elements.videoSummary.textContent = '完成一轮联合分析后，这里会按体质倾向推荐饮食和运动视频，并支持跟练打卡。';
      elements.videoSummary.classList.add('empty');
      updateCheckinBadge();
      return;
    }

    state.videoRecommendations = getRecommendationsByConstitution(analysis);
    elements.videoSummary.classList.remove('empty');
    var constitutionName = analysis.constitution.name || '当前体质';
    var completedCount = state.videoRecommendations.filter(function (item) {
      return isVideoCheckedIn(item.id);
    }).length;
    elements.videoSummary.textContent = '根据本轮“' + constitutionName + '”倾向，已准备 ' + state.videoRecommendations.length + ' 个推荐。你可以先在站内模拟跟练，也可以直接打开真实八段锦或食谱内容。已打卡 ' + completedCount + ' 项。';

    state.videoRecommendations.forEach(function (item, index) {
      var card = document.createElement('article');
      var done = isVideoCheckedIn(item.id);
      card.className = 'video-item';
      card.dataset.videoId = item.id;
      card.dataset.videoIndex = index;
      card.dataset.completed = done ? 'true' : 'false';
      card.innerHTML = [
        '<div class="video-thumb" style="background-image:url(\'' + item.cover + '\')">',
        '<span class="video-thumb-badge">' + item.category + '</span>',
        '</div>',
        '<div class="video-copy">',
        '<div>',
        '<h4>' + item.title + '</h4>',
        '<div class="video-meta"><span>' + item.coach + '</span><span>' + item.durationSec + ' 秒</span><span>' + item.focus + '</span></div>',
        '<p class="video-desc">' + item.subtitle + '</p>',
        '<p class="video-reason">' + item.reason + '</p>',
        '</div>',
        '<div class="video-actions">',
        '<span class="sub-note">' + (item.source || (done ? '今日已打卡' : '推荐现在开始')) + '</span>',
        '<div class="video-action-group">',
        (item.externalUrl ? ('<a class="ghost-btn" href="' + item.externalUrl + '" target="_blank" rel="noopener noreferrer">' + (item.externalLabel || '打开真实内容') + '</a>') : ''),
        '<button class="primary-btn" type="button" data-video-action="play">站内跟练</button>',
        '</div>',
        '</div>',
        '</div>'
      ].join('');
      elements.videoRecommendations.appendChild(card);
    });
    updateCheckinBadge();
  }

  function clearPlayerTimers() {
    if (state.playerTimer) {
      window.clearInterval(state.playerTimer);
      state.playerTimer = 0;
    }
    if (state.countdownTimer) {
      window.clearInterval(state.countdownTimer);
      state.countdownTimer = 0;
    }
  }

  function getCurrentVideo() {
    return state.videoRecommendations[state.activeVideoIndex] || null;
  }

  function renderQueueDots() {
    elements.playerQueueDots.innerHTML = '';
    state.videoRecommendations.forEach(function (item, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = index === state.activeVideoIndex ? 'active' : '';
      dot.setAttribute('aria-label', '切换到' + item.title);
      dot.dataset.queueIndex = index;
      elements.playerQueueDots.appendChild(dot);
    });
  }

  function updatePlayerProgress(videoPercent, followPercent, followLabel, feedback) {
    elements.videoProgressBar.style.width = videoPercent + '%';
    elements.videoProgressText.textContent = Math.round(videoPercent) + '%';
    elements.followProgressBar.style.width = followPercent + '%';
    elements.followProgressText.textContent = followLabel;
    elements.playerFeedback.textContent = feedback;
  }

  function renderPlayer() {
    var video = getCurrentVideo();
    if (!video) {
      return;
    }
    renderQueueDots();
    elements.playerTitle.textContent = video.title;
    elements.playerMeta.textContent = video.subtitle + ' · ' + video.coach;
    elements.playerCategoryTag.textContent = video.category;
    elements.playerCover.style.backgroundImage = 'url("' + video.cover + '")';
    elements.completeCheckinBtn.classList.add('hidden');
    elements.switchVideoBtn.classList.toggle('hidden', state.videoRecommendations.length < 2);

    if (state.playerPhase === 'countdown') {
      elements.playerPhaseLabel.textContent = state.playerCountdown;
      elements.playerCountdownText.textContent = '放松肩颈，倒计时结束后自动进入跟练。';
      elements.playerPrimaryBtn.textContent = '倒计时中';
      elements.playerPrimaryBtn.disabled = true;
      updatePlayerProgress(0, 0, '校准中', 'AI 正在帮你把节奏放慢，准备跟上第一个动作。');
      return;
    }

    if (state.playerPhase === 'playing') {
      var videoPercent = Math.min((state.playerElapsed / video.durationSec) * 100, 100);
      var followPercent = Math.min(62 + (videoPercent * 0.34) + ((state.playerElapsed + state.activeVideoIndex) % 6), 100);
      elements.playerPhaseLabel.textContent = '正在跟练';
      elements.playerCountdownText.textContent = '保持匀速呼吸，跟随下方进度完成这一轮。';
      elements.playerPrimaryBtn.textContent = '跟练中';
      elements.playerPrimaryBtn.disabled = true;
      updatePlayerProgress(
        videoPercent,
        followPercent,
        '完成度 ' + Math.round(followPercent) + '%',
        '你已坚持了 ' + state.playerElapsed + ' 秒，动作和呼吸都在逐步跟上，继续保持。'
      );
      return;
    }

    if (state.playerPhase === 'complete') {
      elements.playerPhaseLabel.textContent = '完成本轮';
      elements.playerCountdownText.textContent = '这次跟练已经结束，回到报告页即可形成“分析 -> 跟练 -> 打卡”的闭环。';
      elements.playerPrimaryBtn.textContent = '再练一次';
      elements.playerPrimaryBtn.disabled = false;
      elements.completeCheckinBtn.classList.remove('hidden');
      updatePlayerProgress(100, 100, '专注度稳定', '这轮练习完成得很稳，点击“打卡完成”就会返回结果页并记录今天的坚持。');
      return;
    }

    elements.playerPhaseLabel.textContent = '准备开始';
    elements.playerCountdownText.textContent = '点击“准备开始”后先倒计时 3 秒，再进入模拟跟练。';
    elements.playerPrimaryBtn.textContent = '准备开始';
    elements.playerPrimaryBtn.disabled = false;
    updatePlayerProgress(0, 0, '待开始', isVideoCheckedIn(video.id) ? '这个视频今天已经打过卡，可以再练一轮巩固节奏。' : '建议先从这一条开始，完成后回到报告页打卡。');
  }

  function openPlayer(index) {
    if (!state.videoRecommendations.length) {
      return;
    }
    clearPlayerTimers();
    state.activeVideoIndex = index >= 0 ? index : 0;
    state.playerPhase = 'ready';
    state.playerElapsed = 0;
    state.playerCountdown = 3;
    elements.companionPlayer.classList.remove('hidden');
    elements.companionPlayer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderPlayer();
  }

  function closePlayer() {
    clearPlayerTimers();
    state.playerPhase = 'idle';
    elements.companionPlayer.classList.add('hidden');
    elements.companionPlayer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function switchPlayerVideo(step) {
    if (!state.videoRecommendations.length) {
      return;
    }
    var nextIndex = (state.activeVideoIndex + step + state.videoRecommendations.length) % state.videoRecommendations.length;
    openPlayer(nextIndex);
  }

  function startPlayback() {
    var video = getCurrentVideo();
    if (!video) {
      return;
    }
    clearPlayerTimers();
    state.playerPhase = 'playing';
    state.playerElapsed = 0;
    renderPlayer();
    state.playerTimer = window.setInterval(function () {
      state.playerElapsed += 1;
      if (state.playerElapsed >= video.durationSec) {
        clearPlayerTimers();
        state.playerElapsed = video.durationSec;
        state.playerPhase = 'complete';
      }
      renderPlayer();
    }, 1000);
  }

  function startCountdown() {
    clearPlayerTimers();
    state.playerPhase = 'countdown';
    state.playerCountdown = 3;
    renderPlayer();
    state.countdownTimer = window.setInterval(function () {
      state.playerCountdown -= 1;
      if (state.playerCountdown <= 0) {
        clearPlayerTimers();
        startPlayback();
        return;
      }
      renderPlayer();
    }, 1000);
  }

  function markCurrentVideoCompleted() {
    var video = getCurrentVideo();
    var todayKey = getTodayKey();
    if (!video) {
      return;
    }
    if (!state.checkins[todayKey]) {
      state.checkins[todayKey] = [];
    }
    if (!isVideoCheckedIn(video.id)) {
      state.checkins[todayKey].push({
        id: video.id,
        title: video.title,
        constitutionKey: video.constitutionKey,
        completedAt: new Date().toISOString()
      });
      saveVideoCheckins();
    }
    renderActionGuide(state.latestAnalysis);
    renderResultCompletionCard(state.latestAnalysis);
    if (state.latestSummaryText && state.latestAnalysis && state.latestAnalysis.constitution) {
      elements.resultSummary.textContent = state.latestSummaryText + ' 今日已完成 ' + getTodayCheckins().length + ' 次行动。';
    }
    renderVideoRecommendations(state.latestAnalysis);
    var checkinMessage = '已记录今日打卡：' + video.title + '。这说明你已经把“看见状态”推进到了“开始行动”。如果你愿意，现在可以继续追问今晚怎么调，或者让 Agent 用语音再讲一遍饮食建议。';
    addMessage('assistant', checkinMessage);
    state.history.push({ role: 'assistant', text: checkinMessage });
    renderSuggestions([
      '我刚完成跟练，今晚还要注意什么？',
      '请根据我刚才的打卡，重新给我今天的饮食建议。',
      '把今天的行动建议用语音口吻再讲一遍。'
    ].concat(state.latestFollowUps || []).slice(0, 6));
    closePlayer();
  }

  function renderSuggestions(items) {
    elements.suggestionRow.innerHTML = '';
    (items || []).forEach(function (item) {
      var button = document.createElement('button');
      button.className = 'chip';
      button.type = 'button';
      button.textContent = item;
      button.addEventListener('click', function () {
        elements.userInput.value = item;
        sendTurn(item);
      });
      elements.suggestionRow.appendChild(button);
    });
  }

  function applyConfigToInputs() {
    elements.modeSelect.value = config.mode;
    elements.providerSelect.value = config.provider;
    elements.modelInput.value = config.model;
    elements.temperatureInput.value = config.temperature;
    elements.endpointInput.value = config.endpoint;
    elements.apiKeyInput.value = config.apiKey;
    setModeTag();
  }

  function saveConfigFromInputs() {
    config = Object.assign({}, config, {
      mode: elements.modeSelect.value,
      provider: elements.providerSelect.value,
      model: elements.modelInput.value.trim(),
      temperature: Number(elements.temperatureInput.value || 0.5),
      endpoint: elements.endpointInput.value.trim(),
      apiKey: elements.apiKeyInput.value.trim()
    });
    agent.updateConfig(config);
    localStorage.setItem(defaults.storageKey, JSON.stringify(config));
    setModeTag();
    if (config.mode === 'proxy') {
      elements.backendStatus.textContent = '当前为 Proxy Agent：双图与知识库摘要会一起发往本地代理。';
    } else if (config.mode === 'remote') {
      elements.backendStatus.textContent = '当前为 Remote Agent：浏览器会直连远程接口，请注意密钥暴露风险。';
    } else {
      elements.backendStatus.textContent = '当前为 Mock Agent：使用本地规则与知识库做演示。';
    }
  }

  function setProxyBadge(status, text) {
    if (!elements.proxyStatusBadge) {
      return;
    }
    elements.proxyStatusBadge.textContent = text;
    elements.proxyStatusBadge.dataset.status = status;
  }

  async function detectProxyBase() {
    var candidates = [];
    if (window.location && window.location.origin && window.location.origin.indexOf('http') === 0) {
      candidates.push(window.location.origin);
    }
    ['http://127.0.0.1:8787', 'http://127.0.0.1:8790', 'http://127.0.0.1:8791', 'http://127.0.0.1:8792', 'http://127.0.0.1:8793'].forEach(function (item) {
      if (candidates.indexOf(item) === -1) {
        candidates.push(item);
      }
    });

    for (var i = 0; i < candidates.length; i += 1) {
      var base = candidates[i];
      try {
        var response = await fetch(base + '/api/health/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          cache: 'no-store'
        });
        if (!response.ok) {
          continue;
        }
        var payload = await response.json();
        if (payload && payload.mode === 'proxy' && payload.ok) {
          return { base: base, payload: payload };
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  async function syncProxyEndpoint() {
    if (config.mode !== 'proxy') {
      setProxyBadge('idle', '未启用');
      return false;
    }

    setProxyBadge('pending', '检测中');
    var found = await detectProxyBase();
    if (!found) {
      setProxyBadge('error', '失败');
      elements.backendStatus.textContent = '未检测到可用代理。请用 server.py 启动页面，而不是只开静态页面。';
      return false;
    }

    config.endpoint = found.base + '/api/agent';
    config.healthEndpoint = found.base + '/api/health';
    config.healthCheckEndpoint = found.base + '/api/health/check';
    agent.updateConfig(config);
    localStorage.setItem(defaults.storageKey, JSON.stringify(config));
    elements.endpointInput.value = config.endpoint;
    setProxyBadge('success', '成功');
    elements.backendStatus.textContent = '代理可用。';
    return true;
  }

  async function testBackendConnection() {
    elements.backendStatus.textContent = '正在测试连接...';
    try {
      if (config.mode === 'proxy') {
        await syncProxyEndpoint();
      }
      var result = await agent.testConnection();
      if (result.mode === 'proxy') {
        setProxyBadge('success', '成功');
        elements.backendStatus.textContent = result.ok ? '代理连接成功。' : '代理连接失败。';
      } else {
        elements.backendStatus.textContent = result.message || '连接测试成功。';
      }
    } catch (error) {
      setProxyBadge('error', '失败');
      elements.backendStatus.textContent = '连接测试失败：' + error.message;
    }
  }

  function refreshImageStatus() {
    var count = 0;
    if (state.faceImageDataUrl) {
      count += 1;
    }
    if (state.tongueImageDataUrl) {
      count += 1;
    }
    elements.faceStatus.textContent = state.faceImageDataUrl ? '已上传' : '缺失';
    elements.tongueStatus.textContent = state.tongueImageDataUrl ? '已上传' : '缺失';
    if (count === 2) {
      elements.imageStatus.textContent = '双图齐全';
    } else if (count === 1) {
      elements.imageStatus.textContent = '已上传 1/2';
    } else {
      elements.imageStatus.textContent = '未上传';
    }
  }

  function setImagePreview(kind, dataUrl, name) {
    var previewImage = kind === 'face' ? elements.facePreviewImage : elements.tonguePreviewImage;
    var placeholder = kind === 'face' ? elements.facePreviewPlaceholder : elements.tonguePreviewPlaceholder;
    if (kind === 'face') {
      state.faceImageDataUrl = dataUrl;
      state.faceImageName = name || '';
    } else {
      state.tongueImageDataUrl = dataUrl;
      state.tongueImageName = name || '';
    }

    if (dataUrl) {
      previewImage.src = dataUrl;
      previewImage.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      previewImage.src = '';
      previewImage.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
    refreshImageStatus();
  }

  async function handleImageSelection(kind, file) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      window.alert('请选择图片文件。');
      return;
    }
    var dataUrl = await readFileAsDataURL(file);
    setImagePreview(kind, dataUrl, file.name);
  }

  function setBusy(nextBusy) {
    state.busy = nextBusy;
    elements.sendBtn.disabled = nextBusy;
    elements.userInput.disabled = nextBusy;
  }

  async function sendTurn(forcedText) {
    if (state.busy) {
      return;
    }
    var text = typeof forcedText === 'string' ? forcedText : elements.userInput.value.trim();
    if (!text) {
      text = '请先做一轮联合初判。';
    }

    addMessage('user', text);
    elements.userInput.value = '';
    setBusy(true);
    renderBusyStages();

    try {
      if (config.mode === 'proxy') {
        var proxyReady = await syncProxyEndpoint();
        if (!proxyReady) {
          throw new Error('没有检测到可用代理服务，请先运行 server.py。');
        }
      }
      var result = await agent.runTurn({
        text: text,
        faceImageDataUrl: state.faceImageDataUrl,
        tongueImageDataUrl: state.tongueImageDataUrl,
        history: state.history
      });
      addMessage('assistant', result.assistantMessage);
      renderStages(result.trace || []);
      renderResult(result);
      renderSuggestions(result.followUps || []);
      state.latestFollowUps = result.followUps || [];
      state.lastAssistantText = result.assistantMessage || '';
      state.history.push({ role: 'user', text: text });
      state.history.push({ role: 'assistant', text: result.assistantMessage || '' });
    } catch (error) {
      addMessage('assistant', '当前调用失败：' + error.message + '。你可以检查代理连接，或切换到 Mock 模式继续体验。');
      renderStages([{ title: '执行失败', description: error.message, state: 'done' }]);
    } finally {
      setBusy(false);
    }
  }

  function resetConversation() {
    closePlayer();
    state.history = [];
    state.lastAssistantText = '';
    state.latestAnalysis = null;
    state.latestFollowUps = [];
    state.videoRecommendations = [];
    elements.messages.innerHTML = '';
    elements.resultSummary.textContent = '上传面部图和舌象图后，Agent 会分别分析并输出联合判断。';
    elements.resultSummary.classList.add('empty');
    elements.resultCards.innerHTML = '';
    elements.actionSummary.textContent = '完成一轮联合分析后，这里会优先告诉你今天最值得马上做的一件事，并说明为什么这样推荐。';
    elements.actionSummary.classList.add('empty');
    elements.actionChecklist.innerHTML = '';
    elements.actionStatusBadge.textContent = '待生成';
    elements.actionStatusBadge.dataset.status = 'idle';
    elements.videoSummary.textContent = '完成一轮联合分析后，这里会按体质倾向推荐饮食和运动视频，并支持跟练打卡。';
    elements.videoSummary.classList.add('empty');
    elements.videoRecommendations.innerHTML = '';
    elements.suggestionRow.innerHTML = '';
    updateCheckinBadge();
    renderStages([
      { title: '等待输入', description: '建议上传面部图和舌象图后再提问。', state: 'done' },
      { title: '规则说明', description: '没有对应图片就不分析对应维度；知识库只做规则辅助。', state: 'done' }
    ]);
  }

  function toggleSpeechInput() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert('当前浏览器不支持语音输入。');
      return;
    }
    if (!state.recognition) {
      var recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript || '';
        setPromptText(transcript, true);
      };
      recognition.onerror = function () {
        window.alert('语音输入失败，请重试或改为手动输入。');
      };
      recognition.onend = function () {
        elements.micBtn.textContent = '语音提问';
        if (elements.startVoiceGuideBtn) {
          elements.startVoiceGuideBtn.textContent = '直接说：我今天该怎么调';
        }
      };
      state.recognition = recognition;
    }
    try {
      elements.micBtn.textContent = '收音中...';
      if (elements.startVoiceGuideBtn) {
        elements.startVoiceGuideBtn.textContent = '正在收音...';
      }
      state.recognition.start();
    } catch (error) {
      elements.micBtn.textContent = '语音提问';
      if (elements.startVoiceGuideBtn) {
        elements.startVoiceGuideBtn.textContent = '直接说：我今天该怎么调';
      }
    }
  }

  function speakLastAnswer() {
    if (!state.lastAssistantText) {
      window.alert('当前还没有可播报的回答。');
      return;
    }
    if (!('speechSynthesis' in window)) {
      window.alert('当前浏览器不支持语音播报。');
      return;
    }
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(state.lastAssistantText);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  }

  elements.faceImageInput.addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (file) {
      handleImageSelection('face', file).catch(function (error) {
        window.alert(error.message || '面部图片处理失败');
      });
    }
  });

  elements.tongueImageInput.addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (file) {
      handleImageSelection('tongue', file).catch(function (error) {
        window.alert(error.message || '舌象图片处理失败');
      });
    }
  });

  elements.clearFaceBtn.addEventListener('click', function () {
    elements.faceImageInput.value = '';
    setImagePreview('face', '', '');
  });

  elements.clearTongueBtn.addEventListener('click', function () {
    elements.tongueImageInput.value = '';
    setImagePreview('tongue', '', '');
  });

  elements.quickPrompts.addEventListener('click', function (event) {
    var button = event.target.closest('[data-prompt]');
    if (!button) {
      return;
    }
    sendTurn(button.getAttribute('data-prompt'));
  });

  document.addEventListener('click', function (event) {
    var voiceFill = event.target.closest('[data-voice-fill]');
    if (!voiceFill) {
      return;
    }
    setPromptText(voiceFill.getAttribute('data-voice-fill') || '', true);
  });

  elements.sendBtn.addEventListener('click', function () {
    sendTurn();
  });

  elements.videoRecommendations.addEventListener('click', function (event) {
    var actionButton = event.target.closest('[data-video-action="play"]');
    if (!actionButton) {
      return;
    }
    var card = actionButton.closest('[data-video-index]');
    if (!card) {
      return;
    }
    openPlayer(Number(card.dataset.videoIndex || 0));
  });

  elements.userInput.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      sendTurn();
    }
  });

  elements.resetChatBtn.addEventListener('click', function () {
    resetConversation();
  });

  elements.toggleSettingsBtn.addEventListener('click', function () {
    elements.settingsPanel.classList.toggle('hidden');
  });

  elements.saveSettingsBtn.addEventListener('click', function () {
    saveConfigFromInputs();
  });

  elements.testBackendBtn.addEventListener('click', function () {
    testBackendConnection();
  });

  elements.micBtn.addEventListener('click', function () {
    toggleSpeechInput();
  });

  if (elements.startVoiceGuideBtn) {
    elements.startVoiceGuideBtn.addEventListener('click', function () {
      setPromptText('我今天该怎么调？', true);
      toggleSpeechInput();
    });
  }

  elements.speakBtn.addEventListener('click', function () {
    speakLastAnswer();
  });

  elements.closePlayerBtn.addEventListener('click', function () {
    closePlayer();
  });

  elements.playerPrimaryBtn.addEventListener('click', function () {
    if (state.playerPhase === 'complete') {
      openPlayer(state.activeVideoIndex);
      return;
    }
    if (state.playerPhase === 'ready' || state.playerPhase === 'idle') {
      startCountdown();
    }
  });

  elements.switchVideoBtn.addEventListener('click', function () {
    switchPlayerVideo(1);
  });

  elements.completeCheckinBtn.addEventListener('click', function () {
    markCurrentVideoCompleted();
  });

  elements.playerQueueDots.addEventListener('click', function (event) {
    var button = event.target.closest('[data-queue-index]');
    if (!button) {
      return;
    }
    openPlayer(Number(button.dataset.queueIndex || 0));
  });

  elements.companionPlayer.addEventListener('click', function (event) {
    if (event.target === elements.companionPlayer) {
      closePlayer();
    }
  });

  elements.companionPlayer.addEventListener('touchstart', function (event) {
    if (!event.touches || !event.touches[0]) {
      return;
    }
    state.touchStartY = event.touches[0].clientY;
  }, { passive: true });

  elements.companionPlayer.addEventListener('touchend', function (event) {
    if (!event.changedTouches || !event.changedTouches[0]) {
      return;
    }
    var deltaY = event.changedTouches[0].clientY - state.touchStartY;
    if (deltaY < -60) {
      switchPlayerVideo(1);
    } else if (deltaY > 60) {
      closePlayer();
    }
  }, { passive: true });

  renderKnowledgeReferences();
  applyConfigToInputs();
  saveConfigFromInputs();
  refreshImageStatus();
  resetConversation();
  updateCheckinBadge();
  syncProxyEndpoint();
})();
