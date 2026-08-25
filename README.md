## 技术栈

- React Native CLI 0.84.1
- React 19.2.3
- TypeScript 5.9 严格模式
- React Navigation 7
- axios
- zustand
- design-system-native
- ESLint v9 Flat Config
- Prettier 3
- husky + lint-staged
- commitlint + Conventional Commits
- GitHub Actions

## 环境要求

### 通用

- Node.js `22.11.0+`
- npm `10+`
- Watchman（推荐，macOS）

### Android

- JDK `17+`
- Android Studio 最新稳定版
- Android SDK / Build Tools / Platform Tools
- 至少一个可用的 Android 模拟器或真机

### iOS

- macOS
- Xcode 最新稳定版
- CocoaPods

## 安装依赖

```bash
npm install
```

首次克隆后安装 iOS 原生依赖：

```bash
cd ios
SSL_CERT_FILE=/private/etc/ssl/cert.pem \
SSL_CERT_DIR=/private/etc/ssl/certs \
pod install
cd ..
```

如果你使用 Homebrew 安装的 CocoaPods，且遇到 HTTPS / 证书报错，优先使用上面的系统证书写法。

如果本机没有 `pod`，可以先安装：

```bash
brew install cocoapods
```

## 启动项目

### 启动 Metro

```bash
npm start
```

### 启动 iOS

```bash
npm run ios
```

### 启动 Android

```bash
npm run android
```

如果 Android 构建提示找不到 Java，先确保 `JAVA_HOME` 指向 Android Studio 自带 JBR 或本机 JDK，例如：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

如果 Android 模拟器出现 `:app:installDebug` 长时间卡住，通常不是项目代码问题，而是 AVD 快照导致安装服务异常。可以先关闭模拟器并用不加载快照的方式重新启动：

```bash
adb emu kill
emulator -avd Medium_Phone -no-snapshot-load
```

模拟器重新进入系统后，再安装并启动应用：

```bash
adb uninstall com.apexapp || true
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.apexapp/.MainActivity
```

## Android 打包

### Debug APK

```bash
cd android
./gradlew assembleDebug
```

产物路径：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK

```bash
cd android
./gradlew assembleRelease
```

产物路径：

```text
android/app/build/outputs/apk/release/app-release.apk
```

### Release 签名

- 当前仓库直接跟踪 `android/keystore.properties` 和 `android/app/supplier-app-release.jks`
- `android/keystore.properties` 只保存 `storeFile` 和 `keyAlias`
- `storePassword`、`keyPassword` 不进仓库，改为从 `android/keystore.local.properties` 或环境变量读取
- 默认 `storeFile` 指向 `android/app/supplier-app-release.jks`，`keyAlias` 为 `supplier-app`
- 本地打 release 包前，先把 PMS 里的密码填到 `android/keystore.local.properties`
- 如果后续要更换签名，需要同时更新 `android/keystore.properties`、`android/app/supplier-app-release.jks` 和 PMS 里的密码记录

## 常用脚本

```bash
npm run lint
npm run lint:fix
npm run format
npm run typecheck
```

- `npm install`
- `npm run start -- --reset-cache`
- `npm run ios -- --no-packager`
- `npm run android -- --no-packager`
- `npm run typecheck`
- `npm run lint`

## 目录结构

```text
.
├── .github/workflows/production.yml
├── .github/workflows/pr-review.yml
├── android
├── ios
├── src
│   ├── app
│   ├── assets
│   ├── components
│   ├── config
│   ├── constants
│   ├── hooks
│   ├── navigation
│   ├── screens
│   ├── services
│   ├── store
│   ├── types
│   └── utils
├── App.tsx
├── babel.config.js
├── eslint.config.mjs
├── metro.config.js
└── tsconfig.json
```

目录职责：

- `src/app`: 应用入口、providers、应用级装配
- `src/assets`: 静态资源占位目录
- `src/components`: 业务层组合组件
- `src/config`: 环境变量与应用配置
- `src/constants`: 路由名、超时、业务常量
- `src/hooks`: 应用通用 hooks
- `src/navigation`: 导航结构与类型
- `src/pages`: 路由级页面容器
- `src/sections`: 页面内容分区与业务块
- `src/services`: axios 实例、拦截器、API service
- `src/store`: zustand 状态
- `src/types`: 通用类型声明
- `src/utils`: logger、错误处理等工具

## 原生注意事项

- iOS 依赖变更后记得重新执行 `pod install`
- iOS 请使用 [`apex-app.xcworkspace`](./ios/apex-app.xcworkspace) 而不是 `.xcodeproj`
- 如果 Homebrew 版 CocoaPods 报 `certificate verify failed`，请带上：
  `SSL_CERT_FILE=/private/etc/ssl/cert.pem SSL_CERT_DIR=/private/etc/ssl/certs`
- Android 首次启动前请确认本地 `ANDROID_HOME` / SDK 已完成配置
- Android 若未自动识别 Java，请显式设置 `JAVA_HOME`
- Android / iOS 的包名已统一为 `com.apexapp`
- `react-native 0.84.1` 需要与 `react 19.2.3` 精确对齐
