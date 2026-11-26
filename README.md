# 그래픽 디자이너 샨

아트머그 상세페이지에 삽입하는 정적 웹페이지입니다. 별도의 빌드나 Firebase 설정 없이 index.html을 열어 확인할 수 있습니다. GitHub Pages에서 게시할 경우 main 브랜치의 루트를 소스로 선택하고 artmug-embed-code.html의 iframe과 스크립트를 함께 사용합니다.

## 초기 데이터

page-data.js에서 일정, 견적, 포트폴리오, 후기, 아트머그 상세페이지 주소를 설정합니다. 새 페이지의 작품과 후기는 빈 상태입니다. 일정 기본값은 unconfirmed(문의)입니다. 한국 시간 기준 지난 날짜는 자동으로 마감됩니다. 날짜별 dates 값은 available, deadline, holiday, closed를 지원하며 notes에 메모를 추가할 수 있습니다.

포트폴리오에는 콘솔과 동일한 V2 자료 구조를 사용합니다. categories의 1차 분류 아래 categories → items를 설정합니다. 이미지 항목에는 type이 image이고 publicUrl을, 영상에는 type이 video이고 YouTube id를 지정합니다. 후기에는 text, author, date를 지정합니다.

## 아트머그 연동

iframe은 문서 높이가 바뀔 때 기존 sliderHeight 메시지를 보냅니다. 부모 스크립트를 함께 설치하면 artmug-embed-v1의 전체 높이 모드, 현재 가시 영역 전달, 이미지 확대, 영상 재생, 문의창 열기를 사용합니다. 문의는 방문자가 직접 확인하고 보냅니다.

후속 콘솔 연결 시 SanPage.update({ calendar, portfolio })로 화면을 갱신할 수 있습니다. 콘솔의 ARTMUG_CONFIG_REQUEST 요청은 페이지 정보와 공개 Firebase 설정 필드로 응답합니다. Firebase 읽기·저장과 방문 분석 전송은 후속 연결 범위입니다.
