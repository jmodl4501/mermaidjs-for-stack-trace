// DevTools 패널 생성
chrome.devtools.panels.create(
  "스택 시각화", // 패널 제목
  "/icons/icon16.png", // 패널 아이콘
  "/panel.html", // 패널 HTML 페이지
  function(panel) {
    console.log("스택 시각화 패널이 생성되었습니다.");
    
    // 콘솔 로그 리스너
    chrome.devtools.network.onRequestFinished.addListener(function(request) {
      // 네트워크 요청 처리
    });
  }
); 