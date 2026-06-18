import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/constants/chat_constants.dart';
import '../../core/utils/chat_time_formatter.dart';
import '../../models/chat_model.dart';
import '../../models/message_model.dart';
import '../../models/user_model.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/message_bubble.dart';
import '../../widgets/online_indicator.dart';
import '../../widgets/quick_reply_chip.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.chatId, this.initialChat});

  final String chatId;
  final ChatModel? initialChat;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _imagePicker = ImagePicker();
  int _lastMessageCount = 0;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      return const Scaffold(body: Center(child: Text('Sign in to chat.')));
    }

    final chatProvider = context.watch<ChatProvider>();

    return StreamBuilder<ChatModel?>(
      stream: chatProvider.watchChat(widget.chatId),
      initialData: widget.initialChat,
      builder: (context, chatSnapshot) {
        final chat = chatSnapshot.data;

        if (chatSnapshot.hasError) {
          return Scaffold(
            appBar: AppBar(),
            body: Center(child: Text('Chat failed: ${chatSnapshot.error}')),
          );
        }

        if (chat == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final otherUserId = chat.otherParticipantId(currentUser.uid);

        return Scaffold(
          resizeToAvoidBottomInset: true,
          appBar: _buildAppBar(
            context: context,
            chatProvider: chatProvider,
            chat: chat,
            currentUserId: currentUser.uid,
            otherUserId: otherUserId,
          ),
          body: SafeArea(
            top: false,
            child: Column(
              children: [
                Expanded(
                  child: StreamBuilder<List<MessageModel>>(
                    stream: chatProvider.watchMessages(chat.chatId),
                    builder: (context, messageSnapshot) {
                      if (messageSnapshot.hasError) {
                        return Center(
                          child: Text(
                            'Messages failed: ${messageSnapshot.error}',
                          ),
                        );
                      }

                      if (messageSnapshot.connectionState ==
                              ConnectionState.waiting &&
                          !messageSnapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final messages = messageSnapshot.data ?? const [];
                      _afterMessagesRendered(
                        chatId: chat.chatId,
                        userId: currentUser.uid,
                        messages: messages,
                      );

                      if (messages.isEmpty) {
                        return _EmptyThread(
                          name: chat.displayNameFor(currentUser.uid),
                        );
                      }

                      return ListView.separated(
                        controller: _scrollController,
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.onDrag,
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                        itemCount: messages.length,
                        separatorBuilder: (context, index) {
                          return const SizedBox(height: 8);
                        },
                        itemBuilder: (context, index) {
                          final message = messages[index];
                          return MessageBubble(
                            message: message,
                            isMine: message.senderId == currentUser.uid,
                          );
                        },
                      );
                    },
                  ),
                ),
                _MessageComposer(
                  controller: _messageController,
                  isSending: chatProvider.isSending,
                  isUploadingImage: chatProvider.isUploadingImage,
                  onAttachImage: () => _pickImage(chat.chatId, currentUser.uid),
                  onSend: () => _sendText(chat.chatId, currentUser.uid),
                  onQuickReply: (reply) {
                    _messageController.text = reply;
                    _sendText(chat.chatId, currentUser.uid);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  AppBar _buildAppBar({
    required BuildContext context,
    required ChatProvider chatProvider,
    required ChatModel chat,
    required String currentUserId,
    required String otherUserId,
  }) {
    return AppBar(
      leading: IconButton(
        tooltip: 'Back',
        icon: const Icon(Icons.arrow_back),
        onPressed: () => Navigator.of(context).pop(),
      ),
      titleSpacing: 0,
      title: StreamBuilder<UserModel>(
        stream: chatProvider.watchUser(otherUserId),
        builder: (context, userSnapshot) {
          final user = userSnapshot.data;
          final fallbackName = chat.displayNameFor(currentUserId);
          final name = user?.name.trim().isNotEmpty == true
              ? user!.name.trim()
              : fallbackName;
          final image = user?.profileImage.trim().isNotEmpty == true
              ? user!.profileImage.trim()
              : chat.displayImageFor(currentUserId);
          final isOnline = user?.isOnline ?? false;

          return Row(
            children: [
              _ChatAvatar(imageUrl: image, name: name),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    if (isOnline)
                      const OnlineIndicator(isOnline: true, showLabel: true)
                    else
                      Text(
                        formatLastSeen(user?.lastSeen),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                            ),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      actions: [
        StreamBuilder<UserModel>(
          stream: chatProvider.watchUser(otherUserId),
          builder: (context, snapshot) {
            return IconButton(
              tooltip: 'Call',
              icon: const Icon(Icons.call_outlined),
              onPressed: () {
                final phone = snapshot.data?.phone.trim() ?? '';
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      phone.isEmpty ? 'No phone number available.' : phone,
                    ),
                  ),
                );
              },
            );
          },
        ),
        const SizedBox(width: 6),
      ],
    );
  }

  void _afterMessagesRendered({
    required String chatId,
    required String userId,
    required List<MessageModel> messages,
  }) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      if (_lastMessageCount != messages.length) {
        _lastMessageCount = messages.length;
        _scrollToBottom();
      }

      context.read<ChatProvider>().markAsRead(chatId: chatId, userId: userId);
    });
  }

  Future<void> _sendText(String chatId, String senderId) async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    final chatProvider = context.read<ChatProvider>();
    _messageController.clear();
    try {
      await chatProvider.sendTextMessage(
        chatId: chatId,
        senderId: senderId,
        message: message,
      );
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;
      _messageController.text = message;
      _showError(error);
    }
  }

  Future<void> _pickImage(String chatId, String senderId) async {
    final chatProvider = context.read<ChatProvider>();

    try {
      final image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 82,
        maxWidth: 1600,
      );
      if (image == null) return;

      await chatProvider.sendImageMessage(
        chatId: chatId,
        senderId: senderId,
        image: image,
      );
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;
      _showError(error);
    }
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;

    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOut,
    );
  }

  void _showError(Object error) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Chat error: $error')));
  }
}

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({
    required this.controller,
    required this.isSending,
    required this.isUploadingImage,
    required this.onAttachImage,
    required this.onSend,
    required this.onQuickReply,
  });

  final TextEditingController controller;
  final bool isSending;
  final bool isUploadingImage;
  final VoidCallback onAttachImage;
  final VoidCallback onSend;
  final ValueChanged<String> onQuickReply;

  @override
  Widget build(BuildContext context) {
    final disabled = isSending || isUploadingImage;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ChatConstants.quickReplies.map((reply) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: QuickReplyChip(
                        label: reply,
                        onSelected: (value) {
                          if (!disabled) onQuickReply(value);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton.filledTonal(
                    tooltip: 'Attach image',
                    onPressed: disabled ? null : onAttachImage,
                    icon: isUploadingImage
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.image_outlined),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      enabled: !disabled,
                      minLines: 1,
                      maxLines: 5,
                      maxLength: ChatConstants.maxMessageLength,
                      buildCounter:
                          (
                            context, {
                            required currentLength,
                            required isFocused,
                            maxLength,
                          }) {
                            return null;
                          },
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        hintText: 'Write a message',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: 'Send',
                    onPressed: disabled ? null : onSend,
                    icon: isSending
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_outlined),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatAvatar extends StatelessWidget {
  const _ChatAvatar({required this.imageUrl, required this.name});

  final String imageUrl;
  final String name;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isEmpty
        ? 'U'
        : name
              .trim()
              .split(RegExp(r'\s+'))
              .take(2)
              .map((part) => part[0].toUpperCase())
              .join();

    if (imageUrl.isEmpty) {
      return CircleAvatar(radius: 20, child: Text(initials));
    }

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        placeholder: (context, url) {
          return CircleAvatar(radius: 20, child: Text(initials));
        },
        errorWidget: (context, url, error) {
          return CircleAvatar(radius: 20, child: Text(initials));
        },
      ),
    );
  }
}

class _EmptyThread extends StatelessWidget {
  const _EmptyThread({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.forum_outlined,
              size: 44,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 12),
            Text(
              'Start chatting with $name',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              'Ask a question, request photos, or make an offer.',
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
