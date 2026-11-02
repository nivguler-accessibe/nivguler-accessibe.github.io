// Loads the config and the churn engine synchronously, past any CDN or browser cache, so a pushed config change is
// what the next scan sees.
(function () {
  var t = Date.now();
  document.write('<script src="config.js?t=' + t + '"><\/script>');
  document.write('<script src="lab.js?t=' + t + '"><\/script>');
})();
