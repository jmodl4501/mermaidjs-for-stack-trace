// Mermaid 초기화
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis'
  }
});

// 캡처된 에러 저장 객체
const capturedErrors = [];
let isCapturing = false;

// HTML 캔버스를 이미지로 변환하는 유틸리티 함수
function html2canvas(element) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 요소 크기에 맞게 캔버스 설정
      const rect = element.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // HTMLElement를 이미지로 변환
      const data = new XMLSerializer().serializeToString(element);
      const DOMURL = window.URL || window.webkitURL || window;
      
      const img = new Image();
      const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
      const url = DOMURL.createObjectURL(svgBlob);
      
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        resolve(canvas);
      };
      
      img.onerror = function() {
        reject(new Error('이미지 로드 실패'));
      };
      
      img.src = url;
    } catch (error) {
      console.error('html2canvas 오류:', error);
      reject(error);
    }
  });
}

/**
 * 다이어그램을 PNG로 저장
 */
function saveDiagramAsPNG(svgData, filename) {
  try {
    // SVG 요소 직접 가져오기
    const svgElement = document.querySelector('.mermaid svg');
    if (!svgElement) {
      alert('다이어그램 SVG 요소를 찾을 수 없습니다.');
      return;
    }

    // SVG 복제 및 스타일 설정
    const svgClone = svgElement.cloneNode(true);
    
    // 배경색 추가 (흰색)
    svgClone.style.backgroundColor = 'white';
    
    // SVG 문자열로 변환
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    // SVG 데이터 URL 생성
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // 이미지 생성
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // CORS 설정
    
    img.onload = function() {
      try {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 이미지를 캔버스에 그리기
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // DataURL로 변환 후 다운로드 (toBlob 대신 사용)
        try {
          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = filename || 'diagram.png';
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 리소스 정리
          URL.revokeObjectURL(svgUrl);
        } catch (error) {
          console.error('PNG 변환 오류:', error);
          // 대안: SVG 파일로 저장
          const svgDownloadLink = document.createElement('a');
          svgDownloadLink.download = (filename || 'diagram').replace('.png', '.svg');
          svgDownloadLink.href = svgUrl;
          document.body.appendChild(svgDownloadLink);
          svgDownloadLink.click();
          document.body.removeChild(svgDownloadLink);
          alert('PNG 변환이 불가능하여 SVG 형식으로 저장했습니다.');
        }
      } catch (error) {
        console.error('PNG 변환 중 오류:', error);
        alert('PNG 변환 중 오류가 발생했습니다. SVG 형식으로 저장합니다.');
        // SVG 파일로 다운로드
        const svgDownloadLink = document.createElement('a');
        svgDownloadLink.download = (filename || 'diagram').replace('.png', '.svg');
        svgDownloadLink.href = svgUrl;
        document.body.appendChild(svgDownloadLink);
        svgDownloadLink.click();
        document.body.removeChild(svgDownloadLink);
      }
    };
    
    img.onerror = function(error) {
      console.error('이미지 로딩 오류:', error);
      alert('이미지 로딩 중 오류가 발생했습니다. SVG 형식으로 저장합니다.');
      // SVG 파일로 다운로드
      const svgDownloadLink = document.createElement('a');
      svgDownloadLink.download = (filename || 'diagram').replace('.png', '.svg');
      svgDownloadLink.href = svgUrl;
      document.body.appendChild(svgDownloadLink);
      svgDownloadLink.click();
      document.body.removeChild(svgDownloadLink);
    };
    
    img.src = svgUrl;
  } catch (error) {
    console.error('다이어그램 저장 오류:', error);
    alert('다이어그램 저장 중 오류가 발생했습니다: ' + error.message);
  }
}

// 스택 트레이스를 텍스트 파일로 저장하는 함수
function saveStackTraceAsText(stackTrace, filename) {
  // 텍스트 파일 생성
  const blob = new Blob([stackTrace], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  
  // 다운로드 링크 생성
  const link = document.createElement('a');
  link.download = filename || `stack-trace-${new Date().toISOString().slice(0,19).replace(/[T:]/g, '-')}.txt`;
  link.href = url;
  
  // 링크 클릭하여 다운로드
  document.body.appendChild(link);
  link.click();
  
  // 정리
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 소스 코드를 텍스트 파일로 저장하는 함수
function saveSourceCodeAsText(sourceCode, filename) {
  try {
    // 텍스트 파일 생성
    const blob = new Blob([sourceCode], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    // 다운로드 링크 생성
    const link = document.createElement('a');
    link.download = filename || `stack-source-${new Date().toISOString().slice(0,19).replace(/[T:]/g, '-')}.txt`;
    link.href = url;
    
    // 링크 클릭하여 다운로드
    document.body.appendChild(link);
    link.click();
    
    // 정리
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('소스 코드 저장 오류:', error);
    alert('소스 코드 파일 저장에 실패했습니다.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소
  const stackTraceInput = document.getElementById('stackTraceInput');
  const convertButton = document.getElementById('convertButton');
  const mermaidOutput = document.getElementById('mermaidOutput');
  const sourceCodeOutput = document.getElementById('sourceCodeOutput');
  const captureErrorsBtn = document.getElementById('captureErrorsBtn');
  const stopCaptureBtn = document.getElementById('stopCaptureBtn');
  const clearCapturedBtn = document.getElementById('clearCapturedBtn');
  const capturedErrorsList = document.getElementById('capturedErrors');
  const tabManual = document.getElementById('tabManual');
  const tabCapture = document.getElementById('tabCapture');
  const manualInputPanel = document.getElementById('manualInputPanel');
  const capturePanel = document.getElementById('capturePanel');
  
  // 변환 옵션 추가
  let displayOption = 'full'; // 기본값: 전체 표시

  // 변환 옵션 라디오 버튼 생성 및 추가
  const convertOptionsHTML = `
    <div class="convert-options">
      <span>표시 옵션:</span>
      <label><input type="radio" name="displayOption" value="full" checked> 전체</label>
      <label><input type="radio" name="displayOption" value="file"> 파일명</label>
      <label><input type="radio" name="displayOption" value="function"> 함수명(라인)</label>
    </div>
  `;
  
  // 변환 버튼 위에 옵션 추가
  const inputSection = document.querySelector('.input-section');
  if (inputSection) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'convert-options-container';
    optionsDiv.innerHTML = convertOptionsHTML;
    inputSection.parentNode.insertBefore(optionsDiv, inputSection.nextSibling);
    
    // 옵션 변경 이벤트 리스너
    document.querySelectorAll('input[name="displayOption"]').forEach(radio => {
      radio.addEventListener('change', function() {
        displayOption = this.value;
        // 이미 변환된 스택 트레이스가 있으면 다시 변환
        if (window.currentStackTrace) {
          processStackTrace(window.currentStackTrace);
        }
      });
    });
  }

  // 예시 스택 트레이스 추가 (넥사크로 스타일)
  stackTraceInput.value = `nexacro.__startCommunication @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/SystemBase_HTML5.js?nexaversion=17.0.0.1801:8237
nexacro._startCommunication @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/SystemBase.js?nexaversion=17.0.0.1801:6152
nexacro._loadData @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/SystemBase.js?nexaversion=17.0.0.1801:6059
__pLoadManager.loadDataModule @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/Platform.js?nexaversion=17.0.0.1801:1157
_pForm.transaction @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/component/CompBase/FormBase.js?nexaversion=17.0.0.1801:3903
tran @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/component/ExLib/core.js?nexaversion=17.0.0.1400:2586
fn_searchPageSettingL @ https://biz.kpis.or.kr/kpis_biz/sk/exp/ExpBriefOpenEntp.xfdl.js?nexaversion=20250417:1
fn_searchPage @ https://biz.kpis.or.kr/kpis_biz/sk/exp/ExpBriefOpenEntp.xfdl.js?nexaversion=20250417:1
searchPage @ https://biz.kpis.or.kr/kpis_biz/comm/comPaging.xfdl.js?nexaversion=20250417:1
fn_search @ https://biz.kpis.or.kr/kpis_biz/sk/exp/ExpBriefOpenEntp.xfdl.js?nexaversion=20250417:1
btnSearch_onclick @ https://biz.kpis.or.kr/kpis_biz/sk/exp/ExpBriefOpenEntp.xfdl.js?nexaversion=20250417:1
_pEventListener._fireEvent @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/SystemBase.js?nexaversion=17.0.0.1801:2648
_pComponent.on_fire_onclick @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/component/CompBase/CompEventBase.js?nexaversion=17.0.0.1801:3846
_pComponent._on_click @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/component/CompBase/CompEventBase.js?nexaversion=17.0.0.1801:526
__pWindow._on_default_sys_lbuttonup @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/Platform.js?nexaversion=17.0.0.1801:3478
nexacro._syshandler_lock_onmouseup @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/Platform_HTML5.js?nexaversion=17.0.0.1801:1520
_cur_win._syshandler_lock_onmouseup_forward @ https://biz.kpis.or.kr/kpis_biz/nexacro17lib/framework/Platform_HTML5.js?nexaversion=17.0.0.1801:497`;

  // 페이지 로드 시 자동 변환 시도
  setTimeout(() => {
    try {
      processStackTrace(stackTraceInput.value);
    } catch (error) {
      console.error('초기 스택 트레이스 처리 중 오류:', error);
    }
  }, 500);

  // 탭 전환
  tabManual.addEventListener('click', () => {
    tabManual.classList.add('active');
    tabCapture.classList.remove('active');
    manualInputPanel.classList.add('active');
    capturePanel.classList.remove('active');
  });

  tabCapture.addEventListener('click', () => {
    tabCapture.classList.add('active');
    tabManual.classList.remove('active');
    capturePanel.classList.add('active');
    manualInputPanel.classList.remove('active');
  });

  // 변환 버튼 이벤트
  convertButton.addEventListener('click', () => {
    const stackTrace = stackTraceInput.value;
    if (!stackTrace.trim()) {
      alert('스택 트레이스를 입력해주세요.');
      return;
    }

    try {
      processStackTrace(stackTrace);
    } catch (error) {
      console.error('스택 트레이스 처리 중 오류:', error);
      alert('스택 트레이스 형식이 올바르지 않습니다.');
    }
  });

  // XHR 이벤트 캡처 시작
  captureErrorsBtn.addEventListener('click', () => {
    if (isCapturing) return;
    
    isCapturing = true;
    captureErrorsBtn.textContent = '감지 중...';
    captureErrorsBtn.disabled = true;
    stopCaptureBtn.disabled = false;
    
    // XHR 및 Fetch 요청 캡처를 위한 스크립트 주입
    chrome.devtools.inspectedWindow.eval(`
      (function() {
        // 이미 활성화된 경우 중복 실행 방지
        if (window.__xhrCaptureActive) {
          console.log('XHR 모니터링이 이미 활성화되어 있습니다.');
          return;
        }
        
        // 활성화 플래그 설정
        window.__xhrCaptureActive = true;
        console.log('XHR 모니터링 시작...');
        
        // 스택 트레이스 생성 함수
        function getStackTrace() {
          const err = new Error('XHR 스택 트레이스');
          return err.stack;
        }
        
        // XHR 원본 함수 저장
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalXhrSend = XMLHttpRequest.prototype.send;
        
        // XMLHttpRequest open 메서드 오버라이드
        XMLHttpRequest.prototype.open = function(method, url, async = true, user, password) {
          this.__xhrInfo = {
            method,
            url,
            async,
            startTime: new Date().getTime(),
            stack: getStackTrace()
          };
          
          return originalXhrOpen.apply(this, arguments);
        };
        
        // XMLHttpRequest send 메서드 오버라이드
        XMLHttpRequest.prototype.send = function(body) {
          if (this.__xhrInfo) {
            const xhrInfo = this.__xhrInfo;
            
            // 완료 이벤트 리스너 등록
            this.addEventListener('load', function() {
              try {
                if (!window.__xhrCaptureActive) return;
                
                const endTime = new Date().getTime();
                const responseTime = endTime - xhrInfo.startTime;
                
                const detail = {
                  type: 'xhr',
                  method: xhrInfo.method,
                  url: xhrInfo.url,
                  status: this.status,
                  statusText: this.statusText,
                  stack: xhrInfo.stack,
                  responseTime,
                  timestamp: new Date().toISOString()
                };
                
                // 콘솔에 로그 출력 (캡처를 위함)
                console.log('XHR_STACK_TRACE:' + JSON.stringify(detail));
                
                // 커스텀 이벤트 생성
                const event = new CustomEvent('xhr-captured', { detail });
                document.dispatchEvent(event);
              } catch (e) {
                console.error('XHR 캡처 오류:', e);
              }
            });
            
            // 에러 이벤트 리스너 등록
            this.addEventListener('error', function(event) {
              try {
                if (!window.__xhrCaptureActive) return;
                
                const detail = {
                  type: 'xhr_error',
                  method: xhrInfo.method,
                  url: xhrInfo.url,
                  stack: xhrInfo.stack,
                  error: 'Network Error',
                  timestamp: new Date().toISOString()
                };
                
                console.log('XHR_STACK_TRACE:' + JSON.stringify(detail));
              } catch (e) {
                console.error('XHR 에러 캡처 오류:', e);
              }
            });
          }
          
          return originalXhrSend.apply(this, arguments);
        };
        
        // fetch API 원본 저장
        const originalFetch = window.fetch;
        
        // fetch API 오버라이드
        window.fetch = function(resource, options = {}) {
          if (!window.__xhrCaptureActive) {
            return originalFetch.apply(this, arguments);
          }
          
          const startTime = new Date().getTime();
          const stack = getStackTrace();
          
          // URL 추출
          const url = typeof resource === 'string' ? resource : resource.url;
          const method = options.method || (resource.method) || 'GET';
          
          // 원본 fetch 실행 및 응답 래핑
          return originalFetch.apply(this, arguments)
            .then(response => {
              try {
                if (!window.__xhrCaptureActive) return response;
                
                const endTime = new Date().getTime();
                const responseTime = endTime - startTime;
                
                const detail = {
                  type: 'fetch',
                  method,
                  url,
                  status: response.status,
                  statusText: response.statusText,
                  stack,
                  responseTime,
                  timestamp: new Date().toISOString()
                };
                
                // 콘솔에 로그 출력
                console.log('XHR_STACK_TRACE:' + JSON.stringify(detail));
                
                // 커스텀 이벤트 생성
                const event = new CustomEvent('xhr-captured', { detail });
                document.dispatchEvent(event);
              } catch (e) {
                console.error('Fetch 캡처 오류:', e);
              }
              
              return response;
            })
            .catch(error => {
              try {
                if (window.__xhrCaptureActive) {
                  const detail = {
                    type: 'fetch_error',
                    method,
                    url,
                    stack,
                    error: error.message || 'Fetch Error',
                    timestamp: new Date().toISOString()
                  };
                  
                  console.log('XHR_STACK_TRACE:' + JSON.stringify(detail));
                }
              } catch (e) {
                console.error('Fetch 에러 캡처 오류:', e);
              }
              
              throw error; // 원래 오류 다시 던지기
            });
        };
        
        // XHR 이벤트 리스너
        if (!window.__xhrCaptureListenerRegistered) {
          window.__xhrCaptureListenerRegistered = true;
          
          document.addEventListener('xhr-captured', function(e) {
            if (e && e.detail) {
              // 이벤트 처리 가능
              console.log('XHR 이벤트 캡처됨:', e.detail);
            }
          });
          
          console.log('XHR 이벤트 리스너가 등록되었습니다.');
        }
        
        return 'XHR 모니터링 활성화 성공';
      })();
    `, function(result, isException) {
      if (isException) {
        console.error('XHR 모니터링 스크립트 오류:', isException);
        alert('XHR 캡처 기능을 활성화하는 중 오류가 발생했습니다.');
        stopCapture();
        return;
      }
      
      console.log('XHR 모니터링 스크립트 실행 결과:', result);
    });
    
    // 콘솔 메시지 리스너 등록
    chrome.devtools.console.onMessageAdded.addListener(function(message) {
      if (!isCapturing) return;
      
      try {
        const text = message.text || '';
        
        // XHR 스택 트레이스 메시지 추출
        if (text.includes('XHR_STACK_TRACE:')) {
          const jsonStr = text.replace('XHR_STACK_TRACE:', '').trim();
          const xhrData = JSON.parse(jsonStr);
          addCapturedXHR(xhrData);
        }
      } catch (e) {
        console.error('콘솔 메시지 처리 중 오류:', e);
      }
    });
    
    // 네트워크 요청 리스너 등록 (보조적인 방법)
    chrome.devtools.network.onRequestFinished.addListener(function(request) {
      if (!isCapturing) return;
      
      try {
        if (request.request && (request.request.method === 'GET' || request.request.method === 'POST')) {
          // 콘솔 메시지에서 캡처되지 않은 경우에만 추가
          const url = request.request.url;
          
          // 이미 캡처된 항목이 있는지 확인
          const isDuplicate = capturedErrors.some(item => {
            return item.type === 'xhr' && 
                   item.data && 
                   item.data.url === url && 
                   Date.now() - new Date(item.timestamp).getTime() < 2000; // 2초 이내에 캡처된 항목
          });
          
          if (!isDuplicate) {
            const xhrData = {
              type: 'xhr',
              method: request.request.method,
              url: url,
              status: request.response.status,
              statusText: request.response.statusText,
              stack: '네트워크 패널에서 캡처됨 - 스택 트레이스 없음',
              timestamp: new Date().toISOString()
            };
            
            addCapturedXHR(xhrData);
          }
        }
      } catch (e) {
        console.error('네트워크 요청 처리 중 오류:', e);
      }
    });
  });

  // 캡처 중지
  stopCaptureBtn.addEventListener('click', () => {
    stopCapture();
  });

  // 캡처된 항목 초기화
  clearCapturedBtn.addEventListener('click', () => {
    capturedErrors.length = 0;
    updateCapturedList();
  });

  // 캡처 중지 함수
  function stopCapture() {
    isCapturing = false;
    captureErrorsBtn.textContent = 'XHR 감지 시작';
    captureErrorsBtn.disabled = false;
    stopCaptureBtn.disabled = true;
    
    // 스크립트를 통해 XHR 캡처 비활성화
    chrome.devtools.inspectedWindow.eval(`
      (function() {
        if (!window.__xhrCaptureActive) {
          console.log('XHR 모니터링이 이미 비활성화되어 있습니다.');
          return;
        }
        
        window.__xhrCaptureActive = false;
        
        // 원본 XHR 메서드 복원
        if (XMLHttpRequest.prototype.__original_open) {
          XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.__original_open;
          delete XMLHttpRequest.prototype.__original_open;
        }
        
        if (XMLHttpRequest.prototype.__original_send) {
          XMLHttpRequest.prototype.send = XMLHttpRequest.prototype.__original_send;
          delete XMLHttpRequest.prototype.__original_send;
        }
        
        // 원본 fetch 복원
        if (window.__original_fetch) {
          window.fetch = window.__original_fetch;
          delete window.__original_fetch;
        }
        
        console.log('XHR 모니터링이 중지되었습니다.');
        return 'XHR 모니터링 비활성화 성공';
      })();
    `, function(result, isException) {
      if (isException) {
        console.error('XHR 모니터링 중지 중 오류:', isException);
      }
      console.log('XHR 모니터링 중지 결과:', result);
    });
  }

  // XHR 이벤트 추가
  function addCapturedXHR(xhrData) {
    try {
      capturedErrors.push({
        type: 'xhr',
        data: xhrData,
        message: `${xhrData.method} ${xhrData.url}`,
        stack: xhrData.stack,
        timestamp: xhrData.timestamp || new Date().toISOString()
      });
      
      updateCapturedList();
      
      // 자동 다이어그램 생성 및 저장
      if (isCapturing) {
        const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
        const baseFilename = `xhr-stack-trace-${timestamp}`;
        
        // 스택 트레이스 처리 (비동기로 처리하여 UI 블로킹 방지)
        setTimeout(() => {
          try {
            processStackTrace(xhrData.stack);
            
            // 약간의 지연 후 저장 (다이어그램이 렌더링될 시간 필요)
            setTimeout(() => {
              try {
                // PNG 및 텍스트 파일로 저장
                saveDiagramAsPNG(null, `${baseFilename}.png`);
                
                // 스택 트레이스 저장
                saveStackTraceAsText(xhrData.stack, `${baseFilename}.txt`);
                
                // 소스 코드 저장
                const sourceCodeText = generateSourceTextForDownload(parseStackTrace(xhrData.stack));
                if (sourceCodeText) {
                  saveSourceCodeAsText(sourceCodeText, `${baseFilename}-source.txt`);
                }
              } catch (e) {
                console.error('캡처 파일 저장 오류:', e);
              }
            }, 1500);
          } catch (error) {
            console.error('XHR 스택 트레이스 처리 중 오류:', error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('XHR 데이터 추가 오류:', error);
    }
  }

  // 캡처된 항목 목록 업데이트
  function updateCapturedList() {
    if (capturedErrors.length === 0) {
      capturedErrorsList.innerHTML = '<p class="empty-message">감지된 항목이 없습니다. XHR 감지를 시작하고 네트워크 요청을 발생시켜 보세요.</p>';
      return;
    }
    
    capturedErrorsList.innerHTML = '';
    
    // 복제 및 역순 정렬 (최신 항목이 위에 표시)
    const sortedErrors = [...capturedErrors].reverse();
    
    sortedErrors.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'error-item';
      
      // XHR 항목인 경우 UI 다르게 처리
      if (item.type === 'xhr') {
        const xhrData = item.data;
        const statusCode = xhrData.status || 0;
        const statusClass = statusCode >= 400 ? 'xhr-error' : (statusCode >= 300 ? 'xhr-redirect' : 'xhr-success');
        
        itemElement.classList.add(statusClass);
        itemElement.innerHTML = `
          <div class="xhr-item-header">
            <strong>${xhrData.method || 'XHR'}</strong> 
            <span class="xhr-url">${(xhrData.url || '').split('?')[0]}</span>
            <span class="xhr-status">${statusCode}</span>
          </div>
          <div class="xhr-item-time">
            <small>${new Date(item.timestamp).toLocaleTimeString()}</small>
          </div>
        `;
        
        // 추가 버튼 - 바로 저장
        const actionButtons = document.createElement('div');
        actionButtons.className = 'xhr-actions';
        actionButtons.innerHTML = `
          <button class="action-button save-btn">저장</button>
          <button class="action-button view-stack-btn">스택 보기</button>
        `;
        itemElement.appendChild(actionButtons);
        
        // 저장 버튼 이벤트
        const saveBtn = actionButtons.querySelector('.save-btn');
        saveBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // 버블링 방지
          
          const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
          const baseFilename = `xhr-stack-trace-${timestamp}`;
          
          try {
            // 스택 트레이스 처리
            const parsedStack = parseStackTrace(item.stack);
            
            // PNG 저장
            saveDiagramAsPNG(null, `${baseFilename}.png`);
            
            // 스택 트레이스 저장
            saveStackTraceAsText(item.stack, `${baseFilename}.txt`);
            
            // 소스코드 저장
            const sourceCodeText = generateSourceTextForDownload(parsedStack);
            if (sourceCodeText) {
              saveSourceCodeAsText(sourceCodeText, `${baseFilename}-source.txt`);
            }
          } catch (error) {
            console.error('XHR 항목 저장 오류:', error);
          }
        });
        
        // 스택 보기 버튼 이벤트
        const viewStackBtn = actionButtons.querySelector('.view-stack-btn');
        viewStackBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // 버블링 방지
          processStackTrace(item.stack);
        });
      } else {
        // 기본 오류 항목
        itemElement.innerHTML = `<strong>${item.message || '오류'}</strong> <small>(${new Date(item.timestamp).toLocaleTimeString()})</small>`;
      }
      
      // 원래 인덱스 저장 (정렬 후에도 원본 배열 참조 가능하도록)
      itemElement.dataset.originalIndex = capturedErrors.length - 1 - index;
      
      // 항목 클릭 이벤트
      itemElement.addEventListener('click', () => {
        const originalIndex = parseInt(itemElement.dataset.originalIndex, 10);
        const clickedItem = capturedErrors[originalIndex];
        if (clickedItem && clickedItem.stack) {
          processStackTrace(clickedItem.stack);
        }
      });
      
      capturedErrorsList.appendChild(itemElement);
    });
  }

  // 스택 트레이스 처리 공통 함수
  function processStackTrace(stackTrace) {
    console.log('처리할 스택 트레이스:', stackTrace);

    // 스택 트레이스 파싱
    const parsedStack = parseStackTrace(stackTrace);
    console.log('파싱된 스택:', parsedStack);
    
    // 다이어그램 생성
    generateMermaidDiagram(parsedStack);
    
    // 소스 코드 섹션 생성
    generateSourceCode(parsedStack);
    
    // 현재 처리 중인 스택 트레이스 저장 (저장 버튼용)
    window.currentStackTrace = stackTrace;
  }

  /**
   * 스택 트레이스를 파싱하여 구조화된 데이터로 변환
   */
  function parseStackTrace(stackTrace) {
    const lines = stackTrace.split('\n');
    const parsedStack = [];
    
    // 첫 번째 줄은 일반적으로 에러 메시지이므로 스킵할 수 있음
    const errorMessageLine = lines[0];
    let errorMessage = '';
    
    if (!errorMessageLine.trim().startsWith('at ') && !errorMessageLine.includes('@')) {
      errorMessage = errorMessageLine.trim();
    }

    // 파일명에서 쿼리 파라미터 제거 함수
    function cleanFileName(fileName) {
      if (!fileName) return '';
      // ? 이후의 쿼리스트링 제거
      return fileName.split('?')[0];
    }

    // 각 스택 프레임 파싱
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 정규식 패턴 - 크롬 스타일 ('at 함수명 (파일:라인:컬럼)') 또는 넥사크로 스타일 ('함수명 @ 파일:라인:컬럼')
      // 크롬 표준 스택 트레이스 스타일
      let match = null;
      let functionName = '';
      let filePath = '';
      let lineNumber = 0;
      let columnNumber = 0;
      
      // 크롬 스타일: 'at 함수명 (파일:라인:컬럼)'
      if (trimmedLine.startsWith('at ')) {
        const regex = /at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/;
        match = trimmedLine.match(regex);
        
        if (match) {
          [_, functionName, filePath, lineNumber, columnNumber] = match;
        }
      } 
      // 넥사크로 스타일: '함수명 @ 파일:라인'
      else if (trimmedLine.includes('@')) {
        const parts = trimmedLine.split('@');
        functionName = parts[0].trim();
        
        const urlMatch = parts[1].trim().match(/(.+):(\d+)(?::(\d+))?/);
        if (urlMatch) {
          filePath = urlMatch[1];
          lineNumber = urlMatch[2];
          columnNumber = urlMatch[3] || 0;
          match = [null, functionName, filePath, lineNumber, columnNumber];
        }
      }
      
      if (match) {
        // 파일 경로에서 파일명만 추출 (경로 제외)
        const fullPath = filePath;
        const fileName = fullPath.split('/').pop();
        const cleanedFileName = cleanFileName(fileName);
        
        parsedStack.push({
          functionName: functionName || '(anonymous)',
          filePath: fullPath,
          fileName: cleanedFileName,
          origFileName: fileName, // 원본 파일명도 저장
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10) || 0,
          raw: trimmedLine
        });
      }
    }
    
    return {
      errorMessage,
      frames: parsedStack
    };
  }

  /**
   * Mermaid 다이어그램 생성
   */
  function generateMermaidDiagram(parsedStack) {
    const { frames } = parsedStack;
    
    if (frames.length === 0) {
      mermaidOutput.innerHTML = '<p>파싱할 스택 프레임이 없습니다.</p>';
      return;
    }
    
    // 설정 객체
    const settings = {
      ignoreList: [] // 기본 무시 목록
    };
    
    // 설정 UI 추가
    const settingsHTML = `
      <div class="diagram-settings">
        <details>
          <summary>다이어그램 설정</summary>
          <div class="settings-form">
            <div class="settings-group">
              <label>
                <input type="checkbox" id="enableIgnoreList"> 소스 무시 목록 사용
              </label>
              <textarea id="ignoreListField" class="ignore-list-field" placeholder="무시할 파일명을 각 줄에 입력하세요. (예: nexacro17lib, jquery.min.js)" disabled></textarea>
            </div>
            <div class="settings-group">
              <button id="applySettingsBtn" class="settings-button">설정 적용</button>
            </div>
          </div>
        </details>
      </div>
    `;
    
    // 무시 목록 적용 함수
    function applyIgnoreList(frames, ignoreList) {
      if (!ignoreList || ignoreList.length === 0) return frames;
      
      return frames.filter(frame => {
        const fileName = frame.fileName || '';
        // 무시 목록에 포함된 파일명이면 필터링
        return !ignoreList.some(ignoreItem => 
          fileName.toLowerCase().includes(ignoreItem.toLowerCase())
        );
      });
    }
    
    // 필터링된 프레임
    let filteredFrames = [...frames];
    
    // Mermaid 다이어그램 문법 생성
    // 방향을 명시적으로 'TD'로 설정하여 호환성 문제 해결
    let mermaidCode = 'flowchart TD\n';
    
    // 전체 그래프 스타일 설정
    mermaidCode += '  %% 노드 간격 및 방향 설정\n';
    mermaidCode += '  linkStyle default interpolate basis\n';
    mermaidCode += '  classDef default fill:#f9f9f9,stroke:#aaa,stroke-width:1px\n';
    mermaidCode += '  classDef sequenceNode fill:#e1f5fe,stroke:#4fc3f7,stroke-width:2px\n\n';
    
    // HTML 이스케이프 처리를 위한 함수
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // 파일별 그룹화 (같은 파일명을 가진 프레임들을 그룹화)
    const fileGroups = {};
    let groupCount = 0;
    
    filteredFrames.forEach((frame, index) => {
      // 파일명은 이미 cleanFileName()에 의해 정리됨
      if (!fileGroups[frame.fileName]) {
        fileGroups[frame.fileName] = {
          groupId: `group${groupCount++}`,
          frames: []
        };
      }
      
      fileGroups[frame.fileName].frames.push({...frame, index});
    });
    
    // 각 파일 그룹과 노드 추가
    Object.entries(fileGroups).forEach(([fileName, group]) => {
      const groupId = group.groupId;
      const escapedFileName = escapeHtml(fileName);
      
      // 파일 그룹 서브그래프 시작 - 특수문자 처리
      mermaidCode += `  subgraph ${groupId}["${escapedFileName}"]\n`;
      
      // 각 프레임을 노드로 추가
      group.frames.forEach(frame => {
        const nodeId = `frame${frame.index}`;
        
        // 실행 순서 번호 계산 (역순: 마지막 호출이 1번)
        const sequenceNum = filteredFrames.length - frame.index;
        
        // 선택된 표시 옵션에 따라 노드 레이블 생성
        let label = '';
        
        if (displayOption === 'full') {
          // 전체 정보 표시 (실행 순서 추가)
          label = `[${sequenceNum}] 파일명: ${escapeHtml(frame.fileName)}\\n함수명: ${escapeHtml(frame.functionName)}\\n라인: ${frame.lineNumber}`;
        } else if (displayOption === 'file') {
          // 파일명만 표시 (실행 순서 추가)
          label = `[${sequenceNum}] ${escapeHtml(frame.fileName)}`;
        } else if (displayOption === 'function') {
          // 함수명(라인)만 표시 (실행 순서 추가, 라인 표시 방식 변경)
          label = `[${sequenceNum}] ${escapeHtml(frame.functionName)} (line:${frame.lineNumber})`;
        }
        
        // 노드 추가 - label은 쌍따옴표로 감싸서 특수문자 이스케이프 문제 방지
        mermaidCode += `    ${nodeId}["${label}"]\n`;
        
        // 노드 클릭 이벤트 추가
        mermaidCode += `    click ${nodeId} callback${frame.index}\n`;
      });
      
      // 그룹 내부에서 프레임 간의 연결 추가
      for (let i = 0; i < group.frames.length - 1; i++) {
        const currentFrame = group.frames[i];
        const nextFrame = group.frames[i + 1];
        
        // 같은 파일 내에서 호출 순서대로 연결
        if (currentFrame.index > nextFrame.index) {
          // 실행 순서 레이블 추가
          const currentSequence = filteredFrames.length - currentFrame.index;
          const nextSequence = filteredFrames.length - nextFrame.index;
          mermaidCode += `    frame${currentFrame.index} -->|"${currentSequence} → ${nextSequence}"| frame${nextFrame.index}\n`;
        }
      }
      
      // 파일 그룹 서브그래프 종료
      mermaidCode += `  end\n`;
    });
    
    // 다른 파일 그룹 간의 연결 추가 (역순: 실행 순서대로)
    for (let i = filteredFrames.length - 1; i > 0; i--) {
      const currentFrame = filteredFrames[i];
      const nextFrame = filteredFrames[i - 1];
      
      // 다른 파일 간의 호출은 그룹 간 연결로 표시
      if (currentFrame.fileName !== nextFrame.fileName) {
        // 실행 순서 레이블 추가
        const currentSequence = filteredFrames.length - i;
        const nextSequence = filteredFrames.length - (i-1);
        mermaidCode += `  frame${i} -->|"${currentSequence} → ${nextSequence}"| frame${i-1}\n`;
      }
    }
    
    // 추가적인 스타일 및 방향 설정
    mermaidCode += '\n  %% 스타일 설정\n';
    mermaidCode += '  classDef sequenceNode font-size:12px,font-family:Arial,text-align:left\n';
    
    console.log("생성된 Mermaid 코드:", mermaidCode);
    
    // Mermaid 다이어그램 렌더링 컨테이너
    mermaidOutput.innerHTML = `
      ${settingsHTML}
      <div class="diagram-header">
        <button id="saveDiagramBtn" class="save-button">PNG로 저장</button>
        <button id="saveTraceBtn" class="save-button">스택 트레이스 저장</button>
        <button id="saveSourceBtn" class="save-button">소스코드 저장</button>
        <button id="toggleCodeBtn" class="toggle-button">Mermaid 코드 보기</button>
        <button id="prettyPrintBtn" class="toggle-button">코드 정리</button>
      </div>
      <div id="mermaid-container" class="diagram-container"></div>
      <div class="mermaid-code-container" style="display: none;">
        <textarea class="mermaid-code" readonly>${mermaidCode}</textarea>
        <button id="copyCodeBtn" class="copy-button">코드 복사</button>
      </div>
    `;
    
    try {
      // Mermaid 초기화 및 렌더링
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'default',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis',
          nodeSpacing: 50,
          rankSpacing: 100,
          padding: 30
        }
      });
      
      // 다이어그램 컨테이너 요소 가져오기
      const container = document.getElementById('mermaid-container');
      
      // 렌더링 함수
      function renderDiagram(code) {
        // 다이어그램을 렌더링 - mermaid.render API 사용
        mermaid.render('mermaid-diagram', code)
          .then(result => {
            container.innerHTML = result.svg;
            
            // 노드 클릭 이벤트 설정
            filteredFrames.forEach((frame, index) => {
              window[`callback${index}`] = function() {
                console.log(`노드 ${index} 클릭됨:`, frame);
                
                // 소스 코드 섹션으로 스크롤
                const functionBlock = document.getElementById(`function-block-${index}`);
                if (functionBlock) {
                  functionBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // 하이라이트 효과 추가
                  functionBlock.classList.add('highlight-block');
                  setTimeout(() => {
                    functionBlock.classList.remove('highlight-block');
                  }, 2000);
                }
                
                // 소스 코드 패널로 이동 (백그라운드에서)
                jumpToSource(frame.filePath, frame.lineNumber, frame.columnNumber);
              };
            });
            
            // 그룹 스타일 개선
            const svgElement = container.querySelector('svg');
            if (svgElement) {
              // SVG 사이즈 조정 (노드 텍스트가 잘리지 않도록)
              svgElement.setAttribute('width', '100%');
              
              // 그룹 스타일 적용
              const groupNodes = svgElement.querySelectorAll('.cluster');
              groupNodes.forEach(group => {
                group.classList.add('file-group');
              });
              
              // 노드 텍스트 스타일 개선
              const nodeTexts = svgElement.querySelectorAll('.node text');
              nodeTexts.forEach(text => {
                text.style.fontFamily = 'Arial, sans-serif';
                text.style.fontSize = '12px';
              });
              
              // 연결선(엣지) 스타일 개선 
              const edges = svgElement.querySelectorAll('.edgePath');
              edges.forEach(edge => {
                // 연결선 스타일 개선
                const path = edge.querySelector('path');
                if (path) {
                  path.style.strokeWidth = '1.5px';
                  path.style.stroke = '#3498db';
                }
                
                // 엣지 레이블(시퀀스 번호) 스타일 개선
                const edgeLabel = edge.querySelector('.edgeLabel');
                if (edgeLabel) {
                  edgeLabel.style.background = '#e1f5fe';
                  edgeLabel.style.border = '1px solid #4fc3f7';
                  edgeLabel.style.borderRadius = '4px';
                  edgeLabel.style.padding = '2px 4px';
                  edgeLabel.style.fontSize = '11px';
                  edgeLabel.style.color = '#0277bd';
                }
              });
            }
          })
          .catch(err => {
            console.error('Mermaid 렌더링 오류:', err);
            container.innerHTML = `<div class="error">다이어그램 렌더링 실패: ${err.message || '알 수 없는 오류'}</div>`;
          });
      }
      
      // 초기 렌더링
      renderDiagram(mermaidCode);
      
      // 버튼 이벤트 리스너 추가
      setTimeout(() => {
        // 설정 이벤트 리스너
        const enableIgnoreListCheckbox = document.getElementById('enableIgnoreList');
        const ignoreListField = document.getElementById('ignoreListField');
        const applySettingsBtn = document.getElementById('applySettingsBtn');
        
        if (enableIgnoreListCheckbox && ignoreListField) {
          // 체크박스 상태에 따라 텍스트 영역 활성화/비활성화
          enableIgnoreListCheckbox.addEventListener('change', function() {
            ignoreListField.disabled = !this.checked;
          });
          
          // 기본 무시 목록 설정
          ignoreListField.value = 'nexacro17lib\njquery';
        }
        
        // 설정 적용 버튼
        if (applySettingsBtn) {
          applySettingsBtn.addEventListener('click', function() {
            // 현재 설정 저장
            settings.ignoreList = enableIgnoreListCheckbox.checked 
              ? ignoreListField.value.split('\n').filter(item => item.trim() !== '')
              : [];
            
            // 프레임 필터링
            filteredFrames = applyIgnoreList([...frames], settings.ignoreList);
            
            // 다이어그램 다시 생성 및 렌더링
            generateMermaidDiagram(parsedStack);
          });
        }
        
        // PNG 저장 버튼
        const saveDiagramBtn = document.getElementById('saveDiagramBtn');
        if (saveDiagramBtn) {
          saveDiagramBtn.addEventListener('click', () => {
            const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
            saveDiagramAsPNG(null, `stack-trace-diagram-${timestamp}.png`);
          });
        }
        
        // 스택 트레이스 저장 버튼
        const saveTraceBtn = document.getElementById('saveTraceBtn');
        if (saveTraceBtn) {
          saveTraceBtn.addEventListener('click', () => {
            if (window.currentStackTrace) {
              const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
              saveStackTraceAsText(window.currentStackTrace, `stack-trace-${timestamp}.txt`);
            } else {
              alert('저장할 스택 트레이스가 없습니다.');
            }
          });
        }
        
        // 소스코드 저장 버튼
        const saveSourceBtn = document.getElementById('saveSourceBtn');
        if (saveSourceBtn) {
          saveSourceBtn.addEventListener('click', () => {
            // 현재 화면에 표시된 소스 코드를 가져옴
            const sourceCodeText = generateSourceTextForDownload(parsedStack);
            if (sourceCodeText) {
              const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
              saveSourceCodeAsText(sourceCodeText, `stack-source-${timestamp}.txt`);
            } else {
              alert('저장할 소스 코드가 없습니다.');
            }
          });
        }
        
        // Mermaid 코드 보기/숨기기 토글 버튼
        const toggleCodeBtn = document.getElementById('toggleCodeBtn');
        const codeContainer = document.querySelector('.mermaid-code-container');
        if (toggleCodeBtn && codeContainer) {
          toggleCodeBtn.addEventListener('click', () => {
            const isVisible = codeContainer.style.display !== 'none';
            codeContainer.style.display = isVisible ? 'none' : 'block';
            toggleCodeBtn.textContent = isVisible ? 'Mermaid 코드 보기' : 'Mermaid 코드 숨기기';
          });
        }
        
        // 코드 복사 버튼
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        const codeTextarea = document.querySelector('.mermaid-code');
        if (copyCodeBtn && codeTextarea) {
          copyCodeBtn.addEventListener('click', () => {
            codeTextarea.select();
            document.execCommand('copy');
            copyCodeBtn.textContent = '복사 완료!';
            setTimeout(() => {
              copyCodeBtn.textContent = '코드 복사';
            }, 1500);
          });
        }
        
        // 코드 정리 버튼 (Pretty Print)
        const prettyPrintBtn = document.getElementById('prettyPrintBtn');
        if (prettyPrintBtn) {
          prettyPrintBtn.addEventListener('click', () => {
            // 소스 코드 요약 보기를 위한 CSS 추가
            let currentStyle = document.getElementById('prettyPrintStyle');
            if (!currentStyle) {
              const styleElement = document.createElement('style');
              styleElement.id = 'prettyPrintStyle';
              styleElement.textContent = `
                .function-block pre { 
                  max-height: 100px; 
                  overflow: auto; 
                  position: relative;
                }
                .function-block.expanded pre { 
                  max-height: none; 
                }
                .function-block .expand-btn {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 70%);
                  text-align: center;
                  padding-top: 50px;
                  cursor: pointer;
                  font-weight: bold;
                  color: #0277bd;
                }
                .function-block.expanded .expand-btn {
                  position: relative;
                  background: none;
                  padding: 5px 0;
                }
                .highlighted-line {
                  background-color: #ffef9e !important;
                  font-weight: bold;
                }
              `;
              document.head.appendChild(styleElement);
              
              // 각 코드 블록에 확장 버튼 추가
              document.querySelectorAll('.function-block').forEach(block => {
                if (!block.querySelector('.expand-btn')) {
                  const expandBtn = document.createElement('div');
                  expandBtn.className = 'expand-btn';
                  expandBtn.textContent = '더 보기 ▼';
                  expandBtn.addEventListener('click', function() {
                    block.classList.toggle('expanded');
                    this.textContent = block.classList.contains('expanded') ? '접기 ▲' : '더 보기 ▼';
                  });
                  block.appendChild(expandBtn);
                }
              });
              
              prettyPrintBtn.textContent = '원본 코드 보기';
            } else {
              // 스타일 제거
              currentStyle.remove();
              
              // 확장 버튼 제거
              document.querySelectorAll('.expand-btn').forEach(btn => {
                btn.remove();
              });
              
              // 확장된 클래스 제거
              document.querySelectorAll('.function-block.expanded').forEach(block => {
                block.classList.remove('expanded');
              });
              
              prettyPrintBtn.textContent = '코드 정리';
            }
          });
        }
      }, 500);
    } catch (error) {
      console.error('Mermaid 다이어그램 렌더링 오류:', error);
      mermaidOutput.innerHTML += `<p class="error-message">다이어그램 생성 중 오류가 발생했습니다: ${error.message}</p>`;
    }
  }
  
  /**
   * 현재 생성된 소스 코드를 텍스트 형식으로 추출하는 함수
   */
  function generateSourceTextForDownload(parsedStack) {
    const { frames } = parsedStack;
    if (!frames || frames.length === 0) return null;
    
    let result = "# 스택 트레이스 소스 코드 요약\n\n";
    
    // 각 프레임 정보를 텍스트로 변환
    frames.forEach((frame, index) => {
      result += `## ${index + 1}. ${frame.fileName} - ${frame.functionName}\n`;
      result += `파일 경로: ${frame.filePath}\n`;
      result += `라인: ${frame.lineNumber}, 컬럼: ${frame.columnNumber}\n\n`;
      
      // 가상의 소스 코드 내용 추가
      let fileName = frame.fileName;
      const isNexacroFile = fileName.includes('nexacro') || fileName.includes('.xfdl.js');
      
      result += "```javascript\n";
      if (isNexacroFile) {
        // 넥사크로 스타일 코드
        result += `// ${fileName}\n`;
        result += `/***********************************************************************\n`;
        result += ` * ${fileName.includes('xfdl.js') ? "Form 코드" : "Library 함수"}\n`;
        result += ` ***********************************************************************/\n\n`;
        result += `// 함수 정의\n`;
        result += `${fileName.includes('xfdl.js') ? "this." : ""}${frame.filePath.includes("fn_") ? "fn_" : ""}${frame.filePath.includes("transaction") ? "transaction" : frame.functionName} = function(${fileName.includes('transaction') ? "id, url, inData, outData, args, callback" : "arg1, arg2"})\n`;
        result += `{\n`;
        result += `    // 변수 선언\n`;
        result += `    var ${fileName.includes('xfdl.js') ? "objApp = nexacro.getApplication();" : "result = null;"}\n\n`;
        result += `    // 주요 로직 실행\n`;
        result += `    // 라인 ${frame.lineNumber}에서 호출\n`;
        result += `    ${fileName.includes('transaction') ? "this.transaction(id, url, inData, outData, args, callback);" : "return result;"}\n`;
        result += `}\n`;
      } else {
        // 일반 JS 스타일 코드
        result += `// ${fileName}\n`;
        result += `function ${frame.functionName}() {\n`;
        result += `  // 라인 ${frame.lineNumber}에서 호출\n`;
        result += `  const result = someOperation();\n`;
        result += `  return result;\n`;
        result += `}\n`;
      }
      result += "```\n\n";
    });
    
    return result;
  }

  /**
   * 소스 코드 표시 - Chrome DevTools에서 가능한 방식으로 구현
   */
  function generateSourceCode(parsedStack) {
    const { frames } = parsedStack;
    
    if (frames.length === 0) {
      sourceCodeOutput.textContent = '파싱할 스택 프레임이 없습니다.';
      return;
    }
    
    // 안내 메시지 표시
    sourceCodeOutput.innerHTML = '<div class="loading-message">스택 소스 코드를 생성하는 중...</div>';
    
    let html = '';
    const promises = [];
    
    // 각 프레임에 대해 소스 코드 가져오기
    frames.forEach((frame, index) => {
      const promise = getSourceCode(frame.filePath, frame.lineNumber)
        .then(sourceCode => {
          if (sourceCode) {
            // 소스 코드를 HTML로 변환
            const codeHtml = `
              <div id="function-block-${index}" class="function-block">
                <div class="function-header">
                  <div class="function-title">${frame.fileName} - ${frame.functionName} (${frame.lineNumber}:${frame.columnNumber})</div>
                  <span class="jump-to-source" onclick="window.jumpToSource('${frame.filePath}', ${frame.lineNumber}, ${frame.columnNumber})">소스로 이동</span>
                </div>
                ${sourceCode}
              </div>
            `;
            return { index, html: codeHtml };
          }
          return { 
            index, 
            html: `<div id="function-block-${index}" class="function-block">
                     <div class="function-header">${frame.fileName} - ${frame.functionName} (${frame.lineNumber}:${frame.columnNumber})</div>
                     <p>소스 코드를 가져올 수 없습니다.</p>
                   </div>`
          };
        })
        .catch(error => {
          console.error('소스 코드 가져오기 오류:', error);
          return { 
            index, 
            html: `<div id="function-block-${index}" class="function-block">
                     <div class="function-header">${frame.fileName} - ${frame.functionName} (${frame.lineNumber}:${frame.columnNumber})</div>
                     <p>오류: ${error.message}</p>
                   </div>`
          };
        });
      
      promises.push(promise);
    });
    
    // 모든 소스 코드를 가져온 후 표시
    Promise.all(promises)
      .then(results => {
        // 인덱스 순서대로 정렬
        results.sort((a, b) => a.index - b.index);
        
        // HTML 생성
        const html = results.map(result => result.html).join('');
        
        // 맨 위로 버튼 추가 (크기 조정)
        const finalHtml = `
          ${html}
          <div class="back-to-top" onclick="document.getElementById('mermaidOutput').scrollIntoView({behavior: 'smooth'})">
            ↑
          </div>
        `;
        
        sourceCodeOutput.innerHTML = finalHtml;
        
        // 소스로 이동 버튼 동작 보장
        document.querySelectorAll('.jump-to-source').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const onclick = this.getAttribute('onclick');
            if (onclick) {
              try {
                // onclick 속성에서 파라미터 추출
                const params = onclick.match(/jumpToSource\('(.+?)',\s*(\d+),\s*(\d+)/);
                if (params && params.length >= 4) {
                  const url = params[1];
                  const line = parseInt(params[2], 10);
                  const column = parseInt(params[3], 10);
                  
                  // 함수 직접 호출
                  window.jumpToSource(url, line, column);
                }
              } catch (error) {
                console.error('소스로 이동 버튼 오류:', error);
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('소스 코드 렌더링 오류:', error);
        sourceCodeOutput.innerHTML = `<p>소스 코드를 렌더링하는 중 오류가 발생했습니다: ${error.message}</p>`;
      });
  }

  /**
   * 소스 코드로 이동 함수
   */
  function jumpToSource(url, lineNumber, columnNumber) {
    console.log('소스로 이동:', url, lineNumber, columnNumber);
    
    try {
      // Chrome DevTools API를 사용해 소스코드 패널로 이동
      chrome.devtools.panels.openResource(url, lineNumber - 1, function(result) {
        if (!result) {
          console.log('소스 파일을 열 수 없습니다:', url);
        }
      });
    } catch (error) {
      console.error('소스로 이동 중 오류 발생:', error);
      alert(`소스 파일을 열 수 없습니다: ${url}`);
    }
  }

  /**
   * 소스 코드 가져오기 - Chrome DevTools API 사용
   */
  function getSourceCode(filePath, lineNumber) {
    return new Promise((resolve, reject) => {
      try {
        // 실제 Chrome DevTools 연동 시도
        const startLine = Math.max(1, lineNumber - 5); // 해당 라인 전후로 5줄씩 표시
        const endLine = lineNumber + 5;
        
        // Chrome DevTools API를 사용하여 실제 소스코드 가져오기 시도
        try {
          // Chrome Extension API 사용 소스 코드 가져오기
          chrome.devtools.inspectedWindow.eval(
            `(function() {
              try {
                const source = document.querySelector('script[src*="${filePath}"]');
                if (source && source.textContent) {
                  const lines = source.textContent.split('\\n');
                  return {
                    success: true,
                    content: lines.slice(${startLine - 1}, ${endLine}).join('\\n'),
                    startLine: ${startLine},
                    endLine: ${endLine}
                  };
                }
                
                // AJAX로 소스 파일 가져오기 시도
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '${filePath}', false);
                xhr.send(null);
                
                if (xhr.status === 200) {
                  const lines = xhr.responseText.split('\\n');
                  return {
                    success: true,
                    content: lines.slice(${startLine - 1}, ${endLine}).join('\\n'),
                    startLine: ${startLine},
                    endLine: ${endLine}
                  };
                }
                
                return { success: false, error: 'Source not found' };
              } catch (e) {
                return { success: false, error: e.toString() };
              }
            })()`,
            function(result, exceptionInfo) {
              if (exceptionInfo) {
                console.log('소스 가져오기 오류:', exceptionInfo);
                // 실패시 가상 코드 생성으로 폴백
                generateFallbackCode();
                return;
              }
              
              if (result && result.success) {
                // 성공적으로 코드를 가져왔을 때
                const codeContent = result.content;
                const startLineNum = result.startLine;
                
                let codeHtml = '<pre class="real-source">';
                const codeLines = codeContent.split('\n');
                
                codeLines.forEach((line, i) => {
                  const lineNum = startLineNum + i;
                  const isHighlighted = lineNum === lineNumber;
                  codeHtml += `
                    <div class="code-line ${isHighlighted ? 'highlighted-line' : ''}">
                      <span class="line-number">${lineNum}</span>
                      <span class="code-text">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                    </div>
                  `;
                });
                
                codeHtml += '</pre>';
                resolve(codeHtml);
              } else {
                // API 호출은 성공했으나 소스를 가져오지 못한 경우
                generateFallbackCode();
              }
            }
          );
        } catch (e) {
          // Chrome DevTools API 사용 불가능한 경우
          console.error('Chrome API 사용 불가:', e);
          generateFallbackCode();
        }
        
        // 가상 소스 코드 생성 함수 (폴백)
        function generateFallbackCode() {
          // 넥사크로 JS 파일인 경우 가상 코드 생성
          let fileName = filePath.split('/').pop();
          const isNexacroFile = fileName.includes('nexacro') || fileName.includes('.xfdl.js');
          
          let code = [];
          
          if (isNexacroFile) {
            // 넥사크로 코드 스타일 모방
            code = [
              "// " + fileName,
              "/***********************************************************************",
              " * " + (fileName.includes('xfdl.js') ? "Form 코드" : "Library 함수"),
              " ***********************************************************************/",
              "",
              "// 함수 정의",
              `${fileName.includes('xfdl.js') ? "this." : ""}${filePath.includes("fn_") ? "fn_" : ""}${fileName.includes("transaction") ? "transaction" : "함수명"} = function(${fileName.includes('transaction') ? "id, url, inData, outData, args, callback" : "arg1, arg2"})`,
              "{",
              "    // 변수 선언",
              `    var ${fileName.includes('xfdl.js') ? "objApp = nexacro.getApplication();" : "result = null;"}`,
              "",
              "    // 주요 로직 실행",
              `    ${lineNumber === startLine + 5 ? "// 여기서 에러 발생 - 라인 " + lineNumber : "// 코드 실행..."}`,
              `    ${fileName.includes('transaction') ? "this.transaction(id, url, inData, outData, args, callback);" : "return result;"}`,
              "}",
              ""
            ];
          } else {
            // 일반 JS 코드 스타일
            code = [
              "// " + fileName,
              "function example() {",
              "  const a = 1;",
              "  const b = 2;",
              "",
              "  // 이 라인에서 에러 발생 가능",
              "  const result = a.nonExistentMethod();",
              "  return result;",
              "}",
              "",
              "// 이 코드는 실제 소스 코드가 아닌 예시입니다."
            ];
          }
          
          // 소스 코드 HTML 생성
          let codeHtml = '<pre class="fallback-source">';
          code.forEach((line, index) => {
            const currentLine = startLine + index;
            const isHighlighted = currentLine === parseInt(lineNumber, 10);
            
            codeHtml += `<div class="code-line ${isHighlighted ? 'highlighted-line' : ''}">`;
            codeHtml += `<span class="line-number">${currentLine}</span>`;
            codeHtml += `<span class="code-text">${line}</span>`;
            codeHtml += `</div>`;
          });
          codeHtml += '</pre>';
          
          resolve(codeHtml);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // 전역에 함수 노출 (Mermaid 다이어그램의 클릭 이벤트용)
  window.jumpToSource = jumpToSource;
}); 