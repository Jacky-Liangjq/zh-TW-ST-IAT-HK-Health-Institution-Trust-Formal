define(
  [
    'pipAPI',
    './qstiat-formal.js'
  ],
  function (APIConstructor, stiatExtension) {
    return stiatExtension({
      isTouch: true
    });
  }
);
