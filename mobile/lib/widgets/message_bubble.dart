import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/utils/chat_time_formatter.dart';
import '../models/message_model.dart';

class MessageBubble extends StatelessWidget {
  const MessageBubble({super.key, required this.message, required this.isMine});

  final MessageModel message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bubbleColor = isMine ? scheme.primary : scheme.surface;
    final foregroundColor = isMine ? scheme.onPrimary : scheme.onSurface;
    final alignment = isMine ? Alignment.centerRight : Alignment.centerLeft;
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(18),
      topRight: const Radius.circular(18),
      bottomLeft: Radius.circular(isMine ? 18 : 4),
      bottomRight: Radius.circular(isMine ? 4 : 18),
    );

    return Align(
      alignment: alignment,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: bubbleColor,
            borderRadius: radius,
            border: isMine
                ? null
                : Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              message.isImage ? 6 : 14,
              message.isImage ? 6 : 10,
              10,
              8,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (message.isImage)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(
                      imageUrl: message.message,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) {
                        return const AspectRatio(
                          aspectRatio: 1.2,
                          child: Center(child: CircularProgressIndicator()),
                        );
                      },
                      errorWidget: (context, url, error) {
                        return const AspectRatio(
                          aspectRatio: 1.2,
                          child: ColoredBox(
                            color: Color(0xFFE5E7EB),
                            child: Center(
                              child: Icon(Icons.broken_image_outlined),
                            ),
                          ),
                        );
                      },
                    ),
                  )
                else
                  Text(
                    message.message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: foregroundColor,
                      height: 1.35,
                    ),
                  ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formatMessageTimestamp(message.timestamp),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: foregroundColor.withValues(alpha: 0.72),
                      ),
                    ),
                    if (isMine) ...[
                      const SizedBox(width: 5),
                      Icon(
                        message.isRead ? Icons.done_all : Icons.done,
                        size: 14,
                        color: foregroundColor.withValues(alpha: 0.72),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
