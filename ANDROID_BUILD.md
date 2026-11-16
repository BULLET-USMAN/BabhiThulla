# Android Build and Release Guide

This document describes how to compile, package, sign, and install the **Bhabhi Thulla** Android application for Debug testing, manual Release distribution, and Google Play Store publication.

---

## 🏗️ Architecture & Project Structure

- **Capacitor Version:** 8.6.2
- **Android Platform:** `apps/web/android/`
- **Application ID:** `com.bhabhithulla.app`
- **Minimum SDK:** API Level 24 (Android 7.0 Nougat)
- **Target / Compile SDK:** API Level 36 (Android 15+)
- **Build Variants:**
  - `debug`: Development build with WebView debugging enabled (`.debug` suffix)
  - `release`: Minified, optimized build for distribution

---

## ⚡ Quick Build Workflow

From the repository root on Windows:

```bash
# 1. Compile web assets and sync native Android project
npm run android:sync

# 2. Navigate to the native android directory
cd apps/web/android

# 3. Build the Debug APK using the Gradle wrapper
.\gradlew.bat assembleDebug
```

### Generated Artifact Location (Debug):
```text
apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📲 Installing the Debug APK on a Device

With an Android phone connected via USB (with USB Debugging enabled) or an emulator running:

```powershell
# Verify ADB detects your device
adb devices

# Install Debug APK directly
adb install -r apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

Or run directly from the Gradle wrapper:
```powershell
cd apps/web/android
.\gradlew.bat installDebug
```

---

## 🔐 Building a Signed Release APK

To distribute the APK directly to users (outside Google Play), you must generate a release keystore and sign the release build.

### Step 1: Create a Release Keystore
Run `keytool` (included with JDK):

```powershell
keytool -genkey -v -keystore bhabhi-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bhabhi-thulla
```
> [!CAUTION]
> Keep `bhabhi-release-key.jks` and your keystore passwords secure! Never commit `.jks` files or passwords to Git.

### Step 2: Set Environment Variables for Signing
In PowerShell:
```powershell
$env:KEYSTORE_PATH = "C:\path\to\bhabhi-release-key.jks"
$env:KEYSTORE_PASSWORD = "YourKeystorePassword"
$env:KEY_ALIAS = "bhabhi-thulla"
$env:KEY_PASSWORD = "YourKeyPassword"
```

### Step 3: Build Signed Release APK
```powershell
cd apps/web/android
.\gradlew.bat assembleRelease
```

### Generated Artifact Location (Release APK):
```text
apps/web/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Building an Android App Bundle (AAB for Google Play)

Google Play Store requires applications to be submitted as an Android App Bundle (`.aab`) rather than an `.apk`.

### Step 1: Build the Release App Bundle
```powershell
cd apps/web/android
.\gradlew.bat bundleRelease
```

### Generated Artifact Location (AAB):
```text
apps/web/android/app/build/outputs/bundle/release/app-release.aab
```

### Step 2: Upload to Google Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Select your application: **Bhabhi Thulla**.
3. Under **Release > Production** (or **Testing > Internal Testing**), create a new release.
4. Upload `app-release.aab`.
5. Enter release notes, review, and roll out to testers or production.

---

## 🔧 Useful Gradle Commands

All commands are executed from `apps/web/android/`:

| Command | Description |
|---|---|
| `.\gradlew.bat tasks` | List all available Gradle tasks |
| `.\gradlew.bat clean` | Clean all build caches and temporary artifacts |
| `.\gradlew.bat assembleDebug` | Build debug APK (`app-debug.apk`) |
| `.\gradlew.bat assembleRelease` | Build release APK (`app-release.apk`) |
| `.\gradlew.bat bundleRelease` | Build release Android App Bundle (`app-release.aab`) |
| `.\gradlew.bat installDebug` | Build debug APK and install onto connected device |
| `.\gradlew.bat lint` | Run Android linting and static analysis |

---

## ❓ Troubleshooting

### 1. `ERROR: JAVA_HOME is not set`
Set your `JAVA_HOME` environment variable to your JDK 17 or 21 installation path:
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot", "User")
```

### 2. `SDK location not found`
Create `apps/web/android/local.properties` with your Android SDK path (escape backslashes):
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```
*(Note: `local.properties` is gitignored automatically).*

### 3. Cleartext / Network Errors during Local Development
If connecting to a local backend (`http://10.0.2.2:3001` or `http://localhost:3001`), the app is preconfigured with `network_security_config.xml` to allow cleartext HTTP for local loopback only. For remote environments, ensure the backend URL uses `https://` and `wss://`.
