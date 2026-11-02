/*
 * Stable Selectors Lab: rewrites the page on load so generated tokens churn the way framework builds do.
 * Every value comes from a seed (see config.js), so a scenario can be replayed exactly.
 *
 * Markers in the HTML, all resolved and then removed from the DOM:
 *   class="$name"            CSS-module class, same hash for every instance of `name` (style from <meta name="lab-style">)
 *   class="$mod:name"        _name_x8k2p_14            (CSS modules)
 *   class="$next:Comp_name"  Comp_name__a8Xk2          (Next.js)
 *   class="$sc:name"         sc-bdVaJa kZaXyq          (styled-components; needs <style data-styled> to be filtered)
 *   class="$em:name"         css-1x9ab2q-name          (Emotion; needs <style data-emotion> to be filtered)
 *   class="$alpha:name"      _name_kqzvw               (letters-only hash: the scanner's heuristic misses it)
 *   class="$weak:name"       _name_kqzv4               (one digit, at the end: missed too)
 *   class="$jsx" / "$svelte" / "$ng"                   styled-jsx, Svelte, Angular animation classes
 *   class="$state"           nothing, or a random state class (is-loading, active, open, ...)
 *   class="$init"            nothing, or a random init class (swiper-initialized, aos-init, ...): not filtered
 *   id, for, aria-*, data-testid, data-qa="$kind@key"  generated value, same value for the same kind@key on the page:
 *                            react (:r1a:), shopify, ember, mui, radix, headless, uuid, num, alpha
 *   data-vc="Name"           Vue scoped component root: data-v-<hash> on it and its template
 *   data-ng="Name"           Angular component host: _nghost-ng-c… / _ngcontent-ng-c…
 *   data-ng-app              Angular root: ng-version
 *   data-rand                a random data-* attribute (on classless elements it becomes the legacy selector)
 *   data-wrap="N"            0..N extra wrapper <div>s around the element
 *   data-device="desktop"    removed below 768px, unless deviceMove is 'both'
 *   data-swap-testid="v"     becomes data-testid="v" when swap is on
 *   <template data-repeat="count">  repeated N times (a number, or an option name); {i} is the index
 * Elements that already have a class or an id also get a random data-* attribute every third element.
 */
(function () {
  'use strict';

  var CATEGORIES = ['hash', 'state', 'ids', 'attrs', 'vue', 'angular', 'wrap'];
  var config = window.LAB_CONFIG || {};
  var params = new URLSearchParams(location.search);
  var pageMeta = document.querySelector('meta[name="lab-page"]');
  var styleMeta = document.querySelector('meta[name="lab-style"]');
  var page = pageMeta ? pageMeta.content : 'default';
  var opts = Object.assign({}, config.defaults, (config.pages || {})[page]);

  if (params.has('seed')) opts.seed = params.get('seed');
  if (params.has('swap')) opts.swap = params.get('swap') === '1';
  if (params.has('count')) opts.count = Number(params.get('count'));
  if (params.has('device')) opts.deviceMove = params.get('device');
  if (params.has('presets')) opts.presets = params.get('presets') !== '0';

  var off = {};
  (opts.off || []).concat((params.get('off') || '').split(',')).forEach(function (c) {
    if (c) off[c] = true;
  });
  if (params.get('churn') === '0') CATEGORIES.forEach(function (c) { off[c] = true; });

  var seed = opts.seed || seedFor(opts.seedMode);

  function seedFor(mode) {
    var minutes = /^time:(\d+)$/.exec(mode || '');
    if (minutes) return 't' + Math.floor(Date.now() / (Number(minutes[1]) * 60000));
    return Math.random().toString(36).slice(2, 10);
  }

  // ---- seeded randomness ----

  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(key) {
    var a = hash32(key);
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A frozen category keeps generating, from a constant seed: the markup looks the same, it just never changes.
  function rngFor(category, key) {
    return makeRng((off[category] ? 'frozen' : seed) + '|' + category + '|' + key);
  }

  var DIGITS = '0123456789';
  var LOWER = 'abcdefghijklmnopqrstuvwxyz';
  var UPPER = LOWER.toUpperCase();
  var B36 = DIGITS + LOWER;
  var B62 = B36 + UPPER;

  function int(r, n) { return Math.floor(r() * n); }
  function pick(r, s) { return s[int(r, s.length)]; }
  function chars(r, alphabet, n) {
    var out = '';
    for (var i = 0; i < n; i++) out += pick(r, alphabet);
    return out;
  }
  // Shaped like a build hash the scanner recognizes: a letter and at least two digits.
  function hashy(r, alphabet, n) {
    var out = chars(r, alphabet, n).split('');
    out[0] = pick(r, DIGITS);
    out[1] = pick(r, LOWER);
    out[n - 1] = pick(r, DIGITS);
    return out.join('');
  }
  function uuid(r) {
    var h = chars(r, '0123456789abcdef', 32);
    return [h.slice(0, 8), h.slice(8, 12), '4' + h.slice(13, 16), '8' + h.slice(17, 20), h.slice(20)].join('-');
  }

  // ---- class tokens ----

  var usedPresets = {};

  var CLASS_KINDS = {
    mod: function (name, r) { return '_' + name + '_' + hashy(r, B36, 5) + '_' + (1 + int(r, 99)); },
    next: function (name, r) { return name + '__' + hashy(r, B62, 5); },
    sc: function (name, r) {
      usedPresets.styled = true;
      var styled = chars(r, LOWER, 6).split('');
      styled[0] = pick(r, LOWER + UPPER);
      styled[2] = pick(r, UPPER);
      styled[4] = pick(r, UPPER);
      return 'sc-' + chars(r, LOWER + UPPER, 6) + ' ' + styled.join('');
    },
    em: function (name, r) {
      usedPresets.emotion = true;
      return 'css-' + hashy(r, B36, 7) + (name ? '-' + name : '');
    },
    alpha: function (name, r) { return '_' + name + '_' + chars(r, LOWER, 5); },
    weak: function (name, r) { return '_' + name + '_' + chars(r, LOWER, 4) + pick(r, DIGITS); },
    jsx: function (name, r) { return 'jsx-' + (1 + int(r, 9)) + chars(r, DIGITS, 9); },
    svelte: function (name, r) { return 'svelte-' + hashy(r, B36, 6); },
    ng: function (name, r) {
      return r() < 0.5 ? 'ng-star-inserted' : 'ng-tns-c' + (100 + int(r, 900)) + '-' + int(r, 40);
    },
  };

  var STATES = ['', '', '', 'is-loading', 'is-active', 'active', 'open', 'is-open', 'loaded', 'selected', 'is-visible', 'fade in'];
  // Initialization classes the scanner doesn't know as state words.
  var INITS = ['', 'swiper-initialized', 'swiper-container-initialized', 'slick-initialized slick-slider', 'aos-init'];

  function resolveClassToken(token, elementKey) {
    var m = /^\$([A-Za-z]+)(?::([\w-]+))?$/.exec(token);
    if (!m) return token;
    var kind = m[1];
    var name = m[2];
    if (kind === 'state' || kind === 'init') {
      var list = kind === 'state' ? STATES : INITS;
      return list[int(rngFor('state', kind + elementKey), list.length)];
    }
    if (!name && !CLASS_KINDS[kind]) {
      name = kind;
      kind = (styleMeta && styleMeta.content) || 'mod';
    }
    if (!CLASS_KINDS[kind]) return token;
    return CLASS_KINDS[kind](name || '', rngFor('hash', kind + ':' + (name || '')));
  }

  // ---- id tokens ----

  var ID_KINDS = {
    react: function (key, r) { return ':r' + int(r, 1200).toString(32) + ':'; },
    shopify: function (key, r) {
      return 'shopify-section-template--' + (1 + int(r, 9)) + chars(r, DIGITS, 13) + '__' + key + '_' + chars(r, B62, 6);
    },
    ember: function (key, r) { return 'ember' + (100 + int(r, 4000)); },
    mui: function (key, r) { return 'mui-' + (1000 + int(r, 90000)); },
    radix: function (key, r) { return 'radix-:r' + int(r, 400).toString(32) + ':' + (key ? '-' + key : ''); },
    headless: function (key, r) { return 'headlessui-' + (key || 'id') + '-:r' + int(r, 400).toString(32) + ':'; },
    uuid: function (key, r) { return uuid(r); },
    num: function (key, r) { return (key || 'el') + '-' + (1 + int(r, 9)) + chars(r, DIGITS, 7); },
    alpha: function (key, r) { return (key || 'el') + '-' + chars(r, LOWER + UPPER, 6); },
  };
  var ID_ATTRS = ['id', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns',
    'aria-activedescendant', 'href', 'list', 'form', 'headers', 'data-testid', 'data-qa'];
  var idMemo = {};

  function resolveIds(value, elementKey) {
    return value.replace(/\$([a-z]+)(?:@([\w-]+))?/g, function (all, kind, key) {
      if (!ID_KINDS[kind]) return all;
      var memoKey = kind + '@' + (key || '#' + elementKey);
      if (!(memoKey in idMemo)) idMemo[memoKey] = ID_KINDS[kind](key || '', rngFor('ids', memoKey));
      return idMemo[memoKey];
    });
  }

  // ---- random data-* attributes ----

  var RANDOM_ATTRS = [
    ['data-render-id', function (r) { return uuid(r); }],
    ['data-hydration-key', function (r) { return 'h' + int(r, 5000); }],
    ['data-uid', function (r) { return hashy(r, B36, 8); }],
    ['data-ts', function (r) { return String(1790000000000 + int(r, 1e9)); }],
    ['data-key', function (r) { return hashy(r, B62, 10); }],
    ['data-instance', function (r) { return 'inst_' + hashy(r, B36, 6); }],
    ['data-observer-id', function (r) { return String(int(r, 1e6)); }],
    ['data-track', function (r) { return 'trk-' + hashy(r, B36, 6); }],
  ];

  function addRandomAttr(el, elementKey) {
    var r = rngFor('attrs', elementKey);
    var entry = RANDOM_ATTRS[int(r, RANDOM_ATTRS.length)];
    el.setAttribute(entry[0], entry[1](r));
  }

  // ---- passes ----

  function expandTemplates() {
    document.querySelectorAll('template[data-repeat]').forEach(function (tpl) {
      var spec = tpl.getAttribute('data-repeat');
      var n = isNaN(Number(spec)) ? Number(opts[spec]) || 0 : Number(spec);
      var html = '';
      for (var i = 1; i <= n; i++) html += tpl.innerHTML.replace(/\{i\}/g, i);
      tpl.insertAdjacentHTML('beforebegin', html);
      tpl.remove();
    });
  }

  function applyDevice() {
    var desktop = window.matchMedia('(min-width: 768px)').matches;
    document.querySelectorAll('[data-device]').forEach(function (el) {
      var only = el.getAttribute('data-device');
      var keep = opts.deviceMove === 'both' || (only === 'desktop' ? desktop : !desktop);
      if (!keep) el.remove();
    });
  }

  function applySwap() {
    if (!opts.swap) return;
    document.querySelectorAll('[data-swap-testid]').forEach(function (el) {
      el.setAttribute('data-testid', el.getAttribute('data-swap-testid'));
    });
  }

  function applyWrappers() {
    document.querySelectorAll('[data-wrap]').forEach(function (el, i) {
      var max = Number(el.getAttribute('data-wrap')) || 1;
      var n = off.wrap ? 0 : int(rngFor('wrap', 'w' + i), max + 1);
      for (var k = 0; k < n; k++) {
        var div = document.createElement('div');
        div.setAttribute('class', k === 0 ? '$mod:Transition' : '$mod:Slot $state');
        el.parentNode.insertBefore(div, el);
        div.appendChild(el);
      }
    });
  }

  // Vue and Angular scope every element of a component's template; a child component's root gets both scopes.
  function applyScopes(marker, category, scope) {
    document.querySelectorAll('[' + marker + ']').forEach(function (root) {
      var attrs = scope(rngFor(category, root.getAttribute(marker)));
      if (attrs.host) root.setAttribute(attrs.host, '');
      [root].concat(Array.prototype.slice.call(root.querySelectorAll('*'))).forEach(function (el) {
        var owner = el === root ? root : el.parentElement.closest('[' + marker + ']');
        if (owner === root) el.setAttribute(attrs.content, '');
      });
    });
  }

  function vueScope(r) {
    return { content: 'data-v-' + chars(r, '0123456789abcdef', 8) };
  }

  function angularScope(r) {
    var id = 'ng-c' + (1 + int(r, 9)) + chars(r, DIGITS, 9);
    return { host: '_nghost-' + id, content: '_ngcontent-' + id };
  }

  function resolveTokens() {
    var all = document.body.querySelectorAll('*');
    all.forEach(function (el, i) {
      if (el.closest('template')) return;
      var key = 'e' + i;
      var cls = el.getAttribute('class');
      if (cls && cls.indexOf('$') !== -1) {
        var resolved = cls.split(/\s+/).map(function (t) { return resolveClassToken(t, key); }).join(' ').trim();
        if (resolved) el.setAttribute('class', resolved.replace(/\s+/g, ' '));
        else el.removeAttribute('class');
      }
      ID_ATTRS.forEach(function (name) {
        var v = el.getAttribute(name);
        if (v && v.indexOf('$') !== -1) el.setAttribute(name, resolveIds(v, key));
      });
    });
  }

  function spreadRandomAttrs() {
    var n = 0;
    document.body.querySelectorAll('*').forEach(function (el, i) {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName) || el.closest('svg') !== el && el.closest('svg')) return;
      if (el.hasAttribute('data-rand')) {
        el.removeAttribute('data-rand');
        addRandomAttr(el, 'a' + i);
      } else if ((el.hasAttribute('class') || el.id) && n++ % 3 === 0) {
        addRandomAttr(el, 'a' + i);
      }
    });
  }

  function addPresetTags() {
    if (opts.presets === false) return;
    if (usedPresets.styled) {
      var sc = document.createElement('style');
      sc.setAttribute('data-styled', 'active');
      sc.setAttribute('data-styled-version', '5.3.11');
      document.head.appendChild(sc);
    }
    if (usedPresets.emotion) {
      var em = document.createElement('style');
      em.setAttribute('data-emotion', 'css');
      document.head.appendChild(em);
    }
  }

  function stripMarkers() {
    ['data-vc', 'data-ng', 'data-ng-app', 'data-wrap', 'data-device', 'data-swap-testid'].forEach(function (name) {
      document.querySelectorAll('[' + name + ']').forEach(function (el) {
        if (name === 'data-ng-app') el.setAttribute('ng-version', '17.3.12');
        el.removeAttribute(name);
      });
    });
  }

  function addBadge() {
    if (params.get('badge') === '0') return;
    var badge = document.createElement('div');
    badge.className = 'lab-badge';
    badge.setAttribute('data-qa', 'lab-badge');
    var frozen = Object.keys(off);
    badge.textContent = 'lab page "' + page + '" · seed ' + seed + (frozen.length ? ' · frozen: ' + frozen.join(',') : '');
    document.body.appendChild(badge);
  }

  function run() {
    expandTemplates();
    applyDevice();
    applySwap();
    applyWrappers();
    applyScopes('data-vc', 'vue', vueScope);
    applyScopes('data-ng', 'angular', angularScope);
    resolveTokens();
    spreadRandomAttrs();
    addPresetTags();
    stripMarkers();
    addBadge();
    window.LAB = { page: page, seed: seed, options: opts, frozen: Object.keys(off) };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
