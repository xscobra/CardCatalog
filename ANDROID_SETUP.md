# MTG Deck Builder - Android Studio Setup

## Project Overview
This is a Magic: The Gathering deck building application built with React and packaged for Android using Capacitor.

## Features
- Card search with Scryfall API integration
- Deck management and organization
- Price tracking and alerts
- Set symbols and printings viewer
- Wishlist functionality
- Mobile-responsive design

## Android Studio Import Instructions

### Prerequisites
- Android Studio (latest version recommended)
- Android SDK API 24+ (Android 7.0)
- Java 11 or higher

### Import Steps

1. **Open Android Studio**
2. **Import Project**
   - Click "Open an Existing Project"
   - Navigate to the `android` folder in this project
   - Select the `android` folder and click "Open"

3. **Project Structure**
   ```
   android/
   ├── app/
   │   ├── src/main/
   │   │   ├── assets/public/     # Web app files
   │   │   ├── java/              # Android native code
   │   │   └── AndroidManifest.xml
   │   └── build.gradle
   ├── gradle/
   ├── build.gradle
   └── settings.gradle
   ```

4. **Sync Project**
   - Android Studio will automatically sync Gradle
   - Wait for the sync to complete

5. **Run the App**
   - Connect an Android device or start an emulator
   - Click the "Run" button (green play icon)
   - Select your target device

## Configuration Files

### capacitor.config.ts
- App ID: `com.mtgdeckbuilder.app`
- App Name: `MTG Deck Builder`
- Web Directory: `dist`

### Key Android Files
- `android/app/src/main/AndroidManifest.xml` - App permissions and configuration
- `android/app/build.gradle` - Build configuration
- `android/app/src/main/assets/public/` - Web app assets

## Development Workflow

### Making Changes to Web App
1. Modify the React code in the `client/` directory
2. Build the web app: `npm run build:client`
3. Sync changes to Android: `npx cap sync android`
4. Open in Android Studio: `npx cap open android`

### Native Android Features
The app uses Capacitor plugins for native functionality:
- File system access
- Network requests
- Device information

## Troubleshooting

### Build Issues
- Ensure Android SDK is properly installed
- Check that Java 11+ is configured
- Clean and rebuild: Build → Clean Project → Rebuild Project

### Runtime Issues
- Check device logs in Android Studio Logcat
- Verify network permissions for API calls
- Ensure device has internet connectivity

## App Permissions
The app requires these permissions (configured in AndroidManifest.xml):
- Internet access for card data and images
- Network state access for connectivity checks

## API Configuration
The app connects to:
- Scryfall API for card data
- Your backend server for deck storage (requires configuration)

For production deployment, update the server URLs in the web app configuration.

## Building Release APK
1. In Android Studio: Build → Generate Signed Bundle/APK
2. Choose APK
3. Create or select a keystore
4. Configure signing and build variants
5. Generate APK for distribution

## Support
For issues with:
- Web app functionality: Check React components in `client/src/`
- Android-specific issues: Check Android project in `android/`
- API integration: Verify network connectivity and API endpoints