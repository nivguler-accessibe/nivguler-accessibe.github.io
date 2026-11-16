/*
 * Carousel behaviour for carousel.html: what Swiper, Slick and Shopify's Dawn slideshow do to the DOM when they init.
 * Seeded from the lab seed (the active slide stands for where autoplay happened to be at scan time), and run after
 * lab.js, so the lab ids are already set. Clones get no lab id: they're other elements with the same content.
 *   [data-carousel="swiper-duplicate"]  Swiper 6–8 loop: duplicate slides at both ends, DOM order fixed
 *   [data-carousel="swiper-rotate"]     Swiper 9+ loop: slides are moved so the active one has neighbours
 *   [data-carousel="slick"]             Slick: slick-cloned copies, index ids, slick-active / slick-current
 *   [data-carousel="dawn"]              Dawn slideshow-component: aria-hidden and the active counter dot
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

  function run() {
    var slickInstance = 0;
    document.querySelectorAll('[data-carousel]').forEach(function (root, i) {
      var mode = root.getAttribute('data-carousel');
      var key = mode + i;
      if (mode.indexOf('swiper') === 0) swiper(root, key, mode);
      else if (mode === 'slick') slick(root, key, slickInstance++);
      else if (mode === 'dawn') dawn(root, key);
      root.removeAttribute('data-carousel');
    });
  }

  // lab.js runs on DOMContentLoaded too and was registered first (in <head>), so it has tagged the page by now.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
