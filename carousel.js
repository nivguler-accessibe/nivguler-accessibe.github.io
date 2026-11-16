/*
 * Carousel behaviour for carousel.html: what Swiper, Slick and Shopify's Dawn slideshow do to the DOM when they init.
 * Seeded from the lab seed (the active slide stands for where autoplay happened to be at scan time), and run after
 * lab.js, so the lab ids are already set. Clones get no lab id: they're other elements with the same content.
 *   [data-carousel="swiper-duplicate"]  Swiper 6–8 loop: duplicate slides at both ends, DOM order fixed
 *   [data-carousel="swiper-rotate"]     Swiper 9+ loop: slides are moved so the active one has neighbours
 *   [data-carousel="slick"]             Slick: slick-cloned copies, index ids, slick-active / slick-current
 *   [data-carousel="dawn"]              Dawn slideshow-component: aria-hidden and the active counter dot
 *   [data-carousel="tiny"]              tiny-slider: tns<N>-* wrapper and item ids, tns-slide-active, clones
 *   [data-carousel="owl"]               Owl Carousel 2: owl-item wrappers with active / center / cloned, icon-only dots
 * Every library also gets a random instance id on each init (Swiper's wrapper id).
 */
(function () {
  'use strict';

  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFor(category, key) {
    var lab = window.LAB || {};
    var frozen = (lab.frozen || []).indexOf(category) !== -1;
    var a = hash32((frozen ? 'frozen' : lab.seed) + '|carousel|' + category + '|' + key);
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hex(r, n) {
    var out = '';
    for (var i = 0; i < n; i++) out += '0123456789abcdef'[Math.floor(r() * 16)];
    return out;
  }

  function clone(el, classes) {
    var copy = el.cloneNode(true);
    [copy].concat(Array.prototype.slice.call(copy.querySelectorAll('*'))).forEach(function (node) {
      node.removeAttribute('data-aflw-lab');
      node.removeAttribute('id');
    });
    classes.split(' ').forEach(function (c) { copy.classList.add(c); });
    copy.setAttribute('aria-hidden', 'true');
    return copy;
  }

  function markActive(items, active, cls) {
    items.forEach(function (item, k) { item.classList.toggle(cls, k === active); });
  }

  function swiper(root, key, mode) {
    var wrapper = root.querySelector('.swiper-wrapper');
    var slides = Array.prototype.slice.call(wrapper.children);
    var n = slides.length;
    var active = Math.floor(rngFor('state', key)() * n);
    var wrapperId = 'swiper-wrapper-' + hex(rngFor('ids', key), 16);
    root.classList.add('swiper-initialized', 'swiper-horizontal');
    wrapper.id = wrapperId;
    wrapper.setAttribute('aria-live', 'off');
    slides.forEach(function (slide, k) {
      var rel = (k - active + n) % n;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-label', k + 1 + ' / ' + n);
      slide.setAttribute('data-swiper-slide-index', String(k));
      slide.classList.toggle('swiper-slide-active', rel === 0);
      slide.classList.toggle('swiper-slide-next', rel === 1);
      slide.classList.toggle('swiper-slide-prev', rel === n - 1);
    });
    if (mode === 'swiper-rotate') {
      for (var k = 0; k < n; k++) wrapper.appendChild(slides[(active - 1 + k + n) % n]);
    } else {
      wrapper.insertBefore(clone(slides[n - 1], 'swiper-slide-duplicate swiper-slide-duplicate-prev'), slides[0]);
      wrapper.appendChild(clone(slides[0], 'swiper-slide-duplicate swiper-slide-duplicate-next'));
    }
    root.querySelectorAll('.swiper-button-prev, .swiper-button-next').forEach(function (b) { b.setAttribute('aria-controls', wrapperId); });
    markActive(Array.prototype.slice.call(root.querySelectorAll('.swiper-pagination-bullet')), active, 'swiper-pagination-bullet-active');
  }

  function slick(root, key, instance) {
    var track = root.querySelector('.slick-track');
    var slides = Array.prototype.slice.call(track.children);
    var n = slides.length;
    var current = Math.floor(rngFor('state', key)() * n);
    root.classList.add('slick-initialized', 'slick-slider');
    slides.forEach(function (slide, k) {
      slide.classList.add('slick-slide');
      slide.id = 'slick-slide' + instance + (k < 10 ? '0' : '') + k;
      slide.setAttribute('data-slick-index', String(k));
      slide.setAttribute('aria-hidden', String(k !== current));
      slide.setAttribute('tabindex', k === current ? '0' : '-1');
    });
    markActive(slides, current, 'slick-active');
    markActive(slides, current, 'slick-current');
    var first = clone(slides[0], 'slick-cloned');
    var last = clone(slides[n - 1], 'slick-cloned');
    last.setAttribute('data-slick-index', '-1');
    first.setAttribute('data-slick-index', String(n));
    track.insertBefore(last, slides[0]);
    track.appendChild(first);
    markActive(Array.prototype.slice.call(root.querySelectorAll('.slick-dots li')), current, 'slick-active');
  }

  function dawn(root, key) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slideshow__slide'));
    var active = Math.floor(rngFor('state', key)() * slides.length);
    slides.forEach(function (slide, k) { slide.setAttribute('aria-hidden', String(k !== active)); });
    var dots = Array.prototype.slice.call(root.querySelectorAll('.slider-counter__link'));
    markActive(dots, active, 'slider-counter__link--active');
    dots.forEach(function (dot, k) {
      if (k === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (name) { node.setAttribute(name, attrs[name]); });
    return node;
  }

  // tiny-slider: wraps the container (tns1-ow > tns1-mw > tns1-iw), ids every item tns<N>-item<k>, clones for loop.
  // N counts inits on the page, so a slider that inits first (lazy, conditional) shifts it: varied per load here.
  function tiny(root, key) {
    var items = Array.prototype.slice.call(root.children);
    var n = items.length;
    var current = Math.floor(rngFor('state', key)() * n);
    var id = 'tns' + (1 + Math.floor(rngFor('ids', key)() * 3));
    var outer = el('div', 'tns-outer', { id: id + '-ow' });
    var live = el('div', 'tns-liveregion tns-visually-hidden', { 'aria-atomic': 'true', 'aria-live': 'polite' });
    live.textContent = 'slide ' + (current + 1) + ' to ' + Math.min(current + 2, n) + ' of ' + n;
    var ovh = el('div', 'tns-ovh', { id: id + '-mw' });
    var inner = el('div', 'tns-inner', { id: id + '-iw' });
    root.parentNode.insertBefore(outer, root);
    outer.appendChild(live);
    outer.appendChild(ovh);
    ovh.appendChild(inner);
    inner.appendChild(root);
    root.id = id;
    root.classList.add('tns-slider', 'tns-carousel', 'tns-subpixel', 'tns-calc', 'tns-horizontal');
    items.forEach(function (item, k) {
      var active = k === current || k === (current + 1) % n;
      item.id = id + '-item' + k;
      item.classList.add('tns-item');
      item.classList.toggle('tns-slide-active', active);
      item.setAttribute('aria-hidden', String(!active));
      if (!active) item.setAttribute('tabindex', '-1');
    });
    root.insertBefore(clone(items[n - 1], 'tns-slide-cloned'), items[0]);
    root.appendChild(clone(items[0], 'tns-slide-cloned'));
    var nav = el('div', 'tns-nav', { 'aria-label': 'Carousel Pagination' });
    items.forEach(function (item, k) {
      var dot = el('button', k === current ? 'tns-nav-active' : '', { 'aria-controls': id, 'data-nav': String(k), type: 'button' });
      nav.appendChild(dot);
    });
    outer.appendChild(nav);
  }

  // Owl Carousel 2: every item is wrapped in div.owl-item inside owl-stage-outer > owl-stage; active / center / cloned
  // are on those wrappers, and the dots are icon-only buttons.
  function owl(root, key) {
    var items = Array.prototype.slice.call(root.children);
    var n = items.length;
    var center = Math.floor(rngFor('state', key)() * n);
    var outer = el('div', 'owl-stage-outer');
    var stage = el('div', 'owl-stage', { style: 'transform: translate3d(-' + center * 146 + 'px, 0, 0)' });
    outer.appendChild(stage);
    var wrap = function (item, classes) {
      var w = el('div', classes);
      w.appendChild(item);
      return w;
    };
    stage.appendChild(wrap(clone(items[n - 1], 'owl-clone-content'), 'owl-item cloned'));
    items.forEach(function (item, k) {
      var rel = (k - center + n) % n;
      var classes = 'owl-item' + (rel <= 1 || rel === n - 1 ? ' active' : '') + (rel === 0 ? ' center' : '');
      stage.appendChild(wrap(item, classes));
    });
    stage.appendChild(wrap(clone(items[0], 'owl-clone-content'), 'owl-item cloned'));
    root.appendChild(outer);
    var nav = el('div', 'owl-nav');
    ['owl-prev', 'owl-next'].forEach(function (cls) {
      var b = el('button', cls, { role: 'presentation', type: 'button' });
      b.innerHTML = '<span aria-hidden="true">' + (cls === 'owl-prev' ? '‹' : '›') + '</span>';
      nav.appendChild(b);
    });
    var dots = el('div', 'owl-dots');
    items.forEach(function (item, k) {
      var dot = el('button', 'owl-dot' + (k === center ? ' active' : ''), { role: 'button' });
      dot.appendChild(el('span'));
      dots.appendChild(dot);
    });
    root.appendChild(nav);
    root.appendChild(dots);
    root.classList.add('owl-loaded', 'owl-drag');
  }

  function run() {
    var slickInstance = 0;
    document.querySelectorAll('[data-carousel]').forEach(function (root, i) {
      var mode = root.getAttribute('data-carousel');
      var key = mode + i;
      if (mode.indexOf('swiper') === 0) swiper(root, key, mode);
      else if (mode === 'slick') slick(root, key, slickInstance++);
      else if (mode === 'dawn') dawn(root, key);
      else if (mode === 'tiny') tiny(root, key);
      else if (mode === 'owl') owl(root, key);
      root.removeAttribute('data-carousel');
    });
  }

  // lab.js runs on DOMContentLoaded too and was registered first (in <head>), so it has tagged the page by now.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
