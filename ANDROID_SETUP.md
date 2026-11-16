# Android Development Environment Setup Guide (Windows)

This guide provides step-by-step instructions for configuring your Windows development environment to build, run, and test the **Bhabhi Thulla** native Android application using Capacitor and Android Studio.

---

## 🛠️ Prerequisites

To build and run native Android APKs on Windows, you need:
1. **Node.js** (v20+ or v22+) & npm (already present in the repository)
2. **Java Development Kit (JDK 17 or JDK 21)** (Required by Android Gradle Plugin)
3. **Android Studio** (Koala, Ladybug, or latest stable) or **Android SDK Command-Line Tools**
4. An **Android Emulator** or a **Physical Android Device** (with USB Debugging enabled)

---

## 📥 Step 1: Install Java Development Kit (JDK 17 or 21)

Android Gradle Plugin requires JDK 17 or JDK 21.

### Option A: Install via Winget (Recommended)
Open PowerShell as Administrator and run:
```powershell
winget install EclipseAdoptium.Temurin.17.JDK
# Or for JDK 21:
# winget install EclipseAdoptium.Temurin.21.JDK
```

### Option B: Manual Download
1. Download Eclipse Temurin JDK 17 or 21 from [adoptium.net](https://adoptium.net).
2. Run the installer and check the box to **"Set JAVA_HOME variable"** and **"Add to PATH"**.

### Verify Java Installation:
Open a new PowerShell window and run:
```powershell
java -version
javac -version
echo $env:JAVA_HOME
```
*Expected output: OpenJDK 64-Bit Server VM (build 17.0.x or 21.0.x).*

---

## 🤖 Step 2: Install Android Studio & Android SDK

1. Download **Android Studio** from [developer.android.com/studio](https://developer.android.com/studio).
2. Run the installer with default settings (ensure **Android SDK**, **Android SDK Platform**, and **Android Virtual Device** are checked).
3. Launch Android Studio and complete the Setup Wizard:
   - Select **Standard** install type.
   - Accept SDK licenses.
4. Open **SDK Manager** (from the welcome screen or *Tools > SDK Manager*):
   - Under **SDK Platforms**:
     - Check **Android 14.0 ("UpsideDownCake") - API Level 34** and **Android 15 ("VanillaIceCream") - API Level 35**
   - Under **SDK Tools**:
     - Check **Android SDK Build-Tools 34.0.0** (or 35.0.0)
     - Check **Android SDK Command-line Tools (latest)**
     - Check **Android SDK Platform-Tools**
     - Check **Google USB Driver** (for physical device testing)
   - Click **Apply** to download and install.

---

## 🌐 Step 3: Configure Environment Variables

1. Press `Win + S`, search for **"Edit the system environment variables"**, and click **Environment Variables**.
2. Under **User variables**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Under **System variables** (or User variables):
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` (or your JDK installation path)
4. Under **Path** (in User or System variables), add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `%JAVA_HOME%\bin`
5. Click **OK** to save.

### Verify Android SDK Tools:
Open a new PowerShell window and run:
```powershell
adb version
```
*Expected output: Android Debug Bridge version 1.0.41+.*

---

## 📱 Step 4: Set Up an Android Device / Emulator

### Option A: Android Virtual Device (Emulator)
1. In Android Studio, open **Virtual Device Manager** (*Tools > Device Manager*).
2. Click **Create Device**.
3. Choose **Pixel 7** or **Pixel 8** and click **Next**.
4. Download and select the **API 34** or **API 35** system image (e.g. `UpsideDownCake`).
5. Click **Finish**. Click the **Play** button to launch the emulator.

### Option B: Physical Android Device
1. On your phone, navigate to **Settings > About Phone**.
2. Tap **Build Number** 7 times to enable Developer Options.
3. Go back to **Settings > System > Developer Options**.
4. Enable **USB Debugging**.
5. Connect phone to PC via USB cable and select **"Always allow from this computer"** when prompted.
6. Verify connection in PowerShell:
   ```powershell
   adb devices
   ```

---

## 🚀 Step 5: Open and Run Bhabhi Thulla

From the project root:

```bash
# 1. Build web application and sync native Android project
npm run android:sync

# 2. Open project directly in Android Studio
npm run android:open
```

Once Android Studio opens:
1. Wait for Gradle sync to complete (indicated in the bottom status bar).
2. Select your device or running emulator from the top toolbar dropdown.
3. Click the green **Run (▶)** button to compile and launch **Bhabhi Thulla**!
