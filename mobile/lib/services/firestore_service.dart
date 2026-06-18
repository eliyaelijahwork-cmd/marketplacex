import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';

import '../core/constants/chat_constants.dart';
import '../models/chat_model.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';

class FirestoreService {
  FirestoreService({FirebaseFirestore? firestore, FirebaseStorage? storage})
    : _firestore = firestore ?? FirebaseFirestore.instance,
      _storage = storage ?? FirebaseStorage.instance;

  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;

  CollectionReference<Map<String, dynamic>> get _chatsRef {
    return _firestore.collection('chats');
  }

  CollectionReference<Map<String, dynamic>> get _usersRef {
    return _firestore.collection('users');
  }

  CollectionReference<Map<String, dynamic>> _messagesRef(String chatId) {
    return _chatsRef.doc(chatId).collection('messages');
  }

  Stream<List<ChatModel>> getChats(
    String userId, {
    int limit = ChatConstants.chatsPageSize,
  }) {
    return _chatsRef
        .where('participants', arrayContains: userId)
        .orderBy('lastMessageTime', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(ChatModel.fromFirestore).toList());
  }

  Stream<ChatModel?> getChat(String chatId) {
    return _chatsRef.doc(chatId).snapshots().map((snapshot) {
      if (!snapshot.exists) return null;
      return ChatModel.fromFirestore(snapshot);
    });
  }

  Stream<List<MessageModel>> getMessages(
    String chatId, {
    int limit = ChatConstants.messagesPageSize,
  }) {
    return _messagesRef(
      chatId,
    ).orderBy('timestamp', descending: true).limit(limit).snapshots().map((
      snapshot,
    ) {
      final messages = snapshot.docs.map(MessageModel.fromFirestore).toList();
      return messages.reversed.toList();
    });
  }

  Future<List<MessageModel>> getOlderMessages(
    String chatId, {
    required Timestamp before,
    int limit = ChatConstants.messagesPageSize,
  }) async {
    final snapshot = await _messagesRef(chatId)
        .orderBy('timestamp', descending: true)
        .startAfter([before])
        .limit(limit)
        .get();

    return snapshot.docs.map(MessageModel.fromFirestore).toList();
  }

  Stream<UserModel> getUser(String userId) {
    return _usersRef.doc(userId).snapshots().map(UserModel.fromFirestore);
  }

  Future<ChatModel> createChat({
    required String buyerId,
    required String sellerId,
    required String productId,
    required String buyerName,
    required String sellerName,
    String buyerImage = '',
    String sellerImage = '',
  }) async {
    if (buyerId == sellerId) {
      throw ChatException('You cannot start a chat with yourself.');
    }

    final chatId = buildChatId(
      buyerId: buyerId,
      sellerId: sellerId,
      productId: productId,
    );
    final chatRef = _chatsRef.doc(chatId);
    final existing = await chatRef.get();

    if (existing.exists) {
      return ChatModel.fromFirestore(existing);
    }

    await chatRef.set({
      'chatId': chatId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'productId': productId,
      'lastMessage': 'Start the conversation',
      'lastMessageTime': FieldValue.serverTimestamp(),
      'lastMessageSenderId': '',
      'participants': [buyerId, sellerId],
      'unreadCounts': {buyerId: 0, sellerId: 0},
      'participantNames': {buyerId: buyerName, sellerId: sellerName},
      'participantImages': {buyerId: buyerImage, sellerId: sellerImage},
      'createdAt': FieldValue.serverTimestamp(),
    });

    final created = await chatRef.get();
    return ChatModel.fromFirestore(created);
  }

  Future<void> sendMessage({
    required String chatId,
    required String senderId,
    required String message,
    String messageType = ChatConstants.textMessage,
  }) async {
    final trimmedMessage = message.trim();
    if (trimmedMessage.isEmpty) return;

    await _firestore.runTransaction((transaction) async {
      final chatRef = _chatsRef.doc(chatId);
      final chatSnapshot = await transaction.get(chatRef);

      if (!chatSnapshot.exists) {
        throw ChatException('Chat not found.');
      }

      final chat = ChatModel.fromFirestore(chatSnapshot);
      if (!chat.participants.contains(senderId)) {
        throw ChatException('You are not a participant in this chat.');
      }

      final messageRef = _messagesRef(chatId).doc();
      final unreadCounts = Map<String, int>.from(chat.unreadCounts);
      for (final participantId in chat.participants) {
        if (participantId == senderId) continue;
        unreadCounts[participantId] = (unreadCounts[participantId] ?? 0) + 1;
      }

      transaction.set(messageRef, {
        'messageId': messageRef.id,
        'chatId': chatId,
        'senderId': senderId,
        'message': trimmedMessage,
        'timestamp': FieldValue.serverTimestamp(),
        'messageType': messageType,
        'isRead': false,
      });

      transaction.update(chatRef, {
        'lastMessage': messageType == ChatConstants.imageMessage
            ? 'Photo'
            : trimmedMessage,
        'lastMessageTime': FieldValue.serverTimestamp(),
        'lastMessageSenderId': senderId,
        'unreadCounts': unreadCounts,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
  }

  Future<void> markAsRead({
    required String chatId,
    required String userId,
  }) async {
    final unreadMessages = await _messagesRef(
      chatId,
    ).where('isRead', isEqualTo: false).limit(500).get();

    final batch = _firestore.batch();
    var hasMessageUpdates = false;

    for (final document in unreadMessages.docs) {
      final message = MessageModel.fromFirestore(document);
      if (message.senderId == userId) continue;

      batch.update(document.reference, {
        'isRead': true,
        'readAt': FieldValue.serverTimestamp(),
      });
      hasMessageUpdates = true;
    }

    if (hasMessageUpdates) {
      await batch.commit();
    }

    final chatRef = _chatsRef.doc(chatId);
    await _firestore.runTransaction((transaction) async {
      final snapshot = await transaction.get(chatRef);
      if (!snapshot.exists) return;

      final chat = ChatModel.fromFirestore(snapshot);
      if (!chat.participants.contains(userId)) return;

      final unreadCounts = Map<String, int>.from(chat.unreadCounts);
      unreadCounts[userId] = 0;
      transaction.update(chatRef, {
        'unreadCounts': unreadCounts,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
  }

  Future<void> updateOnlineStatus({
    required String userId,
    required bool isOnline,
  }) async {
    await _usersRef.doc(userId).set({
      'userId': userId,
      'uid': userId,
      'isOnline': isOnline,
      'lastSeen': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> saveFcmToken({
    required String userId,
    required String token,
  }) async {
    await _usersRef.doc(userId).set({
      'userId': userId,
      'uid': userId,
      'fcmTokens': FieldValue.arrayUnion([token]),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<String> uploadImage({
    required String chatId,
    required String senderId,
    required XFile image,
  }) async {
    final extension = _extensionFor(image);
    final storageRef = _storage.ref().child(
      'chat_images/$chatId/$senderId/'
      '${DateTime.now().millisecondsSinceEpoch}$extension',
    );
    final bytes = await image.readAsBytes();
    final metadata = SettableMetadata(
      contentType: image.mimeType ?? _contentTypeFor(extension),
    );

    final task = await storageRef.putData(bytes, metadata);
    return task.ref.getDownloadURL();
  }

  static String buildChatId({
    required String buyerId,
    required String sellerId,
    required String productId,
  }) {
    return [
      _safeIdPart(buyerId),
      _safeIdPart(sellerId),
      _safeIdPart(productId),
    ].join('_');
  }

  static String _safeIdPart(String value) {
    return value.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '-');
  }

  static String _extensionFor(XFile image) {
    final name = image.name.toLowerCase();
    if (name.endsWith('.png')) return '.png';
    if (name.endsWith('.webp')) return '.webp';
    return '.jpg';
  }

  static String _contentTypeFor(String extension) {
    return switch (extension) {
      '.png' => 'image/png',
      '.webp' => 'image/webp',
      _ => 'image/jpeg',
    };
  }
}

class ChatException implements Exception {
  const ChatException(this.message);

  final String message;

  @override
  String toString() => message;
}
