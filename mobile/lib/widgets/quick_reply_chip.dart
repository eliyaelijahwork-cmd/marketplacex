import 'package:flutter/material.dart';

class QuickReplyChip extends StatelessWidget {
  const QuickReplyChip({
    super.key,
    required this.label,
    required this.onSelected,
  });

  final String label;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(label),
      onPressed: () => onSelected(label),
      avatar: const Icon(Icons.flash_on_outlined, size: 16),
      labelStyle: const TextStyle(fontWeight: FontWeight.w700),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    );
  }
}
