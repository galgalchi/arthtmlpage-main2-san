(() => {
  'use strict';
  const embedded = window.parent !== window;
  const channel = 'artmug-embed-v1';
  let parentOrigin;
  let hasBridge = false;
  let fullHeight = false;
  let inquiryTimer;
  let lastHeight;

  if (embedded) {
    try { parentOrigin = new URL(document.referrer).origin; } catch { /* Standalone and no-referrer embeds still render. */ }
  }

  function post(type, data = {}) {
    if (parentOrigin) window.parent.postMessage({channel, type, ...data}, parentOrigin);
  }

  function sendHeight(force = false) {
    const height = Math.ceil(document.getElementById('page').getBoundingClientRect().height);
    if (!height || (!force && height === lastHeight)) return;
    lastHeight = height;
    window.parent.postMessage({type: 'sliderHeight', value: height}, parentOrigin || '*');
    if (fullHeight) post('content-height', {height});
  }

  if (embedded) {
    new ResizeObserver(() => sendHeight()).observe(document.getElementById('page'));
    window.addEventListener('load', () => sendHeight(true), {once: true});
    window.addEventListener('message', event => {
      if (event.source !== window.parent || event.origin === 'null') return;
      if (event.data?.type === 'ARTMUG_CONFIG_REQUEST' && typeof event.data.nonce === 'string') {
        const config = window.SAN_FIREBASE_CONFIG || {};
        event.source.postMessage({
          type: 'ARTMUG_CONFIG_RESPONSE',
          nonce: event.data.nonce,
          config: {apiKey: config.apiKey || '', projectId: config.projectId || '', appId: config.appId || '', databaseURL: config.databaseURL || ''},
          name: window.SAN_PAGE_DATA.name,
          url: location.origin + location.pathname
        }, event.origin);
        return;
      }
      if (event.origin !== parentOrigin || event.data?.channel !== channel) return;
      if (event.data.type === 'context') {
        window.artmugContext = event.data;
        window.dispatchEvent(new Event('artmug-context'));
      }
      if (event.data.type === 'viewport' && Number.isFinite(event.data.top)) {
        hasBridge = true;
        const previousFullHeight = fullHeight;
        fullHeight = event.data.fullHeight === true;
        window.artmugViewport = event.data;
        const {top, visibleHeight} = event.data;
        if (fullHeight && Number.isFinite(visibleHeight) && visibleHeight > 0) {
          document.documentElement.style.setProperty('--dialog-center', Math.round(top + visibleHeight / 2) + 'px');
          document.documentElement.style.setProperty('--dialog-available', Math.max(100, visibleHeight - 30) + 'px');
        }
        window.dispatchEvent(new Event('artmug-viewport'));
        if (fullHeight && !previousFullHeight) sendHeight(true);
      }
      if (event.data.type === 'inquiry-accepted') clearTimeout(inquiryTimer);
    });
    post('ready');
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (!fullHeight) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      post('navigate', {top: target.getBoundingClientRect().top + window.scrollY});
    });
  });

  window.SanEmbed = {
    openInquiry(text, copied, fallback) {
      if (!hasBridge) return fallback();
      clearTimeout(inquiryTimer);
      inquiryTimer = setTimeout(fallback, 15000);
      post('inquiry-open', {text, copied});
    },
    openImage(src, alt) {
      if (!hasBridge || !/^https:/.test(src)) return false;
      post('lightbox-open', {src, alt});
      return true;
    },
    openVideo(id) {
      if (!hasBridge) return false;
      post('video-open', {id});
      return true;
    }
  };
})();
