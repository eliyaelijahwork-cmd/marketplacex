const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.sendChatNotification = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const message = snapshot.data();
    const { chatId, messageId } = event.params;
    const senderId = message.senderId;

    if (!senderId) return;

    const chatSnapshot = await db.collection("chats").doc(chatId).get();
    if (!chatSnapshot.exists) return;

    const chat = chatSnapshot.data();
    const participants = Array.isArray(chat.participants)
      ? chat.participants
      : [];
    const recipientIds = participants.filter((id) => id && id !== senderId);

    if (recipientIds.length === 0) return;

    await Promise.all(
      recipientIds.map((recipientId) =>
        sendNotificationToRecipient({
          recipientId,
          senderId,
          chatId,
          messageId,
          productId: chat.productId || "",
          messageType: message.messageType || "text",
        }),
      ),
    );
  },
);

async function sendNotificationToRecipient({
  recipientId,
  senderId,
  chatId,
  messageId,
  productId,
  messageType,
}) {
  const userRef = db.collection("users").doc(recipientId);
  const userSnapshot = await userRef.get();
  const tokens = Array.isArray(userSnapshot.data()?.fcmTokens)
    ? userSnapshot.data().fcmTokens.filter((token) => typeof token === "string")
    : [];

  if (tokens.length === 0) return;

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "New Message",
      body: "You received a new message",
    },
    data: {
      chatId,
      messageId,
      senderId,
      productId,
      messageType,
    },
  });

  const invalidTokens = [];
  response.responses.forEach((sendResponse, index) => {
    if (sendResponse.success) return;

    const code = sendResponse.error?.code;
    logger.warn("Failed to send chat notification", {
      recipientId,
      code,
      tokenIndex: index,
    });

    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length > 0) {
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
    });
  }
}
