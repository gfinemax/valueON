# Android 앱 배포 및 개발 가이드 (APK Build & Live Reload)

이 가이드는 ValueOn Next.js 웹 애플리케이션을 빌드하고 Capacitor와 Android Studio를 사용하여 Android APK로 패키징하는 과정을 상세히 설명합니다.

## 사전 준비 사항

- **Node.js** & **pnpm** 설치 완료
- **Android Studio** 설치 완료 (Android SDK 포함)
- 프로젝트 의존성 설치 완료 (`pnpm install`)

## 1. 웹 애플리케이션 빌드

먼저 Next.js 애플리케이션을 빌드하여 정적 파일을 생성해야 합니다.

```bash
# 프로젝트 루트 디렉토리에서 실행
pnpm run build
```
이 명령어를 실행하면 정적 웹 자산이 포함된 `out` 디렉토리가 생성됩니다.

## 2. Android 프로젝트 동기화

빌드된 웹 자산을 Android 프로젝트로 복사하고 Capacitor 설정을 업데이트합니다.

```bash
# `out` 디렉토리를 `android/app/src/main/assets/public`으로 동기화
npx cap sync
```

> **참고:** React/Next.js 코드를 수정할 때마다 안드로이드 앱에 반영하려면 반드시 **1단계**와 **2단계**를 다시 실행해야 합니다.

## 3. Android Studio에서 APK 빌드

1. **Android Studio 열기**:
   ```bash
   npx cap open android
   ```
   또는 `android` 폴더를 Android Studio에서 직접 엽니다.

2. **Gradle 동기화**:
   - 상단 툴바의 **Sync Project with Gradle Files** 아이콘(코끼리 모양)을 클릭합니다.
   - 동기화가 완료될 때까지 기다립니다.

3. **APK 생성**:
   - 상단 메뉴에서 **Build** > **Generate App Bundles or APKs** > **Generate APKs**를 선택합니다.
   - *팁: "Generate Signed Bundle / APK"와 혼동하지 마세요. 테스트용으로는 "Generate APKs"가 충분하고 더 빠릅니다.*

4. **APK 위치 확인**:
   - 빌드가 완료되면 우측 하단에 알림이 뜹니다.
   - **locate** 링크를 클릭하세요.
   - `app-debug.apk` 파일이 설치 파일입니다.

## 4. 개발 효율 높이기 (Live Reload)

개발 중 매번 APK를 빌드하고 설치하는 과정은 매우 번거롭습니다. **Live Reload** 기능을 사용하면, PC에서 코드를 수정하고 저장하는 즉시 폰 화면이 자동으로 새로고침되어 매우 효율적입니다.

### 사전 준비 (최초 1회)
1. **개발자 옵션 활성화**: 폰 설정 > 휴대전화 정보 > 소프트웨어 정보 > `빌드 번호`를 7번 연타하여 개발자 모드를 켭니다.
2. **USB 디버깅 켜기**: 설정 > 개발자 옵션 > `USB 디버깅`을 활성화합니다.
3. **PC 연결**: USB 케이블로 폰과 PC를 연결하고, 폰 화면에 뜨는 '이 컴퓨터 허용' 팝업을 승인합니다.

### 실행 방법
원활한 개발을 위해 **터미널을 2개** 사용하는 것을 권장합니다.
- **터미널 1**: `pnpm run dev` (Next.js 로컬 서버 실행 유지)
- **터미널 2**: Capacitor 명령어 실행 (아래 참조)

1. **명령어 입력 (터미널 2)**:
   ```bash
   npx cap run android --livereload --external
   ```
2. **네트워크 인터페이스 선택**:
   명령어 실행 후 다음과 같이 네트워크 목록이 뜰 수 있습니다:
   ```text
   ? Which network interface would you like to use?
   1) Ethernet (192.168.0.5)
   2) Wi-Fi (192.168.0.10)
   ```
   - PC와 폰이 **동일한 와이파이**에 연결되어 있다면 `Wi-Fi` IP를 선택하세요.
   - 폰이 LTE/5G 상태라면 연결되지 않을 수 있습니다. (PC와 폰이 같은 공유기 망에 있어야 함)

3. **앱 자동 실행**:
   잠시 기다리면 폰에서 앱이 자동으로 실행됩니다. 이제 PC에서 코드를 수정하고 저장(Ctrl+S)해보세요. 폰 화면이 즉시 바뀝니다!

### 화면 미러링 (Mirroring)
폰 화면을 PC에서 보고 조작하려면 다음 도구를 추천합니다.

**1. Android Studio (기본 기능)**
- **Running Devices** 패널을 엽니다 (보통 우측 하단).
- 기기가 연결되어 있다면 화면이 자동으로 나타납니다. 마우스로 터치 조작도 가능합니다.

**2. scrcpy (추천)**
- 가볍고 빠르며 화질이 좋은 오픈소스 미러링 도구입니다.
- **설치**: [scrcpy 릴리즈 페이지](https://github.com/Genymobile/scrcpy/releases)에서 Windows용 zip 다운로드
- **실행**: 압축 해제 후 `scrcpy.exe` 실행 (USB 연결 상태여야 함)

### ⚠️ 주의사항
- 이 모드는 **개발용**입니다. 앱을 종료하고 케이블을 뽑으면 앱이 켜지지 않거나 흰 화면이 나올 수 있습니다.
- 케이블을 뽑고 단독으로 실행하려면 다시 **3. Android Studio에서 APK 빌드** 과정을 통해 정식 APK를 설치해야 합니다.

## 5. 문제 해결 (Troubleshooting)

### 빌드 오류: `proguard-android.txt`
`proguard-android.txt` 파일을 찾을 수 없다는 오류가 발생하는 경우:
- 이는 `build.gradle` (주로 플러그인 내부)에서 더 이상 사용되지 않는 파일을 참조하기 때문입니다.
- **해결 방법:** `proguardFiles getDefaultProguardFile('proguard-android.txt')` 부분을 `proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')`로 수정하세요.

### 포트 충돌 (3000번 포트 사용 중)
`pnpm run dev` 실행 시 3000번 포트가 이미 사용 중이라 실패하는 경우:
- **해결 방법:** 해당 포트를 사용 중인 프로세스를 종료하세요.
  ```bash
  # Windows PowerShell
  taskkill /PID <PID> /F
  ```
  (오류 메시지에 있는 PID 번호를 확인하여 입력하세요. 예: "Port 3000 is in use by process 12345")

### 폰에서 앱이 업데이트되지 않나요?
- APK 설치 방식은 자동 업데이트를 지원하지 않습니다.
- 변경 사항을 보려면 반드시 APK를 다시 빌드(1~3단계)하고 재설치해야 합니다.
