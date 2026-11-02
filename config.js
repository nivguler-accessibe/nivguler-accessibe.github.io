// Stable Selectors Lab config. Edit, commit and push to change what the scanner sees on its next scan.
// Query parameters override it in the browser (?seed=, ?off=, ?churn=0, ?swap=1, ?count=, ?device=, ?badge=0).
//
// seed      null: a new random seed on every page load (every refresh churns). A string: frozen, reproducible values.
// seedMode  'load' (default), or 'time:<minutes>': one seed per time window, so the desktop and mobile scans of a page
//           usually get the same values (with 'load' they never do, so nothing is found on both devices).
// off       categories to freeze (they keep a constant value): 'hash', 'state', 'ids', 'attrs', 'vue', 'angular', 'wrap'.
// presets   false: don't add <style data-styled> / <style data-emotion>, so the scanner can't detect those frameworks.
window.LAB_CONFIG = {
  defaults: { seed: null, seedMode: 'load', off: [], presets: true },
  pages: {
    // Ambiguity recipe (README): scan 1 seed 'one'; scan 2 seed 'two'; scan 3 seed 'two' + swap true.
    twins: { seed: 'one', swap: false },
    // 'desktop': the device-move button exists only at >= 768px. 'both': it exists on both devices.
    device: { deviceMove: 'desktop' },
    // Rows on the heavy page; each row has 3 failing elements.
    heavy: { count: 2500 },
    sneaky: { presets: false },
  },
};
