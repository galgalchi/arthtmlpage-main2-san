import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, onValue, ref } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

if (!new URLSearchParams(location.search).has('artmug-verify')) {
  const config = window.SAN_FIREBASE_CONFIG;
  const database = getDatabase(initializeApp(config));
  const roots = new Map();
  const supportedStatuses = new Set(['available', 'deadline', 'holiday', 'closed']);

  function watch(path, apply) {
    onValue(ref(database, path), snapshot => apply(snapshot.val()), error => {
      console.warn('샨 Firebase 데이터 읽기 실패', path, error.code);
    });
  }

  watch('callendar-setting', data => {
    const dates = Object.fromEntries(Object.entries(data?.dates || {}).filter(([date, status]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && supportedStatuses.has(status)));
    window.SanPage.update({calendar: {defaultStatus: 'available', dates}});
  });

  for (const path of ['image-category', 'youtube-category']) {
    watch(path, data => {
      roots.set(path, data);
      const image = roots.get('image-category');
      const video = roots.get('youtube-category');
      if (image?.portfolioV2?.version !== 2 && roots.size < 2) return;
      const portfolio = image || video ? ArtmugPortfolio.read(video, image, 'image') : window.SAN_PAGE_DATA.portfolio;
      window.SanPage.update({portfolio});
    });
  }

  watch('main-page/artmugUrl', value => {
    window.SAN_PAGE_DATA.artmugUrl = typeof value === 'string' ? value : '';
  });
}
