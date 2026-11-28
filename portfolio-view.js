(() => {
  'use strict';

  const model = window.ArtmugPortfolio;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, label, text) {
    const node = element('button', className, text);
    node.type = 'button';
    node.setAttribute('aria-label', label);
    return node;
  }

  function mediaSource(item) {
    if (item.type === 'video') return /^[\w-]{11}$/.test(item.id || '') ? item.id : null;
    if (item.type !== 'image') return null;
    for (const value of [item.publicUrl, item.url]) {
      if (typeof value !== 'string') continue;
      try {
        const url = new URL(value, location.href);
        const localAsset = value.startsWith('./assets/') && url.origin === location.origin && !url.username && !url.password;
        if ((url.protocol === 'https:' || localAsset) && !url.searchParams.has('access_token')) return url.href;
      } catch (_) { /* A legacy record can contain an unpublished image. */ }
    }
    return null;
  }

  function publicWorks(secondary) {
    const result = [];
    for (const [key, item] of model.entries(secondary?.items, 'addedAt')) {
      const source = mediaSource(item);
      if (!source) continue;
      const name = model.itemName(item) || (item.type === 'video' ? '영상' : '이미지');
      result.push({key, type: item.type, source, name});
    }
    return result;
  }

  function thumbnail(work) {
    const img = element('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = work.type === 'video'
      ? 'https://img.youtube.com/vi/' + work.source + '/hqdefault.jpg'
      : work.source;
    return img;
  }

  function markWork(node, work, categoryKey, originalCategory) {
    node.dataset.kind = work.type;
    node.dataset.portfolioIdentity = [work.type, categoryKey, originalCategory ? work.source : work.key].join('|');
    node.dataset.portfolioLabel = work.name;
  }

  function renderGrid(section, works, originalCategory) {
    const grid = element('div', 'portfolio-grid pv-grid');
    for (const work of works) {
      const isVideo = work.type === 'video';
      const card = button('pv-grid-item', work.name + (isVideo ? ' 영상 재생' : ' 이미지 확대'));
      markWork(card, work, section.dataset.categoryKey, originalCategory);
      card.append(thumbnail(work));
      if (isVideo) {
        const play = element('span', 'grid-play', '▶');
        play.setAttribute('aria-hidden', 'true');
        card.append(play);
      }
      card.addEventListener('click', () => {
        if (isVideo) window.openPortfolioVideo(work.source);
        else window.openPortfolioImage(work.source, work.name);
        card.dispatchEvent(new CustomEvent('portfolio-view', {bubbles: true}));
      });
      grid.append(card);
    }
    section.append(grid);
  }

  function activeMedia(work) {
    if (work.type === 'video') {
      const frame = element('iframe');
      frame.title = work.name;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.src = 'https://www.youtube-nocookie.com/embed/' + work.source + '?rel=0';
      return frame;
    }
    const open = button('pv-slide-image', work.name + ' 이미지 확대');
    const img = element('img');
    img.alt = work.name;
    img.src = work.source;
    open.append(img);
    open.addEventListener('click', () => window.openPortfolioImage(work.source, work.name));
    return open;
  }

  function renderSlider(section, works, originalCategory, selectedKey, remember) {
    const root = element('div', 'slider-root pv-slider');
    const stage = element('div', 'slider-stage pv-stage');
    const strip = element('div', 'slider-thumbs');
    const wrap = element('div', 'slider-thumbs-wrap');
    const slides = works.map(work => {
      const slide = element('div', 'slider-slide');
      markWork(slide, work, section.dataset.categoryKey, originalCategory);
      stage.append(slide);
      const thumb = button('slider-thumb-btn', work.name);
      thumb.append(thumbnail(work));
      strip.append(thumb);
      return slide;
    });
    const previous = button('slider-btn prev', '이전 작품', '❮');
    const next = button('slider-btn next', '다음 작품', '❯');
    stage.append(previous, next);
    wrap.append(strip);
    root.append(stage, element('div', 'slider-dots'), wrap);
    section.append(root);

    let current = -1;
    function activate(index) {
      if (index === current) return;
      if (current >= 0) slides[current].replaceChildren();
      current = index;
      const work = works[index];
      root.dataset.kind = work.type;
      slides[index].append(activeMedia(work));
      remember(work.key);
    }
    root.addEventListener('portfolio-view', event => activate(event.detail.index));
    const initial = Math.max(0, works.findIndex(work => work.key === selectedKey));
    activate(initial);
    const carousel = initPortfolioCarousel(root, '.slider-slide', initial);
    const resize = new ResizeObserver(() => carousel.center('auto'));
    resize.observe(stage);
    return () => resize.disconnect();
  }

  function create(host) {
    const primaryNav = element('nav', 'pv-primary-nav');
    primaryNav.setAttribute('aria-label', '포트폴리오 1차 카테고리');
    const tabs = element('div', 'portfolio-cat-tabs pv-tabs');
    primaryNav.append(tabs);

    const secondaryNav = element('nav', 'pv-secondary-nav');
    secondaryNav.setAttribute('aria-label', '포트폴리오 2차 카테고리');
    const secondaryTabs = element('div', 'pv-tabs');
    secondaryNav.append(secondaryTabs);

    const controls = element('div', 'pv-controls');
    const modeButton = button('portfolio-mode pv-mode', '슬라이드로 보기');
    controls.append(modeButton);
    const status = element('p', 'pv-status', '포트폴리오를 불러오는 중입니다.');
    status.setAttribute('role', 'status');
    const section = element('div', 'pf-type-section active pv-section');
    host.replaceChildren(primaryNav, secondaryNav, controls, status, section);
    primaryNav.hidden = secondaryNav.hidden = controls.hidden = true;

    let data, selectedPrimary, selectedSecondary, selectedMode, slideKey;
    let manuallySelected = false;
    let primarySignature, secondarySignature, contentSignature;
    let releaseSlider;

    function paintTabs(list, categories, activate) {
      list.style.setProperty('--tab-columns', Math.max(1, Math.min(6, categories.length)));
      list.replaceChildren(...categories.map(([key, entry]) => {
        const tab = button('pf-tab-btn', entry.name, entry.name);
        tab.dataset.categoryId = key;
        tab.onclick = () => activate(key);
        return tab;
      }));
    }

    function selectTab(list, activeId) {
      for (const tab of list.children) {
        const active = tab.dataset.categoryId === activeId;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      }
    }

    function reportCategory() {
      const work = section.querySelector('[data-kind]');
      section.dispatchEvent(new CustomEvent('portfolio-category', {
        bubbles: true,
        detail: {kind: work?.dataset.kind || 'image', title: section.dataset.category, key: section.dataset.categoryKey}
      }));
    }

    function render() {
      const defaults = model.resolveDefaults(data);
      const primaries = model.entries(data.categories);
      if (!manuallySelected || !data.categories?.[selectedPrimary]) {
        selectedPrimary = defaults.primaryId;
        selectedSecondary = defaults.secondaryId;
      }
      const primary = data.categories?.[selectedPrimary];
      const secondaries = model.entries(primary?.categories);
      if (!primary?.categories?.[selectedSecondary]) {
        selectedSecondary = selectedPrimary === defaults.primaryId ? defaults.secondaryId : secondaries[0]?.[0];
      }
      const secondary = primary?.categories?.[selectedSecondary];
      const mode = selectedMode || defaults.mode;
      const works = publicWorks(secondary);
      primaryNav.hidden = !primaries.length;
      secondaryNav.hidden = !secondaries.length;
      controls.hidden = !works.length;
      modeButton.textContent = mode === 'slide' ? '격자로 보기' : '슬라이드로 보기';
      modeButton.setAttribute('aria-label', modeButton.textContent);
      modeButton.onclick = () => {
        selectedMode = mode === 'slide' ? 'grid' : 'slide';
        render();
      };

      const primaryList = JSON.stringify(primaries.map(([id, entry]) => [id, entry.name]));
      if (primaryList !== primarySignature) {
        primarySignature = primaryList;
        paintTabs(tabs, primaries, id => {
          if (selectedPrimary === id) return;
          manuallySelected = true;
          selectedPrimary = id;
          selectedSecondary = slideKey = null;
          render();
          reportCategory();
        });
      }
      selectTab(tabs, selectedPrimary);

      const options = JSON.stringify([selectedPrimary, secondaries.map(([id, entry]) => [id, entry.name])]);
      if (options !== secondarySignature) {
        secondarySignature = options;
        paintTabs(secondaryTabs, secondaries, id => {
          if (selectedSecondary === id) return;
          manuallySelected = true;
          selectedSecondary = id;
          slideKey = null;
          render();
          reportCategory();
        });
      }
      selectTab(secondaryTabs, selectedSecondary);
      status.hidden = !!works.length;
      if (!works.length) {
        status.textContent = !primaries.length ? '등록된 포트폴리오가 없습니다.'
          : !secondaries.length ? '등록된 2차 카테고리가 없습니다.' : '이 카테고리에 공개된 작품이 없습니다.';
      }
      const signature = JSON.stringify([selectedPrimary, selectedSecondary, mode, works]);
      const originalCategory = selectedPrimary === 'youtube-category' || selectedPrimary === 'image-category';
      section.dataset.categoryKey = originalCategory ? selectedSecondary || '' : selectedPrimary + '/' + selectedSecondary;
      section.dataset.category = secondary?.name || '';
      if (contentSignature === signature) return;
      contentSignature = signature;
      releaseSlider?.();
      releaseSlider = null;
      section.replaceChildren();
      if (!works.length) return;
      if (mode === 'slide') {
        releaseSlider = renderSlider(section, works, originalCategory, slideKey, key => { slideKey = key; });
      } else {
        renderGrid(section, works, originalCategory);
      }
    }

    function setData(next) {
      data = next;
      render();
    }

    return {setData};
  }

  window.ArtmugPortfolioView = {create};
})();
