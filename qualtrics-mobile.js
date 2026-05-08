Qualtrics.SurveyEngine.addOnload(function () {
  var q = this;
  var container = q.getQuestionContainer();

  var inner = container.querySelector('.Inner');
  if (inner) inner.style.display = 'none';
  q.hideNextButton();

  var canvas = document.createElement('div');
  canvas.id = 'minno-canvas';
  canvas.style.width = '100%';
  canvas.style.height = '88vh';
  canvas.style.overflow = 'hidden';
  container.appendChild(canvas);

  function showError(msg, err) {
    canvas.innerHTML =
      '<div style="padding:20px;color:#b00020;font-size:15px;line-height:1.5;">' +
      msg +
      '</div>';
    if (err) console.error(err);
  }

  function setEmbeddedData(name, value) {
    if (q && q.setEmbeddedData) {
      q.setEmbeddedData(name, value);
    } else if (window.Qualtrics && Qualtrics.SurveyEngine && Qualtrics.SurveyEngine.setEmbeddedData) {
      Qualtrics.SurveyEngine.setEmbeddedData(name, value);
    }
  }

  function storeScoreFields(csv) {
    var lines = String(csv || '').trim().split(/\r?\n/);
    var headers = lines[0] ? lines[0].split(',') : [];
    var endRow = null;
    for (var i = lines.length - 1; i >= 1; i--) {
      if (lines[i].indexOf('9,999,end,end,') === 0) {
        endRow = lines[i].split(',');
        break;
      }
    }
    if (!endRow) return;

    function valueFor(column) {
      var index = headers.indexOf(column);
      return index >= 0 ? endRow[index] || '' : '';
    }

    setEmbeddedData('stiat_d_score', valueFor('d'));
    setEmbeddedData('stiat_block_order', valueFor('bOrd'));
    setEmbeddedData('stiat_d_status', valueFor('dStatus') || 'invalid');
    setEmbeddedData('stiat_invalid', valueFor('dInvalid') || '1');
  }

  setEmbeddedData('stiat_invalid', '1');
  setEmbeddedData('stiat_d_status', 'not_finished');

  var scriptTag = document.createElement('script');
  scriptTag.src = 'https://cdn.jsdelivr.net/gh/minnojs/minno-quest@0.3/dist/pi-minno.js';

  scriptTag.onerror = function (e) {
    showError('pi-minno.js 載入失敗（可能是網絡或 Qualtrics/CSP 問題）。', e);
  };

  scriptTag.onload = function () {
    try {
      if (!window.minnoJS) {
        showError('pi-minno.js 已載入，但 window.minnoJS 不存在（載入異常）。');
        return;
      }

      minnoJS(
        canvas,
        'https://cdn.jsdelivr.net/gh/Jacky-Liangjq/zh-TW-ST-IAT-HK-Health-Institution-Trust-Formal@v1.0.10/HKHealthTrustSTIAT-mobile.js'
      );

      minnoJS.logger = function (value) {
        var el = container.querySelector('textarea');
        if (el) el.value = value;
        storeScoreFields(value);
      };

      minnoJS.onEnd = function () {
        setTimeout(function () { q.clickNextButton(); }, 500);
      };
    } catch (e) {
      showError('Minno 啟動失敗。請打開瀏覽器 Console 查看錯誤。', e);
    }
  };

  container.appendChild(scriptTag);
});
