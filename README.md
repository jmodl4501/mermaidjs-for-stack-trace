# 스택 트레이스 시각화 도구 (Chrome DevTools Extension)

Chrome 개발자 도구(DevTools)에서 스택 트레이스를 시각적으로 표현하고 관련 소스 코드를 쉽게 탐색할 수 있는 확장 프로그램입니다.

## 기능

1. 크롬 개발자 도구의 새로운 '스택 시각화' 패널 제공
2. 두 가지 모드 지원:
   - 직접 입력: 복사한 스택 트레이스를 붙여넣고 시각화
   - 자동 캡처: 콘솔에서 발생하는 에러를 자동으로 캡처하여 시각화
3. MermaidJS를 사용한 호출 스택 다이어그램 생성
4. 다이어그램에서 노드 클릭 시 소스 코드로 바로 이동
5. 스택 트레이스에 포함된 각 함수의 소스 코드 표시

## 설치 방법

### 개발 모드로 설치

1. 이 저장소를 클론 또는 다운로드합니다.
2. Chrome 브라우저에서 `chrome://extensions/` 페이지로 이동합니다.
3. 오른쪽 상단의 '개발자 모드'를 활성화합니다.
4. '압축해제된 확장 프로그램을 로드합니다.' 버튼을 클릭합니다.
5. 이 프로젝트의 디렉토리를 선택합니다.

## 사용 방법

1. 크롬 개발자 도구를 엽니다 (F12 또는 Ctrl+Shift+I)
2. 상단 탭에서 '스택 시각화' 탭을 클릭합니다.
3. 직접 입력 모드:
   - 스택 트레이스를 텍스트 영역에 붙여넣고 '변환' 버튼을 클릭합니다.
4. 자동 캡처 모드:
   - '콘솔 에러 감지 시작' 버튼을 클릭하고 웹 페이지에서 에러가 발생하면 자동으로 캡처됩니다.
   - 캡처된 에러를 클릭하면 해당 스택 트레이스가 시각화됩니다.

## 개발 참고사항

이 확장 프로그램을 개발하려면 다음 파일을 실제로 구현해야 합니다:

1. `lib/mermaid.min.js` - 실제 MermaidJS 라이브러리 (CDN에서 다운로드)
2. `icons/*.png` - 실제 아이콘 이미지 파일

## 기술 스택

- HTML/CSS/JavaScript
- Chrome DevTools Extension API
- MermaidJS: 다이어그램 생성

## 라이선스

APACHE2.0
