// Firebase 연결 전에도 사용할 공개 페이지 데이터입니다. date 키는 한국 날짜(YYYY-MM-DD)입니다.
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
    defaults: { primaryId: 'rt-poster', mode: 'grid' },
    categories: {
      poster: {name: '일반포스터', order: 0, categories: {main: {name: '전체', items: {}}}},
      'rt-poster': {name: 'RT포스터', order: 1, categories: {main: {name: '전체', items: {}}}},
      schedule: {name: '스케줄표', order: 2, categories: {main: {name: '전체', items: {}}}},
      ppt: {name: 'PPT', order: 3, categories: {main: {name: '전체', items: {}}}},
      broadcast: {name: '방송화면', order: 4, categories: {main: {name: '전체', items: {}}}},
      logo: {name: '로고', order: 5, categories: {main: {name: '전체', items: {}}}}
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
