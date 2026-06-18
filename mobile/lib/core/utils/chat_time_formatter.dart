import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

String formatChatTimestamp(Timestamp? timestamp) {
  if (timestamp == null) return '';

  final date = timestamp.toDate();
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final messageDay = DateTime(date.year, date.month, date.day);
  final difference = today.difference(messageDay).inDays;

  if (difference == 0) {
    return DateFormat.jm().format(date);
  }

  if (difference == 1) {
    return 'Yesterday';
  }

  if (difference < 7) {
    return DateFormat.E().format(date);
  }

  return DateFormat('MMM d').format(date);
}

String formatMessageTimestamp(Timestamp? timestamp) {
  if (timestamp == null) return '';
  return DateFormat.jm().format(timestamp.toDate());
}

String formatLastSeen(Timestamp? timestamp) {
  if (timestamp == null) return 'Offline';

  final date = timestamp.toDate();
  final now = DateTime.now();
  final minutes = now.difference(date).inMinutes;

  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return 'Active ${minutes}m ago';

  final hours = now.difference(date).inHours;
  if (hours < 24) return 'Active ${hours}h ago';

  return 'Last seen ${DateFormat('MMM d').format(date)}';
}
