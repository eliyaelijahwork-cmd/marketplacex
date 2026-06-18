import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  AuthService({FirebaseAuth? firebaseAuth, FirebaseFirestore? firestore})
    : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
      _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;

  User? get currentUser => _firebaseAuth.currentUser;

  Stream<User?> authStateChanges() => _firebaseAuth.authStateChanges();

  Future<UserCredential> signIn({
    required String email,
    required String password,
  }) async {
    final credential = await _firebaseAuth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await ensureUserProfile(credential.user);
    return credential;
  }

  Future<UserCredential> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final credential = await _firebaseAuth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await credential.user?.updateDisplayName(displayName.trim());
    await ensureUserProfile(
      credential.user,
      displayNameOverride: displayName.trim(),
    );
    return credential;
  }

  Future<void> ensureUserProfile(
    User? user, {
    String? displayNameOverride,
  }) async {
    if (user == null) return;

    final displayName =
        displayNameOverride ?? user.displayName?.trim() ?? 'Marketplace user';
    final userRef = _firestore.collection('users').doc(user.uid);
    final snapshot = await userRef.get();

    if (!snapshot.exists) {
      await userRef.set({
        'uid': user.uid,
        'userId': user.uid,
        'name': displayName,
        'profileImage': user.photoURL ?? '',
        'phone': user.phoneNumber ?? '',
        'isOnline': true,
        'lastSeen': FieldValue.serverTimestamp(),
        'fcmTokens': <String>[],
        'supplierName': displayName,
        'companyName': '',
        'email': user.email ?? '',
        'phoneNumber': user.phoneNumber ?? '',
        'whatsappNumber': '',
        'profilePhoto': user.photoURL ?? '',
        'address': '',
        'city': '',
        'state': '',
        'latitude': 0,
        'longitude': 0,
        'description': '',
        'isVerified': false,
        'verificationStatus': 'pending',
        'rating': 0,
        'reviewCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
      });
      return;
    }

    await userRef.set({
      'uid': user.uid,
      'userId': user.uid,
      'name': displayName,
      'profileImage': user.photoURL ?? '',
      'phone': user.phoneNumber ?? '',
      'isOnline': true,
      'lastSeen': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> signOut() async {
    final userId = _firebaseAuth.currentUser?.uid;
    if (userId != null) {
      await _firestore.collection('users').doc(userId).set({
        'uid': userId,
        'userId': userId,
        'isOnline': false,
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    }

    await _firebaseAuth.signOut();
  }
}
