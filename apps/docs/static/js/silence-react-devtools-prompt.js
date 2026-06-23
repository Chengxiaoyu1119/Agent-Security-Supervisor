(function () {
  if (typeof window === 'undefined') {
    return;
  }

  var originalInfo = console.info;
  console.info = function () {
    var firstArg = arguments.length > 0 ? String(arguments[0]) : '';
    if (firstArg.indexOf('Download the React DevTools') !== -1) {
      return;
    }
    return originalInfo.apply(console, arguments);
  };
})();
