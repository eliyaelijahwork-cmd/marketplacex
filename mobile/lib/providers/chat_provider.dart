import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../models/product.dart';
import '../models/user_model.dart';
import '../repositories/chat_repository.dart';
import '../services/notification_service.dart';

class ChatProvider extends ChangeNotifier with WidgetsBindingObserver {
  ChatProvider({
    required ChatRepository repository,
    required NotificationService notificationService,
    required void Function(String chatId) onNotificationChatTap,
  }) : _repository = repository,
       _notificationService = notificationService,
       _onNotificationChatTap = onNotificationChatTap;

  final ChatRepository _repository;
  final NotificationService _notificationService;
  final void Function(String chatId) _onNotificationChatTap;

  String? _activeUserId;
  bool _isInitialized = false;
  bool _isSending = false;
  bool _isUploadingImage = false;
  String? _errorMessage;

  bool get isSending => _isSending;
  bool get isUploadingImage => _isUploadingImage;
  String? get errorMessage => _errorMessage;

  Future<void> initializeForUser(User user) async {
    if (_activeUserId == user.uid && _isInitialized) return;

    _activeUserId = user.uid;
    if (!_isInitialized) {
      WidgetsBinding.instance.addObserver(this);
    }

    await _safeRun(() async {
      await _repository.updateOnlineStatus(userId: user.uid, isOnline: true);
      await _notificationService.initialize(onChatTap: _onNotificationChatTap);

      final token = await _notificationService.getToken();
      if (token != null && token.isNotEmpty) {
        await _repository.saveFcmToken(userId: user.uid, token: token);
      }
    });

    _isInitialized = true;
  }

  Future<void> clearActiveUser() async {
    final userId = _activeUserId;
    _activeUserId = null;
    _isInitialized = false;
    WidgetsBinding.instance.removeObserver(this);

    if (userId == null) return;
    await _safeRun(() {
      return _repository.updateOnlineStatus(userId: userId, isOnline: false);
    });
  }

  Stream<List<ChatModel>> watchChats(String userId) {
    return _repository.watchChats(userId);
  }

  Stream<ChatModel?> watchChat(String chatId) {
    return _repository.watchChat(chatId);
  }

  Stream<List<MessageModel>> watchMessages(String chatId) {
    return _repository.watchMessages(chatId);
  }

  Stream<UserModel> watchUser(String userId) {
    return _repository.watchUser(userId);
  }

  Future<ChatModel?> startChatForProduct({
    required User buyer,
    required Product product,
  }) async {
    ChatModel? chat;
    await _safeRun(() async {
      chat = await _repository.createChat(
        buyerId: buyer.uid,
        sellerId: product.sellerId,
        productId: product.id,
        buyerName: buyer.displayName?.trim().isNotEmpty == true
            ? buyer.displayName!.trim()
            : 'Buyer',
        sellerName: product.sellerName,
        buyerImage: buyer.photoURL ?? '',
        sellerImage: product.sellerProfileImage,
      );
    });
    return chat;
  }

  Future<void> sendTextMessage({
    required String chatId,
    required String senderId,
    required String message,
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) return;

    _isSending = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repository.sendTextMessage(
        chatId: chatId,
        senderId: senderId,
        message: trimmed,
      );
    } catch (error) {
      _errorMessage = error.toString();
      rethrow;
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  Future<void> sendImageMessage({
    required String chatId,
    required String senderId,
    required XFile image,
  }) async {
    _isUploadingImage = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repository.sendImageMessage(
        chatId: chatId,
        senderId: senderId,
        image: image,
      );
    } catch (error) {
      _errorMessage = error.toString();
      rethrow;
    } finally {
      _isUploadingImage = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead({required String chatId, required String userId}) {
    return _safeRun(() {
      return _repository.markAsRead(chatId: chatId, userId: userId);
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final userId = _activeUserId;
    if (userId == null) return;

    if (state == AppLifecycleState.resumed) {
      _repository.updateOnlineStatus(userId: userId, isOnline: true);
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _repository.updateOnlineStatus(userId: userId, isOnline: false);
    }
  }

  Future<void> _safeRun(Future<void> Function() task) async {
    try {
      await task();
    } catch (error) {
      _errorMessage = error.toString();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    final userId = _activeUserId;
    if (userId != null) {
      _repository.updateOnlineStatus(userId: userId, isOnline: false);
    }
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
