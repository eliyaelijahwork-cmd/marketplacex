import 'package:flutter/material.dart';

import '../core/navigation/app_navigator.dart';
import '../screens/home/home_page.dart';
import '../theme/app_theme.dart';

class MarketplacexApp extends StatelessWidget {
  const MarketplacexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Marketplacex',
      navigatorKey: appNavigatorKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: const HomePage(),
    );
  }
}
