define(
  [
    'pipAPI',
    'https://cdn.jsdelivr.net/gh/Jacky-Liangjq/zh-TW-ST-IAT-HK-Health-Institution-Trust-Formal@v1.0.2/qstiat-formal.js'
  ],
  function (APIConstructor, stiatExtension) {
    return stiatExtension({
      isTouch: false
    });
  }
);
