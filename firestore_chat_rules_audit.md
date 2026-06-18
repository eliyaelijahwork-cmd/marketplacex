# Firestore Chat Rules Audit

## Access Patterns

- Firestore database: `(default)`, `STANDARD`, `FIRESTORE_NATIVE`.
- `users/{userId}`: owners create/update their own supplier/chat profile; signed-in clients read profiles for chat and marketplace context; verified suppliers remain publicly readable.
- `chats/{chatId}`: participants read their own chat docs; authenticated buyer/seller participants create chats; participants update only last-message metadata or their own unread count.
- `chats/{chatId}/messages/{messageId}`: participants read messages; sender creates messages; non-sender participant can only mark a message as read.

## Query Coverage

- `chats.where('participants', arrayContains: uid).orderBy('lastMessageTime', descending: true).limit(50)`
- `chats/{chatId}/messages.orderBy('timestamp', descending: true).limit(50)`
- `chats/{chatId}/messages.where('isRead', isEqualTo: false).limit(500)`
- `users/{userId}` document streams for participant presence/profile data.

## Devil's Advocate Checks

- Public list exploit: chats/messages require participant checks; unauthenticated user docs are limited to verified suppliers.
- Unauthorized read/write: chat/message reads and writes require `request.auth.uid` in the parent chat participants list.
- Update bypass: user, chat, and message updates call validators and restrict changed fields.
- Ownership hijacking: chat identity fields and user uid fields are immutable after create.
- Resource exhaustion: all string fields have size limits; token/image/message lists are capped.
- Type juggling: validators enforce string, bool, int, number, timestamp, map, and list types.
- Required omission/schema pollution: `hasAll` and `hasOnly` validators reject missing required fields and extra fields.
- Read receipts: only the non-sender participant can set `isRead` and `readAt`.

## Auditor Assessment

{
  "score": 4,
  "summary": "The chat rules enforce participant-only access, schema validation, immutable identity fields, and restricted update surfaces. Remaining risk is that signed-in users can still read user profile documents because the existing marketplace model stores profile and contact details in one users collection.",
  "findings": [
    {
      "check": "Field-Level vs. Identity-Level Security",
      "severity": "minor",
      "issue": "The existing marketplace user document mixes supplier profile fields and phone/email contact details. Chat needs participant profiles, while marketplace pages need supplier profiles.",
      "recommendation": "For a launch hardening pass, split public profile data into a users_public collection and keep email/phone/FCM tokens private."
    }
  ]
}
