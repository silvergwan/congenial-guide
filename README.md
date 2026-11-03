# 제주 여행 안부 확인 · 개인 PO 프로젝트

제주 혼행객의 안전 관련 걱정과 숙소 운영자의 대응 경험을 조사하고, **여행객이 선택한 시각에 안부를 확인하는 서비스**의 필요성을 검증하는 프로젝트입니다.

바카티오의 Vacatio Solution PMS(바카티오 솔루션, 구 파인호스트/FineHost) 맥락에서 선택형 안부 확인 기능을 제안하고, 문제 정의와 기획을 연습하는 개인 프로젝트입니다. 해당 기업 소속·공식 조사·제휴 서비스가 아닙니다.

## 현재 상태

- 문제 정의·프로토타입 요구사항: v0.1, 검증 전 초안
- 호스트 조사: 2026-11-03 20곳 개별 발송 확인, 당시 반송 1건 확인
- 그 외 19건: 실제 수신 여부 미확인. 최신 회신 여부는 별도 확인 필요
- 프로토타입: TDS 구성 패턴과 Pretendard를 적용한 여행객·호스트·컴포넌트 화면 구현. 가상 데이터만 사용
- 이메일 도구: 메일 준비·검증·발송 상태 기록만 구현. Gmail 자동 발송·회신 수집·주기적 모니터링은 미구현

사건 증가, 혼행 감소, 독채 선호 감소, 안부 확인 기능의 효과는 **확인된 사실이 아닌 조사 가설**입니다.

## 문서

| 문서 | 용도 |
|---|---|
| [제품 맥락과 기능 제안](docs/product-context-v0.1.md) | 현재 서비스명, 공식 제품 구조, 안부 기능의 연결 지점 |
| [문제 정의서 v0.1](docs/problem-definition-v0.1.md) | 가설, 대상 사용자, 문제, 반증 조건 |
| [조사 계획 v0.1](docs/research-plan-v0.1.md) | 호스트·여행객 조사와 표본 선정 |
| [프로토타입 요구사항 v0.1](docs/prototype-requirements-v0.1.md) | 화면, 상태 전환, 예외, 완료 기준 |
| [조사 진행 현황](docs/research-status.md) | 확인된 발송 결과와 미확인 사항 |
| [2차 후보 검토](docs/candidate-review.md) | 숙소별 근거·공식 채널·우선순위 |
| [회신 분석 기준](docs/reply-coding-guide.md) | 직접 경험·기록·추정의 구분 |
| [결정 기록](docs/decision-log.md) | 선택 이유와 재검토 조건 |

## 이메일·인터뷰 양식

- [호스트 이메일 v0.1](templates/host-email-v0.1.txt): 1차 발송에 사용한 원본 양식. 기록 보존용
- [호스트 사전 질문 v0.2](templates/host-email-v0.2.md): 짧은 2차 조사 초안. 아직 미발송
- [호텔 비교 질문](templates/hotel-email-v0.1.md): 독채 질문과 구분한 비교용 초안
- [여행객 인터뷰](templates/traveler-interview-v0.1.md): 최근 경험과 프로토타입 사용 반응
- [응답 기록 틀](templates/response-record.example.json): 가상 데이터만 포함

메일의 이름·주소·기간·조사번호를 치환한 뒤 사용합니다. `기준 2명`이나 `성인 1명` 검색 노출만으로 1인 투숙 경험을 추정하지 않습니다.

## 웹 프로토타입

저장소 루트에서 `npm run dev`를 실행한 뒤 http://127.0.0.1:4173 을 엽니다. 여행객·호스트·컴포넌트 탭에서 신청, 미응답, 연락 시도와 늦은 응답을 시연할 수 있습니다. 새로고침 시 가상 데이터가 초기화됩니다.

[프로토타입 안내](prototype/README.md) · [디자인 시스템 v0.1](docs/design-system-v0.1.md)

## 메일 준비 도구

Node.js 22 이상에서 추가 패키지 설치 없이 사용할 수 있습니다.

```powershell
npm test
Copy-Item tools/mail-prep/campaign.example.json tools/mail-prep/campaign.json
Copy-Item tools/mail-prep/prospects.example.json tools/mail-prep/prospects.json
npm run mail:prepare
npm run mail:status
```

예시 주소는 `.invalid` 도메인의 가상 주소이며 실제 발송 대상이 아닙니다. `mail:prepare`는 파일만 만들고 메일을 보내지 않습니다. 자세한 범위는 [도구 안내](tools/mail-prep/README.md)에 있습니다.

## 데이터 보관

공개 저장소에는 양식, 조사 방법, 집계 결과, 공개 출처만 보관합니다. 실제 수신자 명단, 발송 증빙, 회신 원문, Gmail 화면, 계정 설정은 Git에서 제외합니다. 로컬의 `.private/first-wave/`에는 기존 1차 조사 자료의 복사본을 보관하며 원본 저장소의 파일은 유지합니다.

숙소명·개인이 식별되는 응답과 직접 인용문은 공개 문서에 추가하지 않습니다. 회신을 공개할 때는 식별 가능성을 검토하고 집계·비식별 요약을 사용합니다.
