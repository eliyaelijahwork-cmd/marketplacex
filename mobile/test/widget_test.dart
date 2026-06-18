import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marketplacex/providers/cart_provider.dart';
import 'package:marketplacex/providers/product_provider.dart';
import 'package:marketplacex/screens/home/home_page.dart';
import 'package:marketplacex/theme/app_theme.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('home page shows product search and grid', (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ProductProvider()),
          ChangeNotifierProvider(create: (_) => CartProvider()),
        ],
        child: MaterialApp(theme: AppTheme.light, home: const HomePage()),
      ),
    );

    expect(find.text('Marketplacex'), findsWidgets);
    expect(find.byIcon(Icons.search), findsOneWidget);
    expect(find.text('Everyday Tote'), findsOneWidget);
    expect(find.byIcon(Icons.shopping_bag_outlined), findsOneWidget);
  });
}
