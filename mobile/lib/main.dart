import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app/marketplacex_app.dart';
import 'core/navigation/app_navigator.dart';
import 'firebase_options.dart';
import 'providers/cart_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/product_provider.dart';
import 'repositories/chat_repository.dart';
import 'screens/chat/chat_screen.dart';
import 'services/notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(
          create: (_) => ChatProvider(
            repository: ChatRepository(),
            notificationService: NotificationService(),
            onNotificationChatTap: (chatId) {
              final navigator = appNavigatorKey.currentState;
              if (navigator == null) return;

              navigator.push(
                MaterialPageRoute(builder: (_) => ChatScreen(chatId: chatId)),
              );
            },
          ),
        ),
      ],
      child: const MarketplacexApp(),
    ),
  );
}
