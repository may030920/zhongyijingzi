(function () {
  window.ZhongyiKnowledgeBase = {
    caution: '知识库用于规则辅助与提示增强，不构成医学诊断。',
    classics: [
      {
        title: '《黄帝内经》望色思路',
        summary: '重视视其外应以知其内藏，强调面色、神气、形态变化与寒热虚实之间的对应。'
      },
      {
        title: '《黄帝内经》辨神思路',
        summary: '强调得神者昌，观察眼神、神采、气色是否协调，用于辅助判断整体盛衰。'
      },
      {
        title: '舌诊常用规则',
        summary: '关注舌质色泽、舌苔厚薄润燥、津液多少与寒热虚实、湿燥偏向之间的关系。'
      }
    ],
    faceColorRules: [
      { cue: '面色偏白偏淡', meaning: '常作为气血不足、阳气偏弱的辅助线索。' },
      { cue: '面色偏红或局部热象明显', meaning: '常作为偏热、阴液不足的辅助线索。' },
      { cue: '面色黄浊、油亮或闷重', meaning: '可作为湿热、痰湿倾向的辅助线索。' },
      { cue: '色泽匀净、明润、不过偏', meaning: '多作为平和状态的辅助参考。' }
    ],
    faceSpiritRules: [
      { cue: '眼周清亮、神采协调', meaning: '多作为得神、整体状态较平稳的辅助参考。' },
      { cue: '神采不足、目光乏力', meaning: '可作为气虚、疲态或整体偏弱的辅助线索。' },
      { cue: '局部反差过强、燥热感重', meaning: '可作为偏热、阴虚内热的辅助线索。' }
    ],
    tongueColorRules: [
      { cue: '淡红舌', meaning: '常作为相对平和的常见参考表现。' },
      { cue: '舌淡', meaning: '可作为气虚、血虚或阳虚的辅助线索。' },
      { cue: '舌红', meaning: '可作为偏热、阴虚内热的辅助线索。' },
      { cue: '舌暗或瘀滞感', meaning: '可提示气血运行不畅的辅助可能。' }
    ],
    tongueCoatingRules: [
      { cue: '薄白苔', meaning: '多作为常见平和参考。' },
      { cue: '少苔或剥苔', meaning: '可作为津液不足、阴虚偏燥的辅助线索。' },
      { cue: '厚腻苔', meaning: '可作为湿浊、痰湿或湿热偏盛的辅助线索。' },
      { cue: '黄苔', meaning: '可作为里热或湿热倾向的辅助线索。' }
    ],
    tongueFluidRules: [
      { cue: '津液较足、舌面润泽', meaning: '多见于津液尚可的参考状态。' },
      { cue: '舌面偏干、津少', meaning: '可作为燥热、阴虚或体液偏亏的辅助线索。' },
      { cue: '滑润偏重', meaning: '可作为寒湿、痰湿倾向的辅助参考。' }
    ],
    constitutionMappings: [
      {
        constitution: '平和质',
        cues: ['面色匀净', '神采平稳', '淡红舌', '薄白苔', '津液尚可']
      },
      {
        constitution: '气虚质',
        cues: ['面色偏淡', '神采不足', '舌淡', '津液偏少', '整体偏疲']
      },
      {
        constitution: '阳虚质',
        cues: ['面色偏白', '暖感不足', '舌淡润', '寒感偏重']
      },
      {
        constitution: '阴虚质',
        cues: ['面颊偏红', '燥热感较强', '舌红少苔', '舌面偏干']
      },
      {
        constitution: '湿热质',
        cues: ['面色黄浊或油亮', '闷热感重', '舌苔厚腻或黄', '湿热线索并见']
      }
    ],
    explanationTemplates: {
      face: [
        '从面部来看，整体{feature}，这在望色上更常被当作{tendency}的辅助线索。',
        '从神采和区域分布来看，{feature}，因此面部判断更偏向{tendency}。'
      ],
      tongue: [
        '从舌象来看，当前表现为{feature}，这在舌诊里常作为{tendency}的辅助参考。',
        '结合舌色、舌苔和津液线索，舌象部分更提示{tendency}。'
      ],
      constitution: [
        '把面部与舌象线索合在一起看，当前更接近{constitution}的趣味化倾向。',
        '综合两张图的规则线索，最终更偏向{constitution}，但这仍是规则辅助而非医疗诊断。'
      ]
    }
  };
})();
