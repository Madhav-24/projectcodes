/**
 * File: userService.js
 * Path: /src/services/
 *
 * Purpose:
 *   This module is the dedicated Firebase Firestore service layer for all
 *   operations related to the "users" collection in this Construction AI
 *   Monitoring application. It acts as the single source of truth for how
 *   user data is read from and written to Firestore.
 *
 * Architectural Role:
 *   Following the "service layer" pattern, this file decouples Firebase-specific
 *   logic from React components. Components never import `firebase/firestore`
 *   directly — they call these functions instead. This means:
 *     - Firebase can be swapped out or mocked for testing without touching components
 *     - All Firestore query logic lives in one place (easy to audit and update)
 *     - Components stay focused on rendering and state, not database operations
 *
 * Exported Functions:
 *   - getAllUsers(void)               → Fetches all user documents ordered by name
 *   - updateUserPermissions(uid, permissions) → Updates a single user's permissions object
 *
 * Firestore Collection Structure:
 *   Collection: "users"
 *   Each document:
 *     {
 *       uid:           string    — document ID (matches Firebase Auth UID)
 *       name:          string    — full display name (e.g. "Rahul Sharma")
 *       role:          string    — one of: "admin", "project_manager", "supervisor", "engineer"
 *       employeeId:    string    — company-assigned employee identifier
 *       assignedSites: string[]  — list of site names this user is assigned to
 *       permissions: {
 *         canViewDashboard:  boolean  — whether user can access the dashboard
 *         canViewCharts:     boolean  — whether user can view analytics charts
 *         canMessageRoles:   string[] — roles this user is permitted to message
 *       }
 *     }
 *
 * Security Note:
 *   Firestore security rules must allow:
 *     - `read` on "users" collection for the Admin role
 *     - `update` on individual user documents for the Admin role
 *   Non-admin users should NOT have read/write access to this collection.
 *
 * Used In:
 *   - /src/pages/admin/Authentication.jsx  (getAllUsers, updateUserPermissions)
 *
 * Dependencies:
 *   - firebase/firestore SDK
 *   - /src/firebase/firebaseConfig.js — the initialised Firebase app instance
 */

// ─── Firestore SDK Imports ─────────────────────────────────────────────────────
// collection   → creates a reference to a top-level Firestore collection
// doc          → creates a reference to a specific document within a collection
// getDocs      → executes a query and returns a QuerySnapshot of all matching docs
// getFirestore → initialises and returns the Firestore database instance
// query        → builds a composable query from collection refs and constraints
// updateDoc    → partially updates fields on an existing Firestore document
//                (unlike setDoc, updateDoc does NOT overwrite the entire document)
// orderBy      → a query constraint that sorts results by a given field ascending
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  orderBy,
} from 'firebase/firestore';

// ─── Firebase App Instance ─────────────────────────────────────────────────────
// `app` is the singleton Firebase app object initialised with project credentials
// in firebaseConfig.js. Passing it to getFirestore() ensures we connect to the
// correct Firebase project when the app supports multiple projects (rare but safe).
import app from '../firebase/firebaseConfig.js';

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * db
 *
 * Purpose:
 *   The Firestore database instance for this application.
 *   Created once at module load time and reused by all functions in this file.
 *
 * Why module-level (not inside each function):
 *   getFirestore() is idempotent when passed the same app instance — it returns
 *   the same cached object. But calling it once here is cleaner and avoids even
 *   the tiny overhead of a function call per operation.
 *
 * Type:
 *   Firestore — the main Firestore DB instance
 */
const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Function: getAllUsers
 *
 * Purpose:
 *   Retrieves every document from the Firestore "users" collection, ordered
 *   alphabetically by the `name` field. The result is transformed from raw
 *   Firestore DocumentSnapshot objects into plain JavaScript objects that
 *   React components can easily consume.
 *
 * Why orderBy('name'):
 *   The Admin's permission management UI groups users by role but still benefits
 *   from alphabetically ordered names within each role group, making it easier to
 *   find a specific user without a search box — no client-side sort needed.
 *
 * NOTE — Firestore Index Requirement:
 *   Using orderBy on the "users" collection may require a composite index if
 *   combined with a `where` clause later. For this simple orderBy-only query,
 *   a single-field index on `name` suffices (auto-created by Firestore).
 *
 * Input:
 *   None
 *
 * Output:
 *   Promise<Array<Object>> — resolves with an array of user objects:
 *     [
 *       {
 *         uid:           string    — the Firestore document ID
 *         name:          string,
 *         role:          string,
 *         employeeId:    string,
 *         assignedSites: string[],
 *         permissions:   { canViewDashboard, canViewCharts, canMessageRoles }
 *       },
 *       ...
 *     ]
 *
 * Throws:
 *   Re-throws the Firestore error after logging it, so the calling component
 *   can show an error state to the user.
 *
 * Used In:
 *   Authentication.jsx → loadUsers() function
 *
 * TODO: Add pagination using Firestore's `startAfter` + `limit` when the
 *       user count exceeds ~200 documents to keep query latency low.
 * NOTE: Consider adding a `where('role', '!=', 'admin')` clause to exclude
 *       admin accounts from the list if admins should not manage each other.
 */
export async function getAllUsers() {
  try {
    // Step 1: Build a reference to the "users" top-level collection
    //         `collection(db, 'users')` does NOT query Firestore yet — it just
    //         creates a CollectionReference object describing the path.
    const usersRef = collection(db, 'users');

    // Step 2: Compose the query with an orderBy constraint.
    //         `query()` takes a CollectionReference and any number of query
    //         constraints (where, orderBy, limit, etc.) and returns a Query object.
    //         Adding orderBy('name') sorts results A → Z by the `name` field.
    const usersQuery = query(usersRef, orderBy('name'));

    // Step 3: Execute the query against Firestore.
    //         `getDocs()` sends the network request and resolves with a QuerySnapshot.
    //         A QuerySnapshot contains a `.docs` array of DocumentSnapshot objects.
    const snapshot = await getDocs(usersQuery);

    // Step 4: Transform each DocumentSnapshot into a plain JS object.
    //         - `document.id`   → the Firestore document's auto-generated or custom ID
    //         - `document.data()` → returns all stored fields as a plain object
    //         - Spreading `document.data()` adds all Firestore fields to the result
    //         - Adding `uid: document.id` makes the ID accessible as a top-level field,
    //           which is needed by Authentication.jsx when building the updatePromises array
    return snapshot.docs.map((document) => ({
      uid: document.id,   // Attach document ID as `uid` so components can reference it
      ...document.data(), // Spread all other Firestore fields (name, role, permissions, etc.)
    }));

  } catch (error) {
    // Log the detailed Firestore error to the browser console for developer debugging.
    // Using `console.error` (not `console.log`) marks this as an error in DevTools.
    console.error('Failed to fetch users from Firestore:', error);

    // Re-throw so the calling function (loadUsers in Authentication.jsx) can catch
    // it and display a user-facing error message — we don't silently swallow errors.
    throw error;
  }
}

/**
 * Function: updateUserPermissions
 *
 * Purpose:
 *   Writes an updated `permissions` object to a specific user's Firestore document.
 *   Uses `updateDoc` (not `setDoc`) so ONLY the `permissions` field is overwritten —
 *   all other fields (name, role, assignedSites, etc.) remain untouched.
 *
 * Batch Usage:
 *   In Authentication.jsx, this function is called inside a Promise.all() for
 *   every user in the `modifiedUsers` map. This means multiple users can be
 *   updated concurrently rather than sequentially, significantly reducing
 *   total latency when many users have been edited at once.
 *
 * Firestore Write Semantics:
 *   updateDoc with `{ permissions }` is a MERGE UPDATE — it sets the `permissions`
 *   field to the new value while leaving all sibling fields intact.
 *   If the `permissions` field didn't previously exist, Firestore creates it.
 *   If the `permissions` sub-object had extra nested fields, they are REPLACED
 *   (not merged) — so always pass the complete permissions object.
 *
 * Input:
 *   uid         {string} — the Firestore document ID for the user to update.
 *                          This is the same UID used by Firebase Authentication.
 *   permissions {Object} — the complete new permissions object:
 *                          {
 *                            canViewDashboard:  boolean,
 *                            canViewCharts:     boolean,
 *                            canMessageRoles:   string[]
 *                          }
 *
 * Output:
 *   Promise<void> — resolves when Firestore confirms the write.
 *                   Rejects (and re-throws) if the write fails.
 *
 * Throws:
 *   Re-throws the Firestore error after logging it, so Promise.all() in
 *   Authentication.jsx catches it and shows the error toast to the Admin.
 *
 * Security Note:
 *   Firestore rules must allow `update` on /users/{uid} for the Admin role.
 *   Without proper rules, this call will throw a "permission-denied" error.
 *
 * Used In:
 *   Authentication.jsx → handleSaveChanges() → Promise.all(updatePromises)
 *
 * TODO: Consider wrapping multiple simultaneous updateDoc calls in a Firestore
 *       `writeBatch` for true atomicity — currently if one write fails mid-batch,
 *       others may still succeed (partial update). For user permissions this is
 *       acceptable, but a batch transaction would guarantee all-or-nothing semantics.
 */
export async function updateUserPermissions(uid, permissions) {
  try {
    // Step 1: Build a DocumentReference to the specific user document.
    //         `doc(db, 'users', uid)` constructs the path: /users/{uid}
    //         No network call is made yet — this is just a reference object.
    const userRef = doc(db, 'users', uid);

    // Step 2: Perform the partial update on the user's document.
    //         `updateDoc` sends a PATCH-style write that only affects the fields
    //         listed in the second argument. Here, { permissions } is shorthand
    //         for { permissions: permissions } — overwriting only the `permissions` map.
    await updateDoc(userRef, { permissions });

    // No return value needed — Authentication.jsx only awaits completion (void resolved)

  } catch (error) {
    // Include the uid in the log message so developers can identify which specific
    // user document write failed when debugging in the browser console.
    console.error(`Failed to update permissions for user ${uid}:`, error);

    // Re-throw to propagate the error up to the Promise.all() caller in
    // handleSaveChanges(). This causes the .catch() there to run and show
    // the error toast to the Admin.
    throw error;
  }
}
