(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['pipAPI', 'pipScorer', 'underscore'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.STIATFormal = factory();
  }
}(this, function (APIConstructor, Scorer, _) {
  'use strict';

  var FORMAL_STIMULI = {
    institution: ['衛生署', '衛生防護中心', '政府醫院', '基層醫療系統', '公營醫院', '公共醫療機構'],
    trust_ability: ['能力出眾', '有章法'],
    trust_benevolence: ['關懷的', '善解人意'],
    trust_integrity: ['公平的', '言行一致'],
    distrust_ability: ['濫竽充數', '失職的'],
    distrust_benevolence: ['漠不關心', '惡意的'],
    distrust_integrity: ['不道德的', '欺騙的']
  };

  var STIMULUS_TYPE = {
    institution: 'institution',
    trust_ability: 'trustworthy',
    trust_benevolence: 'trustworthy',
    trust_integrity: 'trustworthy',
    distrust_ability: 'not_trustworthy',
    distrust_benevolence: 'not_trustworthy',
    distrust_integrity: 'not_trustworthy'
  };

  var ROUND_SPECS = [
    {
      block: 1,
      label: 'block1_practice_pos',
      phase: 'practice',
      condition: 'POS',
      includeInD: false,
      subBlockSize: 12,
      counts: {
        institution: 3,
        trust_ability: 1,
        trust_benevolence: 1,
        trust_integrity: 1,
        distrust_ability: 2,
        distrust_benevolence: 2,
        distrust_integrity: 2
      }
    },
    {
      block: 2,
      label: 'block2_test_pos',
      phase: 'test',
      condition: 'POS',
      includeInD: true,
      subBlockSize: 21,
      counts: {
        institution: 12,
        trust_ability: 4,
        trust_benevolence: 4,
        trust_integrity: 4,
        distrust_ability: 6,
        distrust_benevolence: 6,
        distrust_integrity: 6
      }
    },
    {
      block: 3,
      label: 'block3_practice_neg',
      phase: 'practice',
      condition: 'NEG',
      includeInD: false,
      subBlockSize: 12,
      counts: {
        institution: 3,
        trust_ability: 2,
        trust_benevolence: 2,
        trust_integrity: 2,
        distrust_ability: 1,
        distrust_benevolence: 1,
        distrust_integrity: 1
      }
    },
    {
      block: 4,
      label: 'block4_test_neg',
      phase: 'test',
      condition: 'NEG',
      includeInD: true,
      subBlockSize: 21,
      counts: {
        institution: 12,
        trust_ability: 6,
        trust_benevolence: 6,
        trust_integrity: 6,
        distrust_ability: 4,
        distrust_benevolence: 4,
        distrust_integrity: 4
      }
    }
  ];

  function shallowMerge(target, source) {
    var out = {};
    var key;
    target = target || {};
    source = source || {};
    for (key in target) if (Object.prototype.hasOwnProperty.call(target, key)) out[key] = target[key];
    for (key in source) if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
    return out;
  }

  function shuffleInPlace(arr, random) {
    random = random || Math.random;
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function hasRunOfFourOrMore(slots) {
    var runSide = null;
    var runLength = 0;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].side === runSide) {
        runLength += 1;
      } else {
        runSide = slots[i].side;
        runLength = 1;
      }
      if (runLength >= 4) return true;
    }
    return false;
  }

  function buildWordQueues(stimuli, random) {
    var queues = {};
    var category;
    for (category in stimuli) {
      if (Object.prototype.hasOwnProperty.call(stimuli, category)) {
        queues[category] = [];
      }
    }
    return {
      next: function (category) {
        if (!queues[category] || queues[category].length === 0) {
          queues[category] = shuffleInPlace(stimuli[category].slice(), random);
        }
        return queues[category].shift();
      }
    };
  }

  function sideForCategory(condition, category) {
    var isTrust = category.indexOf('trust_') === 0;
    var isDistrust = category.indexOf('distrust_') === 0;

    if (condition === 'POS') {
      if (category === 'institution' || isTrust) return 'left';
      if (isDistrust) return 'right';
    }

    if (condition === 'NEG') {
      if (isTrust) return 'left';
      if (category === 'institution' || isDistrust) return 'right';
    }

    throw new Error('Unknown condition/category combination: ' + condition + '/' + category);
  }

  function buildSlots(spec) {
    var slots = [];
    var category;
    for (category in spec.counts) {
      if (Object.prototype.hasOwnProperty.call(spec.counts, category)) {
        for (var i = 0; i < spec.counts[category]; i++) {
          slots.push({
            block: spec.block,
            round: spec.label,
            phase: spec.phase,
            condition: spec.condition,
            category: category,
            type: STIMULUS_TYPE[category],
            side: sideForCategory(spec.condition, category),
            includeInD: spec.includeInD
          });
        }
      }
    }
    return slots;
  }

  function randomizedSlotsWithoutRuns(slots, random) {
    var candidate;
    for (var attempt = 0; attempt < 5000; attempt++) {
      candidate = shuffleInPlace(slots.slice(), random);
      if (!hasRunOfFourOrMore(candidate)) return candidate;
    }
    throw new Error('Could not randomize trials while preventing 4-trial same-side runs.');
  }

  function assignWords(slots, stimuli, random, subBlockSize) {
    var queues = buildWordQueues(stimuli, random);
    return slots.map(function (slot, index) {
      var trial = shallowMerge(slot, {
        word: queues.next(slot.category),
        trialInRound: index + 1,
        subBlock: Math.floor(index / subBlockSize) + 1
      });
      return trial;
    });
  }

  function hasAdjacentDuplicateWords(trials) {
    for (var i = 1; i < trials.length; i++) {
      if (trials[i].word === trials[i - 1].word) return true;
    }
    return false;
  }

  function splitSubBlocks(trials, subBlockSize) {
    var blocks = [];
    for (var i = 0; i < trials.length; i += subBlockSize) {
      blocks.push(trials.slice(i, i + subBlockSize));
    }
    return blocks;
  }

  function createFormalTrialPlan(options) {
    options = options || {};
    var random = options.random || Math.random;
    var stimuli = options.stimuli || FORMAL_STIMULI;

    return ROUND_SPECS.map(function (spec) {
      var slots;
      var trials;
      for (var attempt = 0; attempt < 5000; attempt++) {
        slots = randomizedSlotsWithoutRuns(buildSlots(spec), random);
        trials = assignWords(slots, stimuli, random, spec.subBlockSize);
        if (!hasAdjacentDuplicateWords(trials)) break;
      }
      if (hasAdjacentDuplicateWords(trials)) {
        throw new Error('Could not randomize trials while preventing adjacent duplicate words.');
      }
      var subBlocks = splitSubBlocks(trials, spec.subBlockSize);
      return {
        block: spec.block,
        label: spec.label,
        phase: spec.phase,
        condition: spec.condition,
        includeInD: spec.includeInD,
        trials: trials,
        subBlocks: subBlocks
      };
    });
  }

  function createInstructionHTML(round, isTouch) {
    var startText = isTouch ? '準備好後，請點擊屏幕綠色區域開始。' : '準備好後，請按 <b>空格鍵</b> 開始。';
    var responseText = isTouch ? '點按左側' : '按 <b>E</b> 鍵';
    var rightText = isTouch ? '點按右側' : '按 <b>I</b> 鍵';
    var leftLine;
    var rightLine;

    if (round.condition === 'POS') {
      leftLine = '屬於 <b>可信</b> 或 <b>健康機構</b> 的詞語，請' + responseText + '。';
      rightLine = '屬於 <b>不可信</b> 的詞語，請' + rightText + '。';
    } else {
      leftLine = '屬於 <b>可信</b> 的詞語，請' + responseText + '。';
      rightLine = '屬於 <b>不可信</b> 或 <b>健康機構</b> 的詞語，請' + rightText + '。';
    }

    return '<div style="font-size:' + (isTouch ? '17px' : '20px') + ';line-height:1.75">' +
      '<p style="text-align:center"><u>第 ' + round.block + ' 部分（共 4 部分）</u></p>' +
      '<p><b>請在保持準確的情況下，盡量快速地將詞語歸類。</b></p>' +
      '<p>' + leftLine + '<br/>' + rightLine + '</p>' +
      '<p>如按錯，畫面會顯示紅色 <b style="color:red">X</b>，請改按正確的反應後繼續。</p>' +
      '<p><b>' + startText + '</b></p>' +
      '</div>';
  }

  function factoryExports() {
    return {
      FORMAL_STIMULI: FORMAL_STIMULI,
      ROUND_SPECS: ROUND_SPECS,
      STIMULUS_TYPE: STIMULUS_TYPE,
      createFormalTrialPlan: createFormalTrialPlan,
      hasRunOfFourOrMore: hasRunOfFourOrMore,
      hasAdjacentDuplicateWords: hasAdjacentDuplicateWords,
      sideForCategory: sideForCategory
    };
  }

  if (!APIConstructor) return factoryExports();

  function stiatExtension(options) {
    options = options || {};

    var API = new APIConstructor();
    var scorer = new Scorer();
    var piCurrent = API.getCurrent();
    var uniformCss = {color: '#000000', 'font-size': '3em'};
    var stiatObj = {
      canvas: {
        maxWidth: 725,
        proportions: 0.7,
        background: '#ffffff',
        borderWidth: 5,
        canvasBackground: '#ffffff',
        borderColor: 'lightblue'
      },
      category: {
        name: 'institution',
        title: {media: {word: '健康機構'}, css: uniformCss, height: 7},
        css: uniformCss
      },
      attribute1: {
        name: 'trustworthy',
        title: {media: {word: '可信'}, css: uniformCss, height: 7},
        css: uniformCss
      },
      attribute2: {
        name: 'not_trustworthy',
        title: {media: {word: '不可信'}, css: uniformCss, height: 7},
        css: uniformCss
      },
      isTouch: false,
      ITIDuration: 250,
      fontColor: '#000000',
      leftKeyText: '按 E 鍵',
      rightKeyText: '按 I 鍵',
      leftKeyTextTouch: '點按左側',
      rightKeyTextTouch: '點按右側',
      keysCss: {'font-size': '1.3em', 'font-family': 'monospace', color: '#000000'},
      orText: '或',
      orCss: {'font-size': '1.4em', color: '#000000'},
      remindErrorText: '<p style="text-align:center;font-size:1.5em">如果按錯，畫面會顯示紅色 <b style="color:red">X</b>。<br/>請即時改按正確反應以繼續。</p>',
      finalText: '任務已完成。<br/><br/>請繼續。'
    };

    if (_) _.extend(piCurrent, _.defaults(options, stiatObj));
    else piCurrent = shallowMerge(stiatObj, options);

    var isTouch = !!piCurrent.isTouch;
    var leftCue = isTouch ? piCurrent.leftKeyTextTouch : piCurrent.leftKeyText;
    var rightCue = isTouch ? piCurrent.rightKeyTextTouch : piCurrent.rightKeyText;
    var trialPlan = createFormalTrialPlan({stimuli: piCurrent.formalStimuli || FORMAL_STIMULI});
    var block2Condition = 'positive_first';

    if (isTouch) {
      piCurrent.canvas = shallowMerge(piCurrent.canvas, {maxWidth: 420, proportions: 1.25});
    }

    API.addSettings('onEnd', window.minnoJS.onEnd);
    API.addSettings('logger', {
      onRow: function (logName, log, settings, ctx) {
        if (!ctx.logs) ctx.logs = [];
        ctx.logs.push(log);
      },
      onEnd: function (name, settings, ctx) {
        return ctx.logs;
      },
      serialize: function (name, logs) {
        var headers = ['block', 'trial', 'round', 'cond', 'type', 'cat', 'stim', 'resp', 'err', 'rt', 'd', 'bOrd'];
        var rows = [];

        for (var i = 0; i < logs.length; i++) {
          var log = logs[i];
          if (!hasProperties(log, ['trial_id', 'responseHandle', 'media', 'latency', 'data'])) continue;
          if (!hasProperties(log.data, ['block', 'round', 'condition', 'stimulus_type', 'stimulus_category', 'score'])) continue;
          rows.push([
            log.data.block,
            log.trial_id,
            log.data.round,
            log.data.condition,
            log.data.stimulus_type,
            log.data.stimulus_category,
            log.media[0],
            log.responseHandle,
            log.data.score,
            log.latency,
            '',
            ''
          ]);
        }

        rows.push([9, 999, 'end', 'end', '', '', '', '', '', '', piCurrent.d || '', block2Condition]);
        rows.unshift(headers);
        return toCsv(rows);

        function hasProperties(obj, props) {
          for (var iProp = 0; iProp < props.length; iProp++) {
            if (!obj || !Object.prototype.hasOwnProperty.call(obj, props[iProp])) return false;
          }
          return true;
        }
        function toCsv(matrix) { return matrix.map(buildRow).join('\n'); }
        function buildRow(arr) { return arr.map(normalize).join(','); }
        function normalize(val) {
          val = (val === undefined || val === null) ? '' : String(val);
          if (/(\n|,|")/.test(val)) return '"' + val.replace(/"/g, '""') + '"';
          return val;
        }
      },
      send: function (name, serialized) {
        window.minnoJS.logger(serialized);
      }
    });

    var comboLayoutPOS = [
      {location: {left: 6, top: 1}, media: {word: leftCue}, css: piCurrent.keysCss},
      {location: {right: 6, top: 1}, media: {word: rightCue}, css: piCurrent.keysCss},
      {location: {left: 6, top: 4}, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css},
      {location: {left: 6, top: 4 + (piCurrent.attribute1.title.height | 4) + 4}, media: {word: piCurrent.orText}, css: piCurrent.orCss},
      {location: {left: 6, top: 11 + (piCurrent.attribute1.title.height | 4)}, media: piCurrent.category.title.media, css: piCurrent.category.title.css},
      {location: {right: 6, top: 4}, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css}
    ];

    var comboLayoutNEG = [
      {location: {left: 6, top: 1}, media: {word: leftCue}, css: piCurrent.keysCss},
      {location: {right: 6, top: 1}, media: {word: rightCue}, css: piCurrent.keysCss},
      {location: {left: 6, top: 4}, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css},
      {location: {right: 6, top: 4}, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css},
      {location: {right: 6, top: 4 + (piCurrent.attribute2.title.height | 4) + 4}, media: {word: piCurrent.orText}, css: piCurrent.orCss},
      {location: {right: 6, top: 11 + (piCurrent.attribute2.title.height | 4)}, media: piCurrent.category.title.media, css: piCurrent.category.title.css}
    ];

    var touchInputStimuli = [
      {data: {handle: 'leftTapZone'}, size: {width: 50}, location: {left: 0, top: 0, bottom: 0}, css: {opacity: 0.04, background: '#4da6ff', border: '3px solid #0066cc', zIndex: 999}, media: {word: ' '}},
      {data: {handle: 'rightTapZone'}, size: {width: 50}, location: {right: 0, top: 0, bottom: 0}, css: {opacity: 0.04, background: '#ff944d', border: '3px solid #cc5200', zIndex: 999}, media: {word: ' '}}
    ];

    var reminderStimulus = {
      location: {bottom: 1},
      css: {color: piCurrent.fontColor, 'font-size': '1em'},
      media: {html: piCurrent.remindErrorText}
    };

    API.addSettings('canvas', piCurrent.canvas);
    API.addSettings('base_url', piCurrent.base_url);

    API.addTrialSets('sort', {
      data: {score: 0},
      input: [
        {handle: 'skip1', on: 'keypressed', key: 27},
        isTouch ? {handle: 'left', on: 'click', stimHandle: 'leftTapZone'} : {handle: 'left', on: 'keypressed', key: 'e'},
        isTouch ? {handle: 'right', on: 'click', stimHandle: 'rightTapZone'} : {handle: 'right', on: 'keypressed', key: 'i'}
      ],
      interactions: [
        {
          conditions: [{type: 'begin'}],
          actions: [{type: 'showStim', handle: 'targetStim'}].concat(isTouch ? [
            {type: 'showStim', handle: 'leftTapZone'},
            {type: 'showStim', handle: 'rightTapZone'}
          ] : [])
        },
        {
          conditions: [
            {type: 'inputEqualsTrial', property: 'corResp', negate: true},
            {type: 'inputEquals', value: ['right', 'left']}
          ],
          actions: [
            {type: 'showStim', handle: 'error'},
            {type: 'setTrialAttr', setter: {score: 1}}
          ]
        },
        {
          conditions: [{type: 'inputEqualsTrial', property: 'corResp'}],
          actions: [
            {type: 'removeInput', handle: ['left', 'right']},
            {type: 'hideStim', handle: 'All'},
            {type: 'log'},
            {type: 'setInput', input: {handle: 'end', on: 'timeout', duration: piCurrent.ITIDuration}}
          ]
        },
        {conditions: [{type: 'inputEquals', value: 'end'}], actions: [{type: 'endTrial'}]},
        {conditions: [{type: 'inputEquals', value: 'skip1'}], actions: [{type: 'setInput', input: {handle: 'skip2', on: 'enter'}}]},
        {conditions: [{type: 'inputEquals', value: 'skip2'}], actions: [{type: 'goto', destination: 'nextWhere', properties: {blockStart: true}}, {type: 'endTrial'}]}
      ]
    });

    API.addTrialSets('instructions', [{
      data: {blockStart: true, block: 0, condition: 'inst', score: 0},
      input: isTouch ? [{handle: 'continue', on: 'click', stimHandle: 'continueTapZone'}] : [{handle: 'space', on: 'space'}],
      interactions: [
        {conditions: [{type: 'begin'}], actions: [{type: 'showStim', handle: 'All'}]},
        {conditions: [{type: 'inputEquals', value: isTouch ? 'continue' : 'space'}], actions: [{type: 'hideStim', handle: 'All'}, {type: 'trigger', handle: 'endTrial', duration: 300}]},
        {conditions: [{type: 'inputEquals', value: 'endTrial'}], actions: [{type: 'endTrial'}]}
      ]
    }]);

    API.addStimulusSets({
      Default: [{
        css: {color: '#000000', 'font-size': '3em', background: '#ffffff', padding: '0.4em 0.8em', 'border-radius': '8px', display: 'inline-block'}
      }],
      instructions: [
        {css: {'font-size': '1.4em', color: 'black', lineHeight: 1.2}, nolog: true, location: {bottom: 1}}
      ],
      error: [
        {data: {handle: 'error'}, location: {top: 70}, css: {color: 'red', 'font-size': '4em'}, media: {word: 'X'}, nolog: true}
      ]
    });

    function layoutFor(condition) {
      var base = condition === 'POS' ? comboLayoutPOS : comboLayoutNEG;
      return base.concat(isTouch ? touchInputStimuli : []).concat(reminderStimulus);
    }

    function trialToMinnoTrial(trial) {
      return {
        inherit: 'sort',
        data: {
          block: trial.block,
          round: trial.round,
          condition: trial.condition,
          stimulus_type: trial.type,
          stimulus_category: trial.category,
          corResp: trial.side,
          score: 0,
          parcel: trial.includeInD ? 'dscore' : 'practice',
          sub_block: trial.subBlock
        },
        layout: layoutFor(trial.condition),
        stimuli: [
          {
            data: {handle: 'targetStim', alias: trial.category},
            css: {color: '#000000', 'font-size': '3em', background: '#ffffff', padding: '0.4em 0.8em', 'border-radius': '8px', display: 'inline-block'},
            media: {word: trial.word}
          },
          {inherit: {set: 'error'}}
        ]
      };
    }

    function instructionTrial(round) {
      var stimuli = [
        {inherit: 'instructions', media: {html: createInstructionHTML(round, isTouch)}},
        {data: {handle: 'dummy', alias: 'dummy'}, media: {word: ' '}, location: {top: 1}}
      ];
      if (isTouch) {
        stimuli.push({data: {handle: 'continueTapZone'}, size: {}, location: {left: 0, right: 0, top: 0, bottom: 0}, css: {opacity: 0.05, background: '#00ff00', border: '2px solid #008000', zIndex: 999}, media: {word: ' '}});
      }
      return {inherit: 'instructions', data: {blockStart: true}, layout: [], stimuli: stimuli};
    }

    var trialSequence = [];
    for (var iRound = 0; iRound < trialPlan.length; iRound++) {
      trialSequence.push(instructionTrial(trialPlan[iRound]));
      for (var iSub = 0; iSub < trialPlan[iRound].subBlocks.length; iSub++) {
        var subBlockTrials = trialPlan[iRound].subBlocks[iSub].map(trialToMinnoTrial);
        for (var iTrial = 0; iTrial < subBlockTrials.length; iTrial++) {
          trialSequence.push(subBlockTrials[iTrial]);
        }
      }
    }

    trialSequence.push({
      inherit: 'instructions',
      data: {blockStart: true},
      layout: [],
      stimuli: [
        {inherit: 'instructions', media: {html: '<div style="font-size:20px;line-height:1.6;text-align:center">' + piCurrent.finalText + '</div>'}},
        {data: {handle: 'dummy', alias: 'dummy'}, media: {word: ' '}, location: {top: 1}}
      ].concat(isTouch ? [{data: {handle: 'continueTapZone'}, size: {}, location: {left: 0, right: 0, top: 0, bottom: 0}, css: {opacity: 0.05, background: '#00ff00', border: '2px solid #008000', zIndex: 999}, media: {word: ' '}}] : [])
    });

    API.addSequence(trialSequence);

    scorer.addSettings('compute', {
      ErrorVar: 'score',
      condVar: 'condition',
      cond1VarValues: ['POS'],
      cond2VarValues: ['NEG'],
      parcelVar: 'parcel',
      parcelValue: ['dscore'],
      fastRT: 150,
      maxFastTrialsRate: 0.1,
      minRT: 400,
      maxRT: 10000,
      errorLatency: {use: 'latency', penalty: 600, useForSTD: true},
      postSettings: {score: 'score', msg: 'feedback', url: '/implicit/scorer'}
    });

    scorer.addSettings('message', {
      MessageDef: [
        {cut: '5', message: ''}
      ]
    });

    API.addSettings('hooks', {
      endTask: function () {
        var DScoreObj = scorer.computeD();
        piCurrent.d = DScoreObj.DScore;
        window.minnoJS.onEnd();
      }
    });

    return API.script;
  }

  stiatExtension.createFormalTrialPlan = createFormalTrialPlan;
  stiatExtension.FORMAL_STIMULI = FORMAL_STIMULI;
  stiatExtension.ROUND_SPECS = ROUND_SPECS;
  stiatExtension.hasRunOfFourOrMore = hasRunOfFourOrMore;
  stiatExtension.hasAdjacentDuplicateWords = hasAdjacentDuplicateWords;
  return stiatExtension;
}));
