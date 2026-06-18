import 'package:cloud_firestore/cloud_firestore.dart';

import '../core/constants/chat_constants.dart';

class MessageModel {
  const MessageModel({
    required this.messageId,
    required this.chatId,
    required this.senderId,
    required this.message,
    required this.timestamp,
    required this.messageType,
    required this.isRead,
    required this.readAt,
  });

  final String messageId;
  final String chatId;
  final String senderId;
  final String message;
  final Timestamp? timestamp;
  final String messageType;
  final bool isRead;
  final Timestamp? readAt;

  bool get isImage => messageType == ChatConstants.imageMessage;

  factory MessageModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data() ?? {};

    return MessageModel(
      messageId: data['messageId'] as String? ?? document.id,
      chatId: data['chatId'] as String? ?? '',
      senderId: data['senderId'] as String? ?? '',
      message: data['message'] as String? ?? '',
      timestamp: data['timestamp'] as Timestamp?,
      messageType: data['messageType'] as String? ?? ChatConstants.textMessage,
      isRead: data['isRead'] as bool? ?? false,
      readAt: data['readAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'messageId': messageId,
      'chatId': chatId,
      'senderId': senderId,
      'message': message,
      'timestamp': timestamp,
      'messageType': messageType,
      'isRead': isRead,
      'readAt': readAt,
    };
  }
}
