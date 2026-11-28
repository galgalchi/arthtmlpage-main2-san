# 그래픽 디자이너 샨

아트머그 상세페이지에 삽입하는 정적 웹페이지입니다. GitHub Pages는 main 브랜치의 루트를 게시합니다. artmug-embed-code.html의 iframe과 스크립트를 함께 사용합니다.

## 운영

한신 운영 콘솔에서 SYAN 프로젝트(syan-1a87f)를 선택하면 작업 일정, 이미지·영상 포트폴리오와 방문 통계를 관리할 수 있습니다. 메인페이지 연결 확인은 firebase-config.js에 지정한 SYAN 웹 앱 설정을 사용합니다. 콘솔에서 샨의 아트머그 상세페이지를 연결하면 단독 페이지의 문의 버튼에서도 해당 주소를 사용합니다.

일정은 callendar-setting/dates에서 실시간으로 읽습니다. 지난 날짜는 한국 시간에 맞춰 마감으로 표시합니다. 포트폴리오는 image-category/portfolioV2를 읽으며, 기본 선택은 콘솔의 defaults 설정을 사용합니다. page-data.js에는 Firebase 연결 전의 초기 화면과 정적 견적·후기 설정을 둡니다.

방문 통계는 공개 GitHub Pages 주소에서 화면을 5초 이상 방문했을 때 수집합니다. Firebase 익명 인증과 Realtime Database의 analytics 경로를 사용합니다. 보안 규칙은 database.rules.json에 있습니다. 글이나 문의 내용은 통계에 포함하지 않습니다.

## 아트머그 연동

iframe은 문서 높이가 바뀔 때 기존 sliderHeight 메시지를 보냅니다. 부모 스크립트를 함께 설치하면 artmug-embed-v1의 전체 높이 모드, 현재 가시 영역 전달, 이미지 확대, 영상 재생, 문의창 열기를 사용합니다. 문의는 방문자가 직접 확인하고 보냅니다.

콘솔의 ARTMUG_CONFIG_REQUEST 요청에 페이지 정보와 공개 Firebase 설정 필드로 응답합니다. 콘솔 관리 권한은 SYAN 프로젝트에 접근 가능한 Google 계정을 사용합니다.
