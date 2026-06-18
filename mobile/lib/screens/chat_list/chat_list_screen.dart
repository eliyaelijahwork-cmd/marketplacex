import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/chat_model.dart';
import '../../models/user_model.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat_tile.dart';
import '../chat/chat_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text('Sign in to view chats.')),
      );
    }

    final chatProvider = context.watch<ChatProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Chats')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() => _query = value.trim().toLowerCase());
                },
                decoration: const InputDecoration(
                  hintText: 'Search chats',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
            ),
            Expanded(
              child: StreamBuilder<List<ChatModel>>(
                stream: chatProvider.watchChats(currentUser.uid),
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return _StateMessage(
                      icon: Icons.error_outline,
                      title: 'Could not load chats',
                      body: '${snapshot.error}',
                    );
                  }

                  if (snapshot.connectionState == ConnectionState.waiting &&
                      !snapshot.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final chats = _filteredChats(
                    snapshot.data ?? const [],
                    currentUser.uid,
                  );

                  if (chats.isEmpty) {
                    return _StateMessage(
                      icon: Icons.chat_bubble_outline,
                      title: _query.isEmpty ? 'No chats yet' : 'No matches',
                      body: _query.isEmpty
                          ? 'Open a product and start a seller conversation.'
                          : 'Try another name or message.',
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                    itemCount: chats.length,
                    separatorBuilder: (context, index) {
                      return const SizedBox(height: 10);
                    },
                    itemBuilder: (context, index) {
                      final chat = chats[index];
                      final otherUserId = chat.otherParticipantId(
                        currentUser.uid,
                      );

                      return StreamBuilder<UserModel>(
                        stream: chatProvider.watchUser(otherUserId),
                        builder: (context, userSnapshot) {
                          return ChatTile(
                            chat: chat,
                            currentUserId: currentUser.uid,
                            user: userSnapshot.data,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ChatScreen(
                                    chatId: chat.chatId,
                                    initialChat: chat,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<ChatModel> _filteredChats(List<ChatModel> chats, String currentUserId) {
    if (_query.isEmpty) return chats;

    return chats.where((chat) {
      final name = chat.displayNameFor(currentUserId).toLowerCase();
      final lastMessage = chat.lastMessage.toLowerCase();
      final productId = chat.productId.toLowerCase();

      return name.contains(_query) ||
          lastMessage.contains(_query) ||
          productId.contains(_query);
    }).toList();
  }
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              body,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
