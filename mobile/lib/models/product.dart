class Product {
  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.category,
    required this.rating,
    required this.sellerId,
    required this.sellerName,
    required this.sellerProfileImage,
  });

  final String id;
  final String name;
  final String brand;
  final String description;
  final double price;
  final String imageUrl;
  final String category;
  final double rating;
  final String sellerId;
  final String sellerName;
  final String sellerProfileImage;
}
