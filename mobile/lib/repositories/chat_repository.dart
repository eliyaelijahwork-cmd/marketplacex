import 'package:image_picker/image_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../core/constants/chat_constants.dart';
import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';
import '../services/firestore_service.dart';

class ChatRepository {
  ChatRepository({FirestoreService? firestoreService})
    : _firestoreService = firestoreService ?? FirestoreService();

  final FirestoreService _firestoreService;

  Stream<List<ChatModel>> watchChats(String userId) {
    return _firestoreService.getChats(userId);
  }

  Stream<ChatModel?> watchChat(String chatId) {
    return _firestoreService.getChat(chatId);
  }

  Stream<List<MessageModel>> watchMessages(String chatId) {
    return _firestoreService.getMessages(chatId);
  }

  Stream<UserModel> watchUser(String userId) {
    return _firestoreService.getUser(userId);
  }

  Future<List<MessageModel>> loadOlderMessages({
    required String chatId,
    required DateTime before,
  }) {
    return _firestoreService.getOlderMessages(
      chatId,
      before: Timestamp.fromDate(before),
    );
  }

  Future<ChatModel> createChat({
    required String buyerId,
    required String sellerId,
    required String productId,
    required String buyerName,
    required String sellerName,
    String buyerImage = '',
    String sellerImage = '',
  }) {
    return _firestoreService.createChat(
      buyerId: buyerId,
      sellerId: sellerId,
      productId: productId,
      buyerName: buyerName,
      sellerName: sellerName,
      buyerImage: buyerImage,
      sellerImage: sellerImage,
    );
  }

  Future<void> sendTextMessage({
    required String chatId,
    required String senderId,
    required String message,
  }) {
    return _firestoreService.sendMessage(
      chatId: chatId,
      senderId: senderId,
      message: message,
    );
  }

  Future<void> sendImageMessage({
    required String chatId,
    required String senderId,
    required XFile image,
  }) async {
    final imageUrl = await _firestoreService.uploadImage(
      chatId: chatId,
      senderId: senderId,
      image: image,
    );
    await _firestoreService.sendMessage(
      chatId: chatId,
      senderId: senderId,
      message: imageUrl,
      messageType: ChatConstants.imageMessage,
    );
  }

  Future<void> markAsRead({required String chatId, required String userId}) {
    return _firestoreService.markAsRead(chatId: chatId, userId: userId);
  }

  Future<void> updateOnlineStatus({
    required String userId,
    required bool isOnline,
  }) {
    return _firestoreService.updateOnlineStatus(
      userId: userId,
      isOnline: isOnline,
    );
  }

  Future<void> saveFcmToken({required String userId, required String token}) {
    return _firestoreService.saveFcmToken(userId: userId, token: token);
  }
}
