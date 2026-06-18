import 'package:flutter/material.dart';

class OnlineIndicator extends StatelessWidget {
  const OnlineIndicator({
    super.key,
    required this.isOnline,
    this.showLabel = false,
  });

  final bool isOnline;
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final color = isOnline ? const Color(0xFF16A34A) : const Color(0xFF9CA3AF);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: Theme.of(context).colorScheme.surface,
              width: 1.5,
            ),
          ),
        ),
        if (showLabel) ...[
          const SizedBox(width: 6),
          Text(
            isOnline ? 'Online' : 'Offline',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ],
    );
  }
}
