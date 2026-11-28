// Firebase 데이터를 받기 전 표시할 기본값입니다. 날짜 키는 한국 날짜(YYYY-MM-DD)입니다.
window.SAN_PAGE_DATA = {
  name: '샨',
  artmugUrl: '',
  calendar: {
    defaultStatus: 'unconfirmed',
    dates: {},
    notes: {}
  },
  portfolio: {
    version: 2,
    defaults: { primaryId: 'image-category', secondaryId: 'rt-poster', mode: 'grid' },
    categories: {
      'image-category': {
        name: '이미지 포트폴리오',
        order: 0,
        categories: {
          poster: {name: '일반포스터', order: 0},
          'rt-poster': {name: 'RT포스터', order: 1},
          schedule: {name: '스케줄표', order: 2},
          ppt: {name: 'PPT', order: 3},
          broadcast: {name: '방송화면', order: 4},
          logo: {name: '로고', order: 5}
        }
      }
    }
  },
  estimate: [
    {name: '일반포스터', price: null},
    {name: 'RT포스터', price: null},
    {name: '스케줄표', price: null},
    {name: 'PPT', price: null},
    {name: '방송화면', price: null},
    {name: '로고', price: null},
    {name: '포트폴리오 비공개', price: 30000}
  ],
  reviews: []
};
