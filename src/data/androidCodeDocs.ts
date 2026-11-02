/**
 * Complete Native Android (Kotlin + Jetpack Compose + Material 3) Architecture,
 * Copyable Firestore & Storage Security Rules, and Step-by-Step Firebase Setup Guide
 * for Ward 19 - Melparamba, Chemnad Panchayat, Kasaragod.
 */

export const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    // Only accounts listed in the "admins" collection (keyed by Firebase Auth UID) can edit
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // 1. Ward Member Info, Notices, Contacts, Schemes, Local Directory:
    // Anyone can read (supports offline caching & zero-login resident browsing).
    // Only admins can create, update, or delete.
    match /ward_info/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /notices/{noticeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /contacts/{contactId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /schemes/{schemeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /directory/{entryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 2. Private Complaints (contains resident Name, 10-digit Phone, Photo, GPS):
    // - Anyone (via silent Firebase Anonymous Auth) can create a complaint.
    // - Residents CANNOT read other people's complaints, and CANNOT edit or delete any.
    // - Only admins can read all complaints, update status/remarks, or delete spam.
    match /complaints/{referenceId} {
      allow create: if isSignedIn()
        && request.resource.data.referenceNumber == referenceId
        && request.resource.data.authorUid == request.auth.uid
        && request.resource.data.phone is string
        && request.resource.data.phone.size() == 10
        && request.resource.data.status == 'Received'
        && request.resource.data.adminRemark == '';

      allow get, list: if isAdmin() ||
        (isSignedIn() && resource.data.authorUid == request.auth.uid);

      allow update, delete: if isAdmin();
    }

    // 3. Public Complaint Status & Resolved Issues (PII-Free: Category, Place, Date, Status, Remark only):
    // - Anyone can read by Reference Number (W19-2026-0001) or list Resolved Issues.
    // - Created atomically alongside /complaints/{referenceId}; updated/deleted only by admins.
    match /complaint_status/{referenceId} {
      allow read: if true;
      allow create: if isSignedIn()
        && request.resource.data.referenceNumber == referenceId
        && request.resource.data.authorUid == request.auth.uid
        && !('name' in request.resource.data)
        && !('phone' in request.resource.data)
        && request.resource.data.status == 'Received';
      allow update, delete: if isAdmin();
    }

    // 4. Admins Allowlist Collection
    match /admins/{adminUid} {
      allow get: if isSignedIn() && (request.auth.uid == adminUid || isAdmin());
      allow list, write: if isAdmin();
    }
  }
}`;

export const STORAGE_RULES_TEXT = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    // Notice images & Ward Member photo: anyone can view, only admins can upload/delete
    match /notices/{fileName} {
      allow read: if true;
      allow write: if isAdmin()
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    // Complaint photos: residents (via silent anonymous auth) can upload images < 5MB on submission;
    // only admins can read or delete complaint photos
    match /complaints/{referenceId}/{fileName} {
      allow create: if isSignedIn()
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow read, delete: if isAdmin();
    }
  }
}`;

export const KOTLIN_ARCHITECTURE_CODE = `// ============================================================================
// FILE 1: app/build.gradle.kts (Dependencies & Configuration)
// ============================================================================
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

android {
    namespace = "in.kerala.chemnad.ward19melparamba"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.kerala.chemnad.ward19melparamba"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0 (Ward 19 Melparamba)"
    }
    buildFeatures { compose = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.02.00"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.datastore:datastore-preferences:1.1.2")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // Firebase BoM
    implementation(platform("com.google.firebase:firebase-bom:33.9.0"))
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-storage-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-messaging-ktx")
}

// ============================================================================
// FILE 2: data/WardRepository.kt (Firestore Offline Persistence & Silent Auth)
// ============================================================================
package in.kerala.chemnad.ward19melparamba.data

import android.content.Context
import android.net.Uri
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistentCacheSettings
import com.google.firebase.firestore.Query
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WardRepository(private val context: Context) {
    private val db = FirebaseFirestore.getInstance().apply {
        // Enable explicit offline disk persistence so Notices & Contacts work without internet
        firestoreSettings = FirebaseFirestoreSettings.Builder()
            .setLocalCacheSettings(PersistentCacheSettings.newBuilder().build())
            .build()
    }
    private val auth = FirebaseAuth.getInstance()
    private val storage = FirebaseStorage.getInstance()

    init {
        // Subscribe all residents to Ward 19 push notification topic
        FirebaseMessaging.getInstance().subscribeToTopic("ward_19_notices")
    }

    /**
     * Residents never see a login screen.
     * Silently signs in with Firebase Anonymous Auth before submitting a complaint.
     */
    suspend fun ensureSilentAnonymousAuth(): String {
        auth.currentUser?.let { return it.uid }
        val result = auth.signInAnonymously().await()
        return result.user?.uid ?: throw IllegalStateException("Silent auth failed")
    }

    /**
     * Real-time stream of Notices (newest first), cached offline automatically.
     */
    fun observeNotices(): Flow<List<Notice>> = callbackFlow {
        val listener = db.collection("notices")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snap, err ->
                if (err != null) return@addSnapshotListener
                val items = snap?.documents?.mapNotNull { doc ->
                    doc.toObject(Notice::class.java)?.copy(id = doc.id)
                }.orEmpty()
                trySend(items)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Submits a resident complaint with 1-complaint-per-day device limit and atomic public status sync.
     */
    suspend fun submitComplaint(
        name: String,
        phone: String,
        category: String,
        place: String,
        description: String,
        photoUri: Uri?,
        lat: Double?,
        lng: Double?
    ): Result<String> = runCatching {
        val prefs = context.getSharedPreferences("ward19_prefs", Context.MODE_PRIVATE)
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        if (prefs.getString("last_complaint_day", null) == today) {
            throw IllegalStateException("Only 1 complaint per day is allowed per device.")
        }

        val uid = ensureSilentAnonymousAuth()
        val year = SimpleDateFormat("yyyy", Locale.US).format(Date())
        val seq = (1000..9999).random()
        val refNumber = "W19-$year-$seq"

        var uploadedPhotoUrl: String? = null
        if (photoUri != null) {
            val storageRef = storage.reference.child("complaints/$refNumber/photo.jpg")
            storageRef.putFile(photoUri).await()
            uploadedPhotoUrl = storageRef.downloadUrl.await().toString()
        }

        val dateDisplay = SimpleDateFormat("dd MMM yyyy", Locale.US).format(Date())
        val batch = db.batch()

        val privateRef = db.collection("complaints").document(refNumber)
        batch.set(privateRef, mapOf(
            "referenceNumber" to refNumber,
            "name" to name,
            "phone" to phone,
            "category" to category,
            "place" to place,
            "description" to description,
            "photoUrl" to uploadedPhotoUrl,
            "latitude" to lat,
            "longitude" to lng,
            "status" to "Received",
            "adminRemark" to "",
            "authorUid" to uid,
            "date" to dateDisplay,
            "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
        ))

        // PII-free public status & resolved issue entry
        val publicRef = db.collection("complaint_status").document(refNumber)
        batch.set(publicRef, mapOf(
            "referenceNumber" to refNumber,
            "category" to category,
            "place" to place,
            "status" to "Received",
            "adminRemark" to "",
            "date" to dateDisplay,
            "authorUid" to uid,
            "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
        ))

        batch.commit().await()
        prefs.edit().putString("last_complaint_day", today).apply()
        refNumber
    }
}

// ============================================================================
// FILE 3: ui/WardViewModel.kt (Clean Architecture ViewModel + Hidden Admin Gate)
// ============================================================================
package in.kerala.chemnad.ward19melparamba.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class WardViewModel(private val repo: WardRepository) : ViewModel() {
    private val _language = MutableStateFlow("ml") // Default Malayalam or English toggle
    val language: StateFlow<String> = _language

    private var versionTapCount = 0
    private val _adminEntryUnlocked = MutableStateFlow(false)
    val adminEntryUnlocked: StateFlow<Boolean> = _adminEntryUnlocked

    private val _isAdminVerified = MutableStateFlow(false)
    val isAdminVerified: StateFlow<Boolean> = _isAdminVerified

    fun toggleLanguage() {
        _language.value = if (_language.value == "en") "ml" else "en"
    }

    /**
     * Hidden Admin Trigger: Called when App Version text on About screen is tapped.
     * Unlocks Admin Login screen after 5 taps.
     */
    fun onVersionTextTapped(): Boolean {
        versionTapCount++
        if (versionTapCount >= 5) {
            versionTapCount = 0
            _adminEntryUnlocked.value = true
            return true
        }
        return false
    }

    /**
     * Admin signs in with Email & Password.
     * Verifies UID exists in Firestore "admins" collection; otherwise remains read-only.
     */
    fun signInAdmin(email: String, pass: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            runCatching {
                val res = FirebaseAuth.getInstance()
                    .signInWithEmailAndPassword(email.trim(), pass).await()
                val uid = res.user?.uid ?: throw IllegalStateException("No UID")
                val adminSnap = FirebaseFirestore.getInstance()
                    .collection("admins").document(uid).get().await()
                if (!adminSnap.exists()) {
                    throw IllegalAccessException("Account is not in 'admins' collection (Read-only).")
                }
                _isAdminVerified.value = true
            }.onSuccess {
                onResult(true, null)
            }.onFailure { err ->
                _isAdminVerified.value = false
                onResult(false, err.localizedMessage)
            }
        }
    }
}`;
