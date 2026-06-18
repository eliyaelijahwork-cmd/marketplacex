import 'package:flutter/foundation.dart';

import '../data/sample_products.dart';
import '../models/product.dart';

class ProductProvider extends ChangeNotifier {
  final List<Product> _products = List.unmodifiable(sampleProducts);
  String _query = '';

  List<Product> get products {
    final normalizedQuery = _query.trim().toLowerCase();
    if (normalizedQuery.isEmpty) {
      return _products;
    }

    return _products.where((product) {
      return product.name.toLowerCase().contains(normalizedQuery) ||
          product.brand.toLowerCase().contains(normalizedQuery) ||
          product.category.toLowerCase().contains(normalizedQuery);
    }).toList();
  }

  String get query => _query;

  void updateQuery(String value) {
    _query = value;
    notifyListeners();
  }
}
