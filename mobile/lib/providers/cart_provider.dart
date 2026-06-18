import 'package:flutter/foundation.dart';

import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};

  List<CartItem> get items => _items.values.toList(growable: false);

  int get itemCount {
    return _items.values.fold(0, (sum, item) => sum + item.quantity);
  }

  double get subtotal {
    return _items.values.fold(0, (sum, item) => sum + item.total);
  }

  double get shipping => subtotal == 0 ? 0 : 8.95;

  double get total => subtotal + shipping;

  void add(Product product) {
    final existing = _items[product.id];
    if (existing == null) {
      _items[product.id] = CartItem(product: product, quantity: 1);
    } else {
      _items[product.id] = existing.copyWith(quantity: existing.quantity + 1);
    }
    notifyListeners();
  }

  void removeOne(Product product) {
    final existing = _items[product.id];
    if (existing == null) {
      return;
    }

    if (existing.quantity == 1) {
      _items.remove(product.id);
    } else {
      _items[product.id] = existing.copyWith(quantity: existing.quantity - 1);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
