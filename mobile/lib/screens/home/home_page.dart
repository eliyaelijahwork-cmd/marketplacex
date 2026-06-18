import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/chat_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/product_provider.dart';
import '../../services/auth_service.dart';
import '../../widgets/product_card.dart';
import '../auth/login_page.dart';
import '../cart/cart_page.dart';
import '../chat_list/chat_list_screen.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final products = context.watch<ProductProvider>().products;
    final cartCount = context.watch<CartProvider>().itemCount;
    final currentUser = _currentUserOrNull();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplacex'),
        actions: [
          if (currentUser != null)
            StreamBuilder<List<ChatModel>>(
              stream: context.read<ChatProvider>().watchChats(currentUser.uid),
              builder: (context, snapshot) {
                final unreadCount = (snapshot.data ?? const <ChatModel>[])
                    .fold<int>(
                      0,
                      (total, chat) =>
                          total + chat.unreadCountFor(currentUser.uid),
                    );

                return IconButton(
                  tooltip: 'Chats',
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ChatListScreen()),
                    );
                  },
                  icon: Badge(
                    isLabelVisible: unreadCount > 0,
                    label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                    child: const Icon(Icons.chat_bubble_outline),
                  ),
                );
              },
            ),
          IconButton(
            tooltip: 'Cart',
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const CartPage()));
            },
            icon: Badge(
              isLabelVisible: cartCount > 0,
              label: Text('$cartCount'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const ListTile(
                title: Text('Marketplacex'),
                subtitle: Text('Modern marketplace'),
              ),
              if (currentUser != null)
                ListTile(
                  leading: const Icon(Icons.chat_bubble_outline),
                  title: const Text('Chats'),
                  onTap: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ChatListScreen()),
                    );
                  },
                ),
              if (currentUser == null)
                ListTile(
                  leading: const Icon(Icons.login),
                  title: const Text('Sign in'),
                  onTap: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginPage()),
                    );
                  },
                )
              else
                ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Sign out'),
                  onTap: () async {
                    await context.read<ChatProvider>().clearActiveUser();
                    await AuthService().signOut();
                  },
                ),
            ],
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: TextField(
                onChanged: context.read<ProductProvider>().updateQuery,
                decoration: const InputDecoration(
                  hintText: 'Search products, brands, categories',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverGrid.builder(
              itemCount: products.length,
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 260,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.6,
              ),
              itemBuilder: (context, index) {
                return ProductCard(product: products[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  User? _currentUserOrNull() {
    try {
      return FirebaseAuth.instance.currentUser;
    } catch (_) {
      return null;
    }
  }
}
