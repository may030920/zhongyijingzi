(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) {
      return outMin;
    }
    var ratio = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * ratio;
  }

  function average(list) {
    if (!list.length) {
      return 0;
    }
    return list.reduce(function (sum, value) {
      return sum + value;
    }, 0) / list.length;
  }

  function extractJSON(text) {
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      var match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return null;
      }
      try {
        return JSON.parse(match[0]);
      } catch (nestedError) {
        return null;
      }
    }
  }

  function formatHistoryForRemote(history) {
    return history.slice(-6).map(function (item) {
      return { role: item.role, content: item.text };
    });
  }

  function detectIntent(text) {
    var input = String(text || '').toLowerCase();
    if (input.indexOf('饮食') >= 0 || input.indexOf('怎么吃') >= 0 || input.indexOf('吃') >= 0) {
      return 'food';
    }
    if (input.indexOf('作息') >= 0 || input.indexOf('动作') >= 0 || input.indexOf('运动') >= 0) {
      return 'routine';
    }
    if (input.indexOf('分享') >= 0 || input.indexOf('文案') >= 0 || input.indexOf('朋友圈') >= 0) {
      return 'share';
    }
    if (input.indexOf('舌') >= 0) {
      return 'tongue';
    }
    if (input.indexOf('面') >= 0 || input.indexOf('气色') >= 0 || input.indexOf('神采') >= 0) {
      return 'face';
    }
    if (input.indexOf('为什么') >= 0 || input.indexOf('依据') >= 0 || input.indexOf('线索') >= 0) {
      return 'explain';
    }
    return 'general';
  }

  function ZhongyiMirrorAgent(config) {
    this.config = Object.assign({}, window.ZhongyiMirrorDefaults || {}, config || {});
    this.knowledge = window.ZhongyiKnowledgeBase || {
      classics: [],
      faceColorRules: [],
      faceSpiritRules: [],
      tongueColorRules: [],
      tongueCoatingRules: [],
      tongueFluidRules: [],
      constitutionMappings: [],
      caution: ''
    };
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCanvas.width = 280;
    this.analysisCanvas.height = 280;
    this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
    this.constitutions = [
      { key: 'pinghe', name: '平和质', desc: '面舌线索整体匀和、协调，偏向平稳状态。', advice: ['保持规律作息。', '饮食清淡均衡。', '继续温和运动与放松。'] },
      { key: 'qixu', name: '气虚质', desc: '色泽偏淡、神采不足或津液偏少，偏向虚弱疲态。', advice: ['先补睡眠与休息。', '饮食偏温和易消化。', '运动从轻量开始。'] },
      { key: 'yangxu', name: '阳虚质', desc: '冷感偏重、色泽偏淡偏白，偏向温煦不足。', advice: ['注意保暖。', '适量温热熟食。', '避免久处寒凉环境。'] },
      { key: 'yinxu', name: '阴虚质', desc: '偏红、偏燥、少苔或津亏线索较多，偏向内热和阴液不足。', advice: ['减少熬夜。', '饮食偏清润。', '避免连续性过度消耗。'] },
      { key: 'shire', name: '湿热质', desc: '色泽偏黄腻、苔厚或暖湿感更明显，偏向湿热。', advice: ['减少油腻辛辣。', '作息尽量清爽。', '适度活动帮助舒展。'] }
    ];
    this.zoneNames = ['左额', '印堂', '右额', '左颊', '鼻庭', '右颊', '左颌', '承浆', '右颌'];
  }

  ZhongyiMirrorAgent.prototype.updateConfig = function (nextConfig) {
    this.config = Object.assign({}, this.config, nextConfig || {});
  };

  ZhongyiMirrorAgent.prototype.loadImage = function (imageDataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error('图片加载失败'));
      };
      img.src = imageDataUrl;
    });
  };

  ZhongyiMirrorAgent.prototype.sampleRegion = function (pixels, size, xStart, yStart, width, height) {
    var x0 = clamp(Math.floor(xStart), 0, size - 1);
    var y0 = clamp(Math.floor(yStart), 0, size - 1);
    var x1 = clamp(Math.floor(xStart + width), 1, size);
    var y1 = clamp(Math.floor(yStart + height), 1, size);
    var samples = 0;
    var sumLuma = 0;
    var sumRedness = 0;
    var sumWarmth = 0;
    var sumSat = 0;
    var sumVariance = 0;

    for (var y = y0; y < y1; y += 1) {
      for (var x = x0; x < x1; x += 1) {
        var index = (y * size + x) * 4;
        var r = pixels[index];
        var g = pixels[index + 1];
        var b = pixels[index + 2];
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var luma = 0.299 * r + 0.587 * g + 0.114 * b;
        var saturation = max === 0 ? 0 : (max - min) / max;
        var redness = r - ((g + b) / 2);
        var warmth = (r - b) + ((g - b) * 0.35);
        var variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
        samples += 1;
        sumLuma += luma;
        sumRedness += redness;
        sumWarmth += warmth;
        sumSat += saturation;
        sumVariance += variance;
      }
    }

    if (!samples) {
      return { luma: 0, redness: 0, warmth: 0, saturation: 0, variance: 0 };
    }

    return {
      luma: sumLuma / samples,
      redness: sumRedness / samples,
      warmth: sumWarmth / samples,
      saturation: sumSat / samples,
      variance: sumVariance / samples
    };
  };

  ZhongyiMirrorAgent.prototype.metricLabel = function (value, lowText, midText, highText) {
    if (value < 35) {
      return lowText;
    }
    if (value < 68) {
      return midText;
    }
    return highText;
  };

  ZhongyiMirrorAgent.prototype.getKnowledgeContext = function () {
    var classics = (this.knowledge.classics || []).map(function (item) {
      return item.title + '：' + item.summary;
    });
    var faceColorRules = (this.knowledge.faceColorRules || []).map(function (item) {
      return '面部色泽规则：' + item.cue + ' -> ' + item.meaning;
    });
    var faceSpiritRules = (this.knowledge.faceSpiritRules || []).map(function (item) {
      return '面部神采规则：' + item.cue + ' -> ' + item.meaning;
    });
    var tongueColorRules = (this.knowledge.tongueColorRules || []).map(function (item) {
      return '舌色规则：' + item.cue + ' -> ' + item.meaning;
    });
    var tongueCoatingRules = (this.knowledge.tongueCoatingRules || []).map(function (item) {
      return '舌苔规则：' + item.cue + ' -> ' + item.meaning;
    });
    var tongueFluidRules = (this.knowledge.tongueFluidRules || []).map(function (item) {
      return '津液规则：' + item.cue + ' -> ' + item.meaning;
    });
    var constitutionMappings = (this.knowledge.constitutionMappings || []).map(function (item) {
      return '体质映射：' + item.constitution + ' <- ' + item.cues.join('、');
    });
    return [this.knowledge.caution || '知识库只做规则辅助。']
      .concat(classics)
      .concat(faceColorRules)
      .concat(faceSpiritRules)
      .concat(tongueColorRules)
      .concat(tongueCoatingRules)
      .concat(tongueFluidRules)
      .concat(constitutionMappings)
      .join('\n');
  };

  ZhongyiMirrorAgent.prototype.renderExplanationTemplate = function (group, index, values) {
    var templates = (this.knowledge.explanationTemplates && this.knowledge.explanationTemplates[group]) || [];
    var template = templates[index] || '';
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return values[key] || '';
    });
  };

  ZhongyiMirrorAgent.prototype.analyzeFaceImage = async function (imageDataUrl) {
    var img = await this.loadImage(imageDataUrl);
    var size = this.analysisCanvas.width;
    var scale = Math.max(size / img.width, size / img.height);
    this.analysisCtx.clearRect(0, 0, size, size);
    this.analysisCtx.drawImage(img, (size - (img.width * scale)) / 2, (size - (img.height * scale)) / 2, img.width * scale, img.height * scale);
    var pixels = this.analysisCtx.getImageData(0, 0, size, size).data;
    var centerX = size / 2;
    var centerY = size / 2;
    var radius = size * 0.41;
    var radiusSq = radius * radius;
    var samples = 0;
    var sumLuma = 0;
    var sumRedness = 0;
    var sumWarmth = 0;
    var sumSat = 0;
    var sumVariance = 0;
    var eyeContrast = 0;
    var eyeSamples = 0;

    for (var y = 0; y < size; y += 1) {
      for (var x = 0; x < size; x += 1) {
        var ox = x - centerX;
        var oy = y - centerY;
        if ((ox * ox) + (oy * oy) > radiusSq) {
          continue;
        }
        var index = (y * size + x) * 4;
        var r = pixels[index];
        var g = pixels[index + 1];
        var b = pixels[index + 2];
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var luma = 0.299 * r + 0.587 * g + 0.114 * b;
        var saturation = max === 0 ? 0 : (max - min) / max;
        var redness = r - ((g + b) / 2);
        var warmth = (r - b) + ((g - b) * 0.35);
        var variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
        samples += 1;
        sumLuma += luma;
        sumRedness += redness;
        sumWarmth += warmth;
        sumSat += saturation;
        sumVariance += variance;
        if (y < size * 0.43) {
          eyeContrast += variance;
          eyeSamples += 1;
        }
      }
    }

    var faceRect = { x: size * 0.2, y: size * 0.16, width: size * 0.6, height: size * 0.66 };
    var zoneWidth = faceRect.width / 3;
    var zoneHeight = faceRect.height / 3;
    var zones = [];
    for (var row = 0; row < 3; row += 1) {
      for (var col = 0; col < 3; col += 1) {
        var stats = this.sampleRegion(pixels, size, faceRect.x + zoneWidth * col, faceRect.y + zoneHeight * row, zoneWidth, zoneHeight);
        zones.push({
          name: this.zoneNames[(row * 3) + col],
          brightness: mapRange(stats.luma, 70, 200, 0, 100),
          redness: mapRange(stats.redness, -18, 34, 0, 100),
          warmth: mapRange(stats.warmth, -20, 52, 0, 100),
          saturation: mapRange(stats.saturation, 0.08, 0.5, 0, 100),
          contrast: mapRange(stats.variance, 18, 120, 0, 100)
        });
      }
    }

    var avgZoneBrightness = average(zones.map(function (zone) {
      return zone.brightness;
    }));
    var metrics = {
      brightness: mapRange(samples ? sumLuma / samples : 0, 70, 200, 0, 100),
      redness: mapRange(samples ? sumRedness / samples : 0, -18, 34, 0, 100),
      warmth: mapRange(samples ? sumWarmth / samples : 0, -20, 52, 0, 100),
      saturation: mapRange(samples ? sumSat / samples : 0, 0.08, 0.5, 0, 100),
      contrast: mapRange(samples ? sumVariance / samples : 0, 18, 120, 0, 100),
      eyeSpirit: mapRange(eyeSamples ? eyeContrast / eyeSamples : 0, 18, 120, 0, 100),
      zoneBalance: clamp(100 - average(zones.map(function (zone) {
        return Math.abs(zone.brightness - avgZoneBrightness) * 0.78;
      })), 0, 100)
    };

    return {
      present: true,
      metrics: metrics,
      zones: zones,
      summary: '面部图显示整体气色' + this.metricLabel(metrics.brightness, '偏淡', '较匀和', '偏明亮') + '，冷暖感' + this.metricLabel(metrics.warmth, '偏凉', '相对平衡', '偏温热') + '，神采' + this.metricLabel(metrics.eyeSpirit, '偏弱', '平稳', '较足') + '。'
    };
  };

  ZhongyiMirrorAgent.prototype.analyzeTongueImage = async function (imageDataUrl) {
    var img = await this.loadImage(imageDataUrl);
    var size = this.analysisCanvas.width;
    var scale = Math.max(size / img.width, size / img.height);
    this.analysisCtx.clearRect(0, 0, size, size);
    this.analysisCtx.drawImage(img, (size - (img.width * scale)) / 2, (size - (img.height * scale)) / 2, img.width * scale, img.height * scale);
    var pixels = this.analysisCtx.getImageData(0, 0, size, size).data;
    var stats = this.sampleRegion(pixels, size, size * 0.22, size * 0.2, size * 0.56, size * 0.62);
    var metrics = {
      colorRed: mapRange(stats.redness, -12, 30, 0, 100),
      moisture: mapRange(stats.luma, 80, 205, 0, 100),
      coating: mapRange((1 - stats.saturation) * 100, 18, 72, 0, 100),
      warmth: mapRange(stats.warmth, -18, 52, 0, 100),
      texture: mapRange(stats.variance, 12, 110, 0, 100)
    };
    var tongueType = metrics.coating > 70 ? '苔厚偏腻' : metrics.colorRed > 68 && metrics.coating < 45 ? '舌红少苔' : metrics.colorRed < 38 ? '舌淡' : '淡红舌';
    return {
      present: true,
      metrics: metrics,
      type: tongueType,
      summary: '舌象图显示舌色' + this.metricLabel(metrics.colorRed, '偏淡', '适中', '偏红') + '，舌苔' + this.metricLabel(metrics.coating, '偏薄', '适中', '偏厚') + '，津液' + this.metricLabel(metrics.moisture, '偏少', '尚可', '较足') + '。'
    };
  };

  ZhongyiMirrorAgent.prototype.buildFaceDriverCues = function (face) {
    if (!face || !face.present) {
      return [];
    }
    var metrics = face.metrics || {};
    var cues = [];
    if (metrics.brightness < 42) {
      cues.push('面部亮度偏低');
    } else if (metrics.brightness > 66) {
      cues.push('面部亮度偏高');
    }
    if (metrics.eyeSpirit < 44) {
      cues.push('神采偏弱');
    } else if (metrics.eyeSpirit > 68) {
      cues.push('神采较足');
    }
    if (metrics.warmth < 42) {
      cues.push('面部偏凉');
    } else if (metrics.warmth > 63) {
      cues.push('面部偏热');
    }
    if (metrics.redness < 40) {
      cues.push('面色偏淡');
    } else if (metrics.redness > 64) {
      cues.push('红润度偏高');
    }
    if (metrics.saturation > 64) {
      cues.push('面部油润感偏重');
    }
    if (metrics.zoneBalance < 46) {
      cues.push('面部区域明暗差异明显');
    }
    var deviatedZone = (face.zones || []).slice().sort(function (a, b) {
      return Math.abs(b.brightness - 52) - Math.abs(a.brightness - 52);
    })[0];
    if (deviatedZone) {
      cues.push(deviatedZone.name + '区域最突出');
    }
    return cues.slice(0, 4);
  };

  ZhongyiMirrorAgent.prototype.buildTongueDriverCues = function (tongue) {
    if (!tongue || !tongue.present) {
      return [];
    }
    var metrics = tongue.metrics || {};
    var cues = [];
    if (metrics.colorRed < 40) {
      cues.push('舌色偏淡');
    } else if (metrics.colorRed > 65) {
      cues.push('舌色偏红');
    }
    if (metrics.coating < 38) {
      cues.push('舌苔偏薄');
    } else if (metrics.coating > 66) {
      cues.push('舌苔偏厚腻');
    }
    if (metrics.moisture < 42) {
      cues.push('津液偏少');
    } else if (metrics.moisture > 68) {
      cues.push('津液偏足');
    }
    if (metrics.warmth < 40) {
      cues.push('舌面偏凉');
    } else if (metrics.warmth > 62) {
      cues.push('舌面偏热');
    }
    cues.push('舌象类型偏' + tongue.type);
    return cues.slice(0, 4);
  };

  ZhongyiMirrorAgent.prototype.combineAnalysis = function (face, tongue) {
    var faceMetrics = face && face.present ? face.metrics : null;
    var tongueMetrics = tongue && tongue.present ? tongue.metrics : null;
    var scores = { pinghe: 0, qixu: 0, yangxu: 0, yinxu: 0, shire: 0 };

    if (faceMetrics) {
      scores.pinghe += 92 - Math.abs(faceMetrics.brightness - 58) * 0.7 - Math.abs(faceMetrics.redness - 50) * 0.58 - Math.abs(faceMetrics.zoneBalance - 74) * 0.52;
      scores.qixu += (100 - faceMetrics.brightness) * 0.42 + (100 - faceMetrics.eyeSpirit) * 0.38 + (100 - faceMetrics.redness) * 0.22 + (100 - faceMetrics.zoneBalance) * 0.12;
      scores.yangxu += (100 - faceMetrics.warmth) * 0.45 + (100 - faceMetrics.redness) * 0.24 + (100 - faceMetrics.brightness) * 0.16;
      scores.yinxu += faceMetrics.redness * 0.34 + faceMetrics.contrast * 0.2 + (100 - faceMetrics.brightness) * 0.18 + (100 - faceMetrics.saturation) * 0.08;
      scores.shire += faceMetrics.saturation * 0.34 + faceMetrics.warmth * 0.3 + faceMetrics.redness * 0.22 + (100 - faceMetrics.zoneBalance) * 0.08;
    }

    if (tongueMetrics) {
      scores.pinghe += 88 - Math.abs(tongueMetrics.colorRed - 52) * 0.65 - Math.abs(tongueMetrics.moisture - 56) * 0.56 - Math.abs(tongueMetrics.coating - 48) * 0.52;
      scores.qixu += (100 - tongueMetrics.colorRed) * 0.28 + (100 - tongueMetrics.moisture) * 0.24 + (100 - tongueMetrics.warmth) * 0.08;
      scores.yangxu += (100 - tongueMetrics.warmth) * 0.28 + (100 - tongueMetrics.colorRed) * 0.26 + (100 - tongueMetrics.moisture) * 0.12;
      scores.yinxu += tongueMetrics.colorRed * 0.3 + (100 - tongueMetrics.coating) * 0.26 + (100 - tongueMetrics.moisture) * 0.16 + tongueMetrics.warmth * 0.08;
      scores.shire += tongueMetrics.coating * 0.36 + tongueMetrics.warmth * 0.24 + tongueMetrics.texture * 0.14 + tongueMetrics.colorRed * 0.1;
    }

    var ranked = this.constitutions.map(function (item) {
      return { item: item, score: clamp(scores[item.key], 0, 140) };
    }).sort(function (a, b) {
      return b.score - a.score;
    });
    var winner = ranked[0];
    var runnerUp = ranked[1];
    var scoreGap = Math.round(Math.max(0, winner.score - (runnerUp ? runnerUp.score : 0)));
    var confidenceFloor = faceMetrics && tongueMetrics ? 58 : 44;
    var confidence = clamp(Math.round(mapRange(scoreGap, 4, 28, confidenceFloor, 93)), 35, 95);
    var driverCues = this.buildFaceDriverCues(face).concat(this.buildTongueDriverCues(tongue)).slice(0, 5);

    var evidence = [];
    if (face && face.present) {
      evidence.push('面部气色' + this.metricLabel(face.metrics.brightness, '偏淡', '较匀和', '偏明亮'));
      evidence.push('面部冷暖感' + this.metricLabel(face.metrics.warmth, '偏凉', '相对平衡', '偏温热'));
      evidence.push('神采' + this.metricLabel(face.metrics.eyeSpirit, '偏弱', '平稳', '较足'));
    }
    if (tongue && tongue.present) {
      evidence.push('舌色' + this.metricLabel(tongue.metrics.colorRed, '偏淡', '适中', '偏红'));
      evidence.push('舌苔' + this.metricLabel(tongue.metrics.coating, '偏薄', '适中', '偏厚'));
      evidence.push('津液' + this.metricLabel(tongue.metrics.moisture, '偏少', '尚可', '较足'));
    }

    return {
      constitution: winner.item,
      confidence: confidence,
      scoreGap: scoreGap,
      secondaryConstitution: runnerUp ? runnerUp.item : null,
      driverCues: driverCues,
      face: face || { present: false, summary: '未上传面部图。', metrics: {}, zones: [] },
      tongue: tongue || { present: false, summary: '未上传舌象图。', metrics: {}, type: '未上传舌象图' },
      evidence: evidence,
      caution: this.knowledge.caution || '知识库只做规则辅助。'
    };
  };

  ZhongyiMirrorAgent.prototype.analyzeVisualInputs = async function (input) {
    var face = input.faceImageDataUrl ? await this.analyzeFaceImage(input.faceImageDataUrl) : null;
    var tongue = input.tongueImageDataUrl ? await this.analyzeTongueImage(input.tongueImageDataUrl) : null;
    if (!face && !tongue) {
      return {
        constitution: this.constitutions[0],
        confidence: 0,
        face: { present: false, summary: '未上传面部图。', metrics: {}, zones: [] },
        tongue: { present: false, summary: '未上传舌象图。', metrics: {}, type: '未上传舌象图' },
        evidence: [],
        caution: this.knowledge.caution || '知识库只做规则辅助。'
      };
    }
    return this.combineAnalysis(face, tongue);
  };

  ZhongyiMirrorAgent.prototype.buildLocalSummary = function (analysis) {
    var parts = [];
    parts.push('联合体质倾向：' + analysis.constitution.name + '（匹配度 ' + analysis.confidence + '%）');
    if (analysis.secondaryConstitution) {
      parts.push('次高倾向：' + analysis.secondaryConstitution.name + '（分差 ' + analysis.scoreGap + '）');
    }
    parts.push(analysis.face.present ? ('面部：' + analysis.face.summary) : '面部：未上传，禁止推断面部线索');
    parts.push(analysis.tongue.present ? ('舌象：' + analysis.tongue.summary + '，类型偏“' + analysis.tongue.type + '”') : '舌象：未上传，禁止虚构舌象结论');
    if (analysis.driverCues && analysis.driverCues.length) {
      parts.push('主导线索：' + analysis.driverCues.join('、'));
    }
    parts.push('知识库说明：' + analysis.caution);
    return parts.join('；');
  };

  ZhongyiMirrorAgent.prototype.buildMockResult = function (text, analysis, history) {
    var intent = detectIntent(text);
    var message = '我先按“双图规则”给你结论：';
    var faceFeature = analysis.face.present
      ? ('整体' + this.metricLabel(analysis.face.metrics.brightness, '偏淡', '较匀和', '偏明亮') + '，神采' + this.metricLabel(analysis.face.metrics.eyeSpirit, '偏弱', '平稳', '较足'))
      : '';
    var faceTendency = analysis.face.present ? analysis.constitution.name + '相关倾向' : '';
    var tongueFeature = analysis.tongue.present
      ? ('舌色' + this.metricLabel(analysis.tongue.metrics.colorRed, '偏淡', '适中', '偏红') + '，舌苔' + this.metricLabel(analysis.tongue.metrics.coating, '偏薄', '适中', '偏厚') + '，津液' + this.metricLabel(analysis.tongue.metrics.moisture, '偏少', '尚可', '较足'))
      : '';
    var tongueTendency = analysis.tongue.present ? analysis.constitution.name + '相关倾向' : '';
    var constitutionText = this.renderExplanationTemplate('constitution', 1, {
      constitution: analysis.constitution.name
    });
    if (!analysis.face.present && !analysis.tongue.present) {
      message += '你还没有上传面部图或舌象图，所以我不能进行真实视觉判断。';
    } else {
      message += '当前更接近“' + analysis.constitution.name + '”的趣味倾向。';
      if (analysis.secondaryConstitution) {
        message += ' 和“' + analysis.secondaryConstitution.name + '”相比，这次主倾向大约拉开了 ' + analysis.scoreGap + ' 分。';
      }
      if (analysis.face.present) {
        message += ' 面部方面：' + this.renderExplanationTemplate('face', 0, {
          feature: faceFeature,
          tendency: faceTendency
        });
      }
      if (analysis.tongue.present) {
        message += ' 舌象方面：' + this.renderExplanationTemplate('tongue', 0, {
          feature: tongueFeature,
          tendency: tongueTendency
        }) + ' 当前舌象更接近“' + analysis.tongue.type + '”。';
      }
      if (analysis.driverCues && analysis.driverCues.length) {
        message += ' 这次最主导的视觉线索包括：' + analysis.driverCues.join('、') + '。';
      }
      message += ' ' + constitutionText;
    }

    if (intent === 'face' && !analysis.face.present) {
      message = '你现在没有上传面部图，所以我不能解释面部气色和神采。先补一张清晰正脸，我再展开。';
    } else if (intent === 'tongue' && !analysis.tongue.present) {
      message = '你现在没有上传舌象图，所以我不能解释舌色、舌苔和津液。先补一张清晰舌象图，我再展开。';
    } else if (intent === 'food') {
      message = '如果把这次联合结果翻成饮食建议，我会围绕“' + analysis.constitution.name + '”来安排今天的吃法：' + analysis.constitution.advice[1];
    } else if (intent === 'routine') {
      message = '如果你更关心今天怎么调节，我建议从“' + analysis.constitution.name + '”对应的低负担动作与作息节律开始：' + analysis.constitution.advice[2];
    } else if (intent === 'share') {
      message = '分享版可以这样说：我用中医镜子 Agent 分别看了面部图和舌象图，它没有乱猜你没拍的部分，最后更偏“' + analysis.constitution.name + '”，还引用了中医规则来解释。';
    } else if (intent === 'explain') {
      message = '我把依据展开给你：' + (analysis.evidence.length ? analysis.evidence.join('，') : '当前没有足够图像线索') + '。另外我还会参考《黄帝内经》相关望色、辨神思路，以及舌色、舌苔、津液规则，但这些都只是规则辅助，不是医疗诊断。';
    }

    if (history.length >= 2) {
      message += ' 结合你前面的追问，我会继续沿着同一上下文回答。';
    }

    var cards = [{
      title: '联合判断',
      items: [
        '倾向：' + analysis.constitution.name,
        '匹配度：' + analysis.confidence + '%',
        analysis.secondaryConstitution ? ('次高倾向：' + analysis.secondaryConstitution.name + '（分差 ' + analysis.scoreGap + '）') : '次高倾向：当前没有可比较的第二倾向',
        analysis.driverCues && analysis.driverCues.length ? ('主导线索：' + analysis.driverCues.join('、')) : '主导线索：当前图像线索不足',
        '说明：' + analysis.constitution.desc,
        '提示：' + analysis.caution
      ]
    }];

    if (analysis.face.present) {
      cards.push({
        title: '面部线索',
        items: [
          this.renderExplanationTemplate('face', 1, {
            feature: '色泽、神采与区域分布呈现出' + faceFeature,
            tendency: faceTendency
          }),
          '九宫格最明显区域：' + (analysis.face.zones.slice().sort(function (a, b) { return Math.abs(b.brightness - 50) - Math.abs(a.brightness - 50); })[0] || { name: '无' }).name,
          '面部判断已结合色泽与神采规则进行辅助归纳。'
        ]
      });
    }

    if (analysis.tongue.present) {
      cards.push({
        title: '舌象线索',
        items: [
          this.renderExplanationTemplate('tongue', 1, {
            feature: tongueFeature,
            tendency: tongueTendency
          }),
          '舌象类型：' + analysis.tongue.type,
          '舌象判断已结合舌色、舌苔和津液规则进行辅助归纳。'
        ]
      });
    }

    cards.push({
      title: 'Agent 下一步',
      items: [analysis.constitution.advice[0], analysis.constitution.advice[1], analysis.constitution.advice[2]]
    });

    var followUps = [];
    if (!analysis.face.present) {
      followUps.push('如果我补一张面部图，你会重点看什么？');
    }
    if (!analysis.tongue.present) {
      followUps.push('如果我补一张舌象图，你会重点看什么？');
    }
    followUps = followUps.concat(['为什么你会这样判断？', '如果我换一张不同状态的照片，结果可能怎么变？', '请分别解释面部图和舌象图的依据', '结合两张图给我今天的饮食建议', '帮我整理成分享文案']);

    return {
      assistantMessage: message,
      summary: this.buildLocalSummary(analysis),
      cards: cards,
      followUps: followUps.slice(0, 6),
      trace: [
        { title: '接收输入', description: '读取面部图、舌象图和当前问题，建立会话上下文。', state: 'done' },
        { title: '分维理解', description: '只对已上传的对应图片进行面部或舌象分析。', state: 'done' },
        { title: '知识库辅助', description: '结合《黄帝内经》望色、辨神和舌诊规则进行辅助归纳。', state: 'done' },
        { title: '联合生成', description: '输出联合判断，并明确非医疗诊断。', state: 'done' }
      ],
      analysis: analysis
    };
  };

  ZhongyiMirrorAgent.prototype.callRemoteAgent = async function (params) {
    var config = this.config;
    var analysis = params.analysis;
    var userText = params.text;
    var history = params.history;
    var faceImageDataUrl = params.faceImageDataUrl;
    var tongueImageDataUrl = params.tongueImageDataUrl;
    var knowledgeContext = this.getKnowledgeContext();
    if (!config.endpoint) {
      throw new Error('缺少接口地址');
    }

    var requestBody;
    if (config.provider === 'custom-json') {
      requestBody = {
        systemPrompt: config.systemPrompt,
        userText: userText,
        faceImageDataUrl: faceImageDataUrl,
        tongueImageDataUrl: tongueImageDataUrl,
        localAnalysis: analysis,
        knowledgeContext: knowledgeContext,
        history: history
      };
    } else {
      var content = [
        { type: 'text', text: '用户问题：' + userText },
        { type: 'text', text: '本地预分析：' + this.buildLocalSummary(analysis) },
        { type: 'text', text: '规则知识库：' + knowledgeContext },
        { type: 'text', text: '要求：只有上传了对应图片才能分析对应维度；必须先分别解释面部和舌象，再做联合归纳；输出 JSON，字段为 assistantMessage, summary, cards, followUps。cards 为数组，每项包含 title 和 items。必须强调为趣味化、非医疗诊断。' }
      ];
      if (faceImageDataUrl) {
        content.push({ type: 'text', text: '下面是面部照片：' });
        content.push({ type: 'image_url', image_url: { url: faceImageDataUrl } });
      }
      if (tongueImageDataUrl) {
        content.push({ type: 'text', text: '下面是舌象照片：' });
        content.push({ type: 'image_url', image_url: { url: tongueImageDataUrl } });
      }
      requestBody = {
        model: config.model,
        temperature: Number(config.temperature || 0.5),
        messages: [{ role: 'system', content: config.systemPrompt }]
          .concat(formatHistoryForRemote(history))
          .concat([{ role: 'user', content: content }])
      };
    }

    var response = await fetch(config.endpoint, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, config.apiKey ? { Authorization: 'Bearer ' + config.apiKey } : {}),
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      var remoteErrorText = '';
      try {
        var remotePayload = await response.json();
        remoteErrorText = remotePayload.message || remotePayload.error || JSON.stringify(remotePayload);
      } catch (error) {
        try {
          remoteErrorText = await response.text();
        } catch (textError) {
          remoteErrorText = '';
        }
      }
      throw new Error('远程调用失败：HTTP ' + response.status + (remoteErrorText ? ('，' + remoteErrorText) : ''));
    }
    var data = await response.json();
    var payload = config.provider === 'custom-json'
      ? data
      : extractJSON(data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '');

    if (!payload) {
      return {
        assistantMessage: '远程模型返回了内容，但不是预期 JSON，我先把结果作为普通文本展示。',
        summary: this.buildLocalSummary(analysis),
        cards: [{ title: '本地预分析', items: [this.buildLocalSummary(analysis)] }],
        followUps: ['换个问题继续问', '让我解释视觉依据', '帮我整理成更短的话'],
        trace: [
          { title: '接收输入', description: '已读取双图与问题。', state: 'done' },
          { title: '本地预分析', description: '已生成面部、舌象和知识库摘要。', state: 'done' },
          { title: '远程调用', description: '远程模型已返回，但结构不规范。', state: 'done' },
          { title: '降级输出', description: '自动保留本地分析，继续支持多轮对话。', state: 'done' }
        ],
        analysis: analysis
      };
    }

    payload.trace = [
      { title: '接收输入', description: '已读取双图与问题。', state: 'done' },
      { title: '本地预分析', description: '已生成面部、舌象和知识库摘要，作为远程上下文。', state: 'done' },
      { title: '远程调用', description: '已将双图、多轮历史和知识库送入远程 Agent。', state: 'done' },
      { title: '生成回答', description: '远程模型已输出结构化结果。', state: 'done' }
    ];
    payload.analysis = analysis;
    return payload;
  };

  ZhongyiMirrorAgent.prototype.callProxyAgent = async function (params) {
    var config = this.config;
    var response = await fetch(config.endpoint || '/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        faceImageDataUrl: params.faceImageDataUrl,
        tongueImageDataUrl: params.tongueImageDataUrl,
        history: params.history,
        localAnalysis: params.analysis,
        knowledgeContext: this.getKnowledgeContext(),
        systemPrompt: config.systemPrompt,
        model: config.model,
        temperature: Number(config.temperature || 0.5)
      })
    });
    if (!response.ok) {
      var proxyErrorText = '';
      try {
        var proxyPayload = await response.json();
        proxyErrorText = proxyPayload.assistantMessage || proxyPayload.message || proxyPayload.error || JSON.stringify(proxyPayload);
      } catch (error) {
        try {
          proxyErrorText = await response.text();
        } catch (textError) {
          proxyErrorText = '';
        }
      }
      throw new Error('代理调用失败：HTTP ' + response.status + (proxyErrorText ? ('，' + proxyErrorText) : ''));
    }
    return await response.json();
  };

  ZhongyiMirrorAgent.prototype.testConnection = async function () {
    var config = this.config;
    if (config.mode === 'proxy') {
      var healthResponse = await fetch(config.healthCheckEndpoint || '/api/health/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!healthResponse.ok) {
        var errorPayload = null;
        try {
          errorPayload = await healthResponse.json();
        } catch (error) {
          errorPayload = null;
        }
        throw new Error((errorPayload && (errorPayload.message || errorPayload.error)) || ('代理健康检查失败：HTTP ' + healthResponse.status));
      }
      return await healthResponse.json();
    }
    if (config.mode === 'remote') {
      var response = await fetch(config.endpoint, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, config.apiKey ? { Authorization: 'Bearer ' + config.apiKey } : {}),
        body: JSON.stringify({
          model: config.model,
          temperature: 0,
          messages: [{ role: 'system', content: '你是连接测试助手。' }, { role: 'user', content: '请回复：ok' }]
        })
      });
      if (!response.ok) {
        throw new Error('远程接口测试失败：HTTP ' + response.status);
      }
      return { ok: true, mode: 'remote', message: '远程接口请求成功。' };
    }
    return { ok: true, mode: 'mock', message: 'Mock 模式无需远程连接。' };
  };

  ZhongyiMirrorAgent.prototype.runTurn = async function (input) {
    var text = input.text || '请先做一轮联合判断';
    var history = input.history || [];
    var analysis = await this.analyzeVisualInputs({
      faceImageDataUrl: input.faceImageDataUrl || '',
      tongueImageDataUrl: input.tongueImageDataUrl || ''
    });

    if (this.config.mode === 'proxy') {
      try {
        return await this.callProxyAgent({
          text: text,
          faceImageDataUrl: input.faceImageDataUrl || '',
          tongueImageDataUrl: input.tongueImageDataUrl || '',
          history: history,
          analysis: analysis
        });
      } catch (error) {
        var proxyFallback = this.buildMockResult(text, analysis, history);
        proxyFallback.assistantMessage = '代理后端调用失败，我先切回本地 Mock 模式继续回答。原因：' + error.message + '\n\n' + proxyFallback.assistantMessage;
        proxyFallback.trace[2] = { title: '代理调用', description: '本地代理未连通上游，已自动降级到 Mock Agent。', state: 'done' };
        return proxyFallback;
      }
    }

    if (this.config.mode === 'remote') {
      try {
        return await this.callRemoteAgent({
          text: text,
          faceImageDataUrl: input.faceImageDataUrl || '',
          tongueImageDataUrl: input.tongueImageDataUrl || '',
          history: history,
          analysis: analysis
        });
      } catch (error) {
        var fallback = this.buildMockResult(text, analysis, history);
        fallback.assistantMessage = '远程 Agent 调用失败，我先切回本地 Mock 模式继续回答。原因：' + error.message + '\n\n' + fallback.assistantMessage;
        fallback.trace[2] = { title: '远程调用', description: '调用失败，已自动降级到本地 Mock Agent。', state: 'done' };
        return fallback;
      }
    }

    return this.buildMockResult(text, analysis, history);
  };

  window.ZhongyiMirrorAgent = ZhongyiMirrorAgent;
})();
