import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  const UserModel({
    required this.userId,
    required this.name,
    required this.profileImage,
    required this.phone,
    required this.isOnline,
    required this.lastSeen,
    required this.fcmTokens,
  });

  final String userId;
  final String name;
  final String profileImage;
  final String phone;
  final bool isOnline;
  final Timestamp? lastSeen;
  final List<String> fcmTokens;

  factory UserModel.empty(String userId) {
    return UserModel(
      userId: userId,
      name: 'Marketplace user',
      profileImage: '',
      phone: '',
      isOnline: false,
      lastSeen: null,
      fcmTokens: const [],
    );
  }

  factory UserModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> document,
  ) {
    final data = document.data();
    if (data == null) return UserModel.empty(document.id);

    return UserModel(
      userId:
          data['userId'] as String? ?? data['uid'] as String? ?? document.id,
      name:
          data['name'] as String? ??
          data['supplierName'] as String? ??
          data['companyName'] as String? ??
          'Marketplace user',
      profileImage:
          data['profileImage'] as String? ??
          data['profilePhoto'] as String? ??
          '',
      phone:
          data['phone'] as String? ??
          data['phoneNumber'] as String? ??
          data['whatsappNumber'] as String? ??
          '',
      isOnline: data['isOnline'] as bool? ?? false,
      lastSeen: data['lastSeen'] as Timestamp?,
      fcmTokens: _stringList(data['fcmTokens']),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'name': name,
      'profileImage': profileImage,
      'phone': phone,
      'isOnline': isOnline,
      'lastSeen': lastSeen,
      'fcmTokens': fcmTokens,
    };
  }

  static List<String> _stringList(Object? value) {
    if (value is! List) return const [];
    return value.whereType<String>().toList();
  }
}
