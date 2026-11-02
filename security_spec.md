# Security Specification — Ward 19 Melparamba Citizen Application

## 1. Data Invariants & Master Source of Truth

1. **Public Read Collections (`/ward_info`, `/notices`, `/contacts`, `/schemes`, `/directory`, `/complaint_status`)**:
   - Anyone (including unauthenticated or anonymous residents) may `get` and `list` documents in these collections so offline caching and zero-login citizen browsing work seamlessly.
   - Only verified Administrators (`isAdmin()`) may `create`, `update`, or `delete` documents in `/ward_info`, `/notices`, `/contacts`, `/schemes`, and `/directory`.

2. **PII Isolation via Split Collection (`/complaints` vs `/complaint_status`)**:
   - `/complaints/{referenceId}` holds sensitive resident PII (`name`, `phone`, optional `photoUrl`, GPS coordinates).
   - Anyone authenticated (including Firebase Anonymous Auth) can `create` a complaint if and only if:
     - `incoming().authorUid == request.auth.uid`
     - `incoming().referenceNumber == referenceId` and matches `^W19-[0-9]{4}-[0-9]{4}$`
     - `incoming().phone` is an exact 10-digit string matching `^[0-9]{10}$`
     - `incoming().status == 'Received'` and `incoming().adminRemark == ''`
     - `incoming().createdAt == request.time`
     - Atomicity Guarantee (Pillar 7): Creating `/complaints/{referenceId}` requires the corresponding PII-free `/complaint_status/{referenceId}` document to exist after the batch (`existsAfter`).
   - Reading (`/complaints/{referenceId}`) is strictly restricted to the submitting device (`resource.data.authorUid == request.auth.uid`) or `isAdmin()`. No resident can read another resident's PII.
   - Residents cannot `update` or `delete` any complaint. Only `isAdmin()` can update status/remarks or delete spam.

3. **Public Reference Status & Resolved Issues (`/complaint_status/{referenceId}`)**:
   - Contains strictly non-PII fields (`referenceNumber`, `category`, `place`, `status`, `adminRemark`, `date`, `authorUid`, `createdAt`).
   - Anyone can `get` by `referenceId` to check status or `list` resolved issues without exposing any resident's name, phone number, or personal photo.

4. **Admin Authorization (`/admins/{adminUid}`)**:
   - `isAdmin()` evaluates to `true` only if `request.auth != null` and either:
     - `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`, OR
     - `request.auth.token.email == 'muhdRiyu@gmail.com' && request.auth.token.email_verified == true`.
   - Non-admins cannot create, modify, or delete documents in `/admins`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Complaint Creation)**:
   - User `anon_1` creates `/complaints/W19-2026-0001` with `authorUid: "anon_2"`.
   - Expected: `PERMISSION_DENIED` (`incoming().authorUid == request.auth.uid` fails).

2. **Payload 2 (Status Shortcutting on Complaint Creation)**:
   - User `anon_1` creates `/complaints/W19-2026-0002` with `status: "Resolved"` or `adminRemark: "Approved"`.
   - Expected: `PERMISSION_DENIED` (`incoming().status == 'Received' && incoming().adminRemark == ''` fails).

3. **Payload 3 (PII Lateral Read / Scraping)**:
   - User `anon_2` attempts `get` or `list` on `/complaints/W19-2026-0001` created by `anon_1`.
   - Expected: `PERMISSION_DENIED` (`resource.data.authorUid == request.auth.uid || isAdmin()` fails).

4. **Payload 4 (Shadow Field Injection on Complaint)**:
   - User `anon_1` creates `/complaints/W19-2026-0003` with an extra field `"isVerified": true`.
   - Expected: `PERMISSION_DENIED` (`hasOnly` key guard fails).

5. **Payload 5 (Invalid Phone Number Format)**:
   - User `anon_1` creates `/complaints/W19-2026-0004` with `phone: "12345"` or `"987654321A"`.
   - Expected: `PERMISSION_DENIED` (`phone.matches('^[0-9]{10}$')` fails).

6. **Payload 6 (Orphaned Write without Public Status Sync)**:
   - User `anon_1` creates `/complaints/W19-2026-0005` without atomically writing `/complaint_status/W19-2026-0005`.
   - Expected: `PERMISSION_DENIED` (`existsAfter` check fails).

7. **Payload 7 (Resident Self-Update of Complaint)**:
   - User `anon_1` attempts to `update` their own `/complaints/W19-2026-0001` description or status.
   - Expected: `PERMISSION_DENIED` (only `isAdmin()` can update complaints).

8. **Payload 8 (Unverified Admin Email Spoof)**:
   - Attacker with `email: "muhdRiyu@gmail.com"` and `email_verified: false` attempts to create a Notice in `/notices/notice_1`.
   - Expected: `PERMISSION_DENIED` (`email_verified == true` check fails).

9. **Payload 9 (Unauthorized Privilege Escalation in `/admins`)**:
   - Regular user `user_99` attempts to create `/admins/user_99` to grant themselves admin rights.
   - Expected: `PERMISSION_DENIED` (only `isAdmin()` can write to `/admins`).

10. **Payload 10 (Resource Poisoning / Oversized String)**:
    - User `anon_1` submits a complaint with a 5,000-character `description` (exceeding `maxLength: 1500`).
    - Expected: `PERMISSION_DENIED` (`description.size() <= 1500` fails).

11. **Payload 11 (Timestamp Forgery)**:
    - User `anon_1` submits a complaint with a backdated `createdAt` timestamp not equal to `request.time`.
    - Expected: `PERMISSION_DENIED` (`incoming().createdAt == request.time` fails).

12. **Payload 12 (PII Injection into Public `/complaint_status`)**:
    - User `anon_1` attempts to inject `phone: "9876543210"` into `/complaint_status/W19-2026-0001`.
    - Expected: `PERMISSION_DENIED` (`hasOnly` key whitelist on `isValidComplaintPublicStatus` rejects `phone`).
