import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'replace-with-web-api-key',
    appId: 'replace-with-web-app-id',
    messagingSenderId: 'replace-with-sender-id',
    projectId: 'replace-with-project-id',
    authDomain: 'replace-with-project-id.firebaseapp.com',
    storageBucket: 'replace-with-project-id.appspot.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'replace-with-android-api-key',
    appId: 'replace-with-android-app-id',
    messagingSenderId: 'replace-with-sender-id',
    projectId: 'replace-with-project-id',
    storageBucket: 'replace-with-project-id.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'replace-with-ios-api-key',
    appId: 'replace-with-ios-app-id',
    messagingSenderId: 'replace-with-sender-id',
    projectId: 'replace-with-project-id',
    iosBundleId: 'com.marketplacex.marketplacex',
    storageBucket: 'replace-with-project-id.appspot.com',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'replace-with-macos-api-key',
    appId: 'replace-with-macos-app-id',
    messagingSenderId: 'replace-with-sender-id',
    projectId: 'replace-with-project-id',
    iosBundleId: 'com.marketplacex.marketplacex',
    storageBucket: 'replace-with-project-id.appspot.com',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'replace-with-windows-api-key',
    appId: 'replace-with-windows-app-id',
    messagingSenderId: 'replace-with-sender-id',
    projectId: 'replace-with-project-id',
    authDomain: 'replace-with-project-id.firebaseapp.com',
    storageBucket: 'replace-with-project-id.appspot.com',
  );
}
