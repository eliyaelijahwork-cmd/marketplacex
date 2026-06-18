import 'package:cloud_firestore/cloud_firestore.dart';

class ChatModel {
  const ChatModel({
    required this.chatId,
    required this.buyerId,
    required this.sellerId,
    required this.productId,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.participants,
    required this.lastMessageSenderId,
    required this.unreadCounts,
    required this.participantNames,
    required this.participantImages,
    required this.createdAt,
    required this.updatedAt,
  });

  final String chatId;
  final String buyerId;
  final String sellerId;
  final String productId;
  final String lastMessage;
  final Timestamp? lastMessageTime;
  final List<String> participants;
  final String lastMessageSenderId;
  final Map<String, int> unreadCounts;
  final Map<String, String> participantNames;
  final Map<String, String> participantImages;
  final Timestamp? createdAt;
  final Timestamp? updatedAt;

  factory ChatModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data() ?? {};

    return ChatModel(
      chatId: data['chatId'] as String? ?? document.id,
      buyerId: data['buyerId'] as String? ?? '',
      sellerId: data['sellerId'] as String? ?? '',
      productId: data['productId'] as String? ?? '',
      lastMessage: data['lastMessage'] as String? ?? '',
      lastMessageTime: data['lastMessageTime'] as Timestamp?,
      participants: _stringList(data['participants']),
      lastMessageSenderId: data['lastMessageSenderId'] as String? ?? '',
      unreadCounts: _intMap(data['unreadCounts']),
      participantNames: _stringMap(data['participantNames']),
      participantImages: _stringMap(data['participantImages']),
      createdAt: data['createdAt'] as Timestamp?,
      updatedAt: data['updatedAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'chatId': chatId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'productId': productId,
      'lastMessage': lastMessage,
      'lastMessageTime': lastMessageTime,
      'participants': participants,
      'lastMessageSenderId': lastMessageSenderId,
      'unreadCounts': unreadCounts,
      'participantNames': participantNames,
      'participantImages': participantImages,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  String otherParticipantId(String currentUserId) {
    if (buyerId == currentUserId) return sellerId;
    if (sellerId == currentUserId) return buyerId;
    return participants.firstWhere(
      (participant) => participant != currentUserId,
      orElse: () => '',
    );
  }

  String displayNameFor(String currentUserId) {
    final otherId = otherParticipantId(currentUserId);
    return participantNames[otherId] ?? 'Marketplace user';
  }

  String displayImageFor(String currentUserId) {
    final otherId = otherParticipantId(currentUserId);
    return participantImages[otherId] ?? '';
  }

  int unreadCountFor(String currentUserId) {
    return unreadCounts[currentUserId] ?? 0;
  }

  static List<String> _stringList(Object? value) {
    if (value is! List) return const [];
    return value.whereType<String>().toList();
  }

  static Map<String, String> _stringMap(Object? value) {
    if (value is! Map) return const {};
    return value.map(
      (key, mapValue) => MapEntry(key.toString(), mapValue?.toString() ?? ''),
    );
  }

  static Map<String, int> _intMap(Object? value) {
    if (value is! Map) return const {};
    return value.map((key, mapValue) {
      final count = mapValue is int ? mapValue : int.tryParse('$mapValue') ?? 0;
      return MapEntry(key.toString(), count);
    });
  }
}
