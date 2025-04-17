// 백그라운드 스크립트
console.log('스택 트레이스 시각화 백그라운드 스크립트 로드됨');

// DevTools 연결 관리
let connections = {};

// DevTools 페이지에서 연결 요청
chrome.runtime.onConnect.addListener(function(port) {
  // 연결이 DevTools 페이지에서 오는지 확인
  if (port.name !== "panel") return;
  
  // 탭 ID 확인
  const extensionListener = function(message, sender, sendResponse) {
    if (message.name === "init") {
      connections[message.tabId] = port;
      return;
    }
  };

  // 메시지 리스너 추가
  port.onMessage.addListener(extensionListener);

  // 연결 해제 시 리소스 정리
  port.onDisconnect.addListener(function() {
    port.onMessage.removeListener(extensionListener);
    
    // 연결 목록에서 제거
    Object.keys(connections).forEach(function(tabId) {
      if (connections[tabId] === port) {
        delete connections[tabId];
      }
    });
  });
});

// 네트워크 요청 처리를 위한 이벤트 리스너
chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.type === "xmlhttprequest" || details.type === "fetch") {
      // XHR/Fetch 요청 완료 시 DevTools 페이지로 정보 전달
      const tabId = details.tabId;
      if (tabId > 0 && connections[tabId]) {
        connections[tabId].postMessage({
          type: "xhr_completed",
          data: {
            url: details.url,
            method: details.method,
            status: details.statusCode,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// 서비스 워커 활성화 유지
chrome.runtime.onInstalled.addListener(() => {
  console.log('스택 트레이스 시각화 확장 프로그램이 설치되었습니다.');
});

// 백그라운드 워커 활성 상태 유지
chrome.runtime.onStartup.addListener(() => {
  console.log('스택 트레이스 시각화 확장 프로그램이 시작되었습니다.');
}); 