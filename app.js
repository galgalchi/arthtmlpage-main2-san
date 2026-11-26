(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const create = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, className) => {
    const node = create('button', text, className);
    node.type = 'button';
    return node;
  };
  const labels = {closed: '마감', holiday: '휴일', available: '작업가능', deadline: '마감임박', unconfirmed: '문의'};
  const money = price => Number.isFinite(price) ? price.toLocaleString('ko-KR') + '원' : '별도 견적';
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const seoulToday = () => dateFormatter.format(new Date());
  const dateKey = date => date.toISOString().slice(0, 10);
  const monthStart = key => new Date(key.slice(0, 7) + '-01T00:00:00Z');
  let today = seoulToday();
  let shownMonth = monthStart(today);
  let calendar;
  let estimate = window.SAN_PAGE_DATA.estimate;
  let reviews = [];
  let activeReview = 0;
  let reviewTimer;
  const portfolio = ArtmugPortfolioView.create($('portfolio'));
  const menu = $('sectionMenu');
  menu.addEventListener('click', event => { if (event.target.closest('a')) menu.open = false; });
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });

  function updateCalendar() {
    today = seoulToday();
    const month = dateKey(shownMonth).slice(0, 7);
    $('calMonth').textContent = month.replace('-', '.');
    $('calToday').hidden = today.startsWith(month);
    $('deadlineLegend').hidden = !Object.entries(calendar.dates || {}).some(([key, status]) =>
      key.startsWith(month) && key >= today && status === 'deadline');
    $('calendarNote').hidden = calendar.defaultStatus !== 'unconfirmed';
    const year = shownMonth.getUTCFullYear();
    const monthIndex = shownMonth.getUTCMonth();
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const days = document.createDocumentFragment();
    for (let i = 0; i < shownMonth.getUTCDay(); i += 1) days.append(create('span'));
    for (let day = 1; day <= count; day += 1) {
      const key = month + '-' + String(day).padStart(2, '0');
      const configured = calendar.dates?.[key];
      const status = key < today ? 'closed' : Object.hasOwn(labels, configured) ? configured : calendar.defaultStatus;
      const memo = calendar.notes?.[key];
      const cell = memo ? button(undefined, 'cal-day ' + status) : create('div', undefined, 'cal-day ' + status);
      if (key === today) {
        cell.classList.add('today');
        cell.setAttribute('aria-current', 'date');
      }
      cell.setAttribute('aria-label', key + ' ' + labels[status] + (memo ? ' · 메모 보기' : ''));
      cell.append(create('span', day));
      if (status !== 'unconfirmed') cell.append(create('span', labels[status], 'day-status'));
      if (memo) {
        cell.append(create('span', '메모', 'day-memo'));
        cell.addEventListener('click', () => {
          $('memoTitle').textContent = key.replaceAll('-', '.') + ' 메모';
          $('memoText').textContent = memo;
          $('memoDialog').showModal();
        });
      }
      days.append(cell);
    }
    $('calDays').replaceChildren(days);
  }

  function moveMonth(delta) {
    const candidate = new Date(shownMonth);
    candidate.setUTCMonth(candidate.getUTCMonth() + delta);
    if (candidate.getUTCFullYear() < 1000 || candidate.getUTCFullYear() > 9999) return;
    shownMonth = candidate;
    updateCalendar();
  }

  $('calPrev').addEventListener('click', () => moveMonth(-1));
  $('calNext').addEventListener('click', () => moveMonth(1));
  $('calToday').addEventListener('click', () => {
    shownMonth = monthStart(seoulToday());
    updateCalendar();
    $('calPrev').focus({preventScroll: true});
  });
  function refreshDate() {
    const nextToday = seoulToday();
    if (nextToday === today) return;
    if (dateKey(shownMonth).slice(0, 7) === today.slice(0, 7)) shownMonth = monthStart(nextToday);
    updateCalendar();
  }
  setInterval(refreshDate, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });

  const lightbox = $('lightbox');
  const image = $('lightboxImg');
  let zoom = 1;
  window.openPortfolioImage = (src, name) => {
    if (SanEmbed.openImage(src, name)) return;
    zoom = 1;
    image.style.transform = '';
    image.src = src;
    image.alt = name;
    $('lightboxTitle').textContent = name;
    $('lightboxOriginal').href = src;
    lightbox.showModal();
  };
  lightbox.addEventListener('wheel', event => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || event.target !== image) return;
    event.preventDefault();
    zoom = Math.min(4, Math.max(.5, zoom * Math.exp(-event.deltaY * .0015)));
    image.style.transform = 'scale(' + zoom + ')';
  }, {passive: false});
  lightbox.addEventListener('close', () => image.removeAttribute('src'));
  window.openPortfolioVideo = id => {
    if (/^[\w-]{11}$/.test(id) && !SanEmbed.openVideo(id)) window.openVideoDialog(id);
  };
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right ||
          event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  const fields = [...$('inquiryFields').children].map(item => item.textContent);
  const editorInputs = fields.map(field => {
    const label = create('label', field, 'editor-field');
    const input = create('textarea');
    input.rows = 2;
    label.append(input);
    $('editorFields').append(label);
    return input;
  });
  function selectedEstimate() {
    return [...$('estimateOptions').querySelectorAll('input:checked')].map(input => estimate[Number(input.value)]);
  }

  function updateTotal() {
    const priced = selectedEstimate().filter(item => Number.isFinite(item.price));
    const total = priced.reduce((sum, item) => sum + item.price, 0);
    $('estimateTotal').textContent = priced.length ? '금액 표시 항목 합계 ' + money(total) : '최종 금액은 문의 후 확정됩니다.';
  }

  function showEstimate() {
    $('estimateOptions').replaceChildren(...estimate.map((item, index) => {
      const label = create('label', undefined, 'estimate-option');
      const input = create('input');
      input.type = 'checkbox';
      input.value = String(index);
      label.append(input, create('span', item.name + ' · ' + money(item.price)));
      return label;
    }));
    updateTotal();
  }
  $('estimateOptions').addEventListener('change', updateTotal);
  $('writeInquiry').addEventListener('click', () => $('inquiryEditor').showModal());

  function inquiryText(edited) {
    const intro = $('attachment-note').textContent;
    const lines = fields.map((field, i) => field + ': ' + (edited ? editorInputs[i].value.trim() : ''));
    if (!edited) return [intro, '', ...lines].join('\n');
    const selected = selectedEstimate();
    const estimates = selected.length ? [
      '', '견적 내역', ...selected.map(item => '- ' + item.name + ' · ' + money(item.price)),
      $('estimateTotal').textContent, '최종 견적은 상담 후 확정됩니다.'
    ] : [];
    return [intro, '', ...lines, '사용 용도: ' + $('usage').value, ...estimates].join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = create('textarea');
      area.value = text;
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      const active = document.activeElement;
      (active.closest('dialog[open]') || document.body).append(area);
      area.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Manual selection is available below. */ }
      area.remove();
      active.focus({preventScroll: true});
      return copied;
    }
  }

  async function copyInquiry(edited) {
    const text = inquiryText(edited);
    const copied = await copyText(text);
    if (edited) $('inquiryEditor').close();
    if (copied) document.dispatchEvent(new Event('application-copied'));
    $('copyStatus').textContent = copied ? '문의양식을 복사했습니다.' : '자동 복사가 제한되어 직접 복사할 수 있는 창을 준비했습니다.';
    SanEmbed.openInquiry(text, copied, () => {
      const link = window.SAN_PAGE_DATA.artmugUrl;
      if (/^https:\/\/(www\.)?artmug\.kr\//i.test(link)) {
        window.HanxinInquiry.prompt(text, copied, () => window.open(link, '_blank', 'noopener,noreferrer'));
      } else if (!copied && !$('manualCopy').open) {
        $('manualText').value = text;
        $('manualCopy').showModal();
        $('manualText').select();
      }
    });
  }
  $('copyInquiry').addEventListener('click', () => copyInquiry(false));
  $('copyEdited').addEventListener('click', () => copyInquiry(true));

  const smallScreen = matchMedia('(max-width: 760px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let repaintReviews;
  smallScreen.addEventListener('change', () => repaintReviews?.());
  let reviewsVisible = false;
  new IntersectionObserver(([entry]) => { reviewsVisible = entry.isIntersecting; }).observe($('reviews'));

  function renderReviews() {
    const host = $('reviews');
    $('section-about').hidden = !reviews.length;
    $('reviewsLink').hidden = !reviews.length;
    host.replaceChildren();
    clearInterval(reviewTimer);
    activeReview = 0;
    if (!reviews.length) return;
    const row = create('div', undefined, 'review-grid');
    const previous = button('이전 후기');
    const next = button('다음 후기');
    const pause = button('자동 넘김 정지');
    const position = create('span');
    const controls = create('div', undefined, 'review-controls');
    controls.append(previous, position, next, pause);
    host.append(row);
    if (reviews.length > 1) host.append(controls);
    let paused = false;
    function render(delta = 0) {
      activeReview = (activeReview + delta + reviews.length) % reviews.length;
      const shown = Math.min(reviews.length, smallScreen.matches ? 1 : 2);
      row.replaceChildren(...Array.from({length: shown}, (_, offset) => {
        const entry = reviews[(activeReview + offset) % reviews.length];
        const figure = create('figure', undefined, 'review-card');
        figure.append(create('p', entry.text), create('cite', [entry.author, entry.date].filter(Boolean).join(' · ')));
        return figure;
      }));
      position.textContent = (activeReview + 1) + ' / ' + reviews.length;
    }
    repaintReviews = render;
    previous.onclick = () => render(-1);
    next.onclick = () => render(1);
    pause.onclick = () => {
      paused = !paused;
      pause.textContent = paused ? '자동 넘김 재생' : '자동 넘김 정지';
      pause.setAttribute('aria-pressed', String(paused));
    };
    pause.setAttribute('aria-pressed', 'false');
    render();
    if (reviews.length > 1) {
      reviewTimer = setInterval(() => {
        if (reviewsVisible && !paused && !document.hidden && !reducedMotion.matches &&
            !host.matches(':hover') && !host.contains(document.activeElement)) render(1);
      }, 7000);
    }
  }

  function update(data) {
    if (data.calendar) {
      const requestedStatus = data.calendar.defaultStatus;
      calendar = {...data.calendar, defaultStatus: Object.hasOwn(labels, requestedStatus) ? requestedStatus : 'unconfirmed'};
      updateCalendar();
    }
    if (data.portfolio) portfolio.setData(data.portfolio);
    if (Array.isArray(data.reviews)) {
      reviews = data.reviews.filter(entry => typeof entry?.text === 'string' && entry.text.trim());
      repaintReviews = undefined;
      renderReviews();
    }
    if (Array.isArray(data.estimate)) {
      estimate = data.estimate;
      showEstimate();
    }
  }
  // 일정과 포트폴리오의 콘솔 데이터는 연결 이후 이 경로로 갱신할 수 있습니다.
  window.SanPage = Object.freeze({update});
  update(window.SAN_PAGE_DATA);
})();
