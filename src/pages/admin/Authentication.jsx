/**
 * File: Authentication.jsx
 * Path: /src/pages/admin/
 *
 * Purpose:
 *   This page is the Admin's control center for managing user permissions
 *   across the Construction AI Monitoring system. It allows the Admin to:
 *     - View all registered users grouped by role (Project Manager, Supervisor, Engineer)
 *     - Toggle dashboard access and chart visibility per user
 *     - Configure which roles a user is allowed to message
 *     - Save all modified permissions back to Firestore in a single batch operation
 *
 * Features:
 *   - Role-based tab navigation (Project Managers | Supervisors | Engineers)
 *   - Expand/collapse accordion cards for individual users
 *   - Optimistic permission editing with unsaved-change indicators
 *   - Batch Firestore update via Promise.all for high efficiency
 *   - Toast notifications for success and failure feedback
 *   - Loading spinner and inline error state with retry action
 *
 * Data Flow:
 *   1. On mount → getAllUsers() fetches the Firestore "users" collection
 *   2. User edits permissions → stored locally in modifiedUsers (not yet in Firestore)
 *   3. Admin clicks "Save Changes" → updateUserPermissions() is called for each dirty user
 *   4. Firestore is updated → modifiedUsers is cleared → toast confirms success
 *
 * Used In:
 *   Admin Dashboard navigation — accessible at route /admin/authentication
 *
 * Dependencies:
 *   - React (useState, useEffect, useMemo)
 *   - react-icons/fa (FaSave, FaSpinner, FaExclamationTriangle)
 *   - PageShell: layout wrapper providing page header styling
 *   - Tabs: horizontal tab navigation component for role switching
 *   - UserPermissionCard: accordion card that renders per-user permission controls
 *   - ROLES constant: canonical role string values used across the app
 *   - react-toastify: toast notification library
 *   - userService.js: Firebase Firestore abstraction layer
 */

// ─── React Core ──────────────────────────────────────────────────────────────
// useEffect: runs side-effects (data fetching) after component mounts
// useMemo: memoizes the filtered user list so it only re-computes when
//          the full user list or selected tab changes — avoids wasteful re-renders
// useState: manages all local UI state (users, loading, errors, etc.)
import { useEffect, useMemo, useState } from 'react';

// ─── Icon Imports ─────────────────────────────────────────────────────────────
// FaSave         → shown inside the "Save Changes" button
// FaSpinner      → animated loading indicator (spin class added inline)
// FaExclamationTriangle → shown inside the error banner
import { FaSave, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// ─── Layout & UI Components ───────────────────────────────────────────────────
// PageShell: wraps the page content with a consistent dark-card container,
//            title, and description text — keeps page layout DRY
import PageShell from '../../components/layout/PageShell.jsx';

// Tabs: renders the horizontal tab strip for switching between role categories
import Tabs from '../../components/auth/Tabs.jsx';

// UserPermissionCard: the main card component that shows one user's info and
//                     collapsible permission controls
import UserPermissionCard from '../../components/auth/UserPermissionCard.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────
// ROLES: frozen enum-like object { PROJECT_MANAGER, SUPERVISOR, ENGINEER, ADMIN }
//        Using constants avoids raw string typos scattered across the codebase
import { ROLES } from '../../constants/roles.js';

// ─── Notification Library ─────────────────────────────────────────────────────
// toast.success / toast.error: display non-blocking notification toasts
//                              after save operations complete or fail
import { toast } from 'react-toastify';

// ─── Firebase Service Layer ───────────────────────────────────────────────────
// getAllUsers          → Fetches all users ordered by name from Firestore "users" collection
// updateUserPermissions → Writes the permissions object for a specific user UID to Firestore
import { getAllUsers, updateUserPermissions } from '../../services/userService.js';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CONSTANTS
// Defined outside the component so they are not re-created on every render
// (these objects are shared, immutable configuration — no state needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ROLE_TABS
 *
 * Purpose:
 *   Drives the tab strip at the top of the page. Each tab corresponds to a user
 *   role. When the user clicks a tab, filteredUsers recomputes to show only the
 *   users that match the selected role.
 *
 * Shape: Array<{ id: string, label: string }>
 *   id    → must match the `role` field stored on each Firestore user document
 *   label → human-readable tab label displayed in the UI
 */
const ROLE_TABS = [
  { id: ROLES.PROJECT_MANAGER, label: 'Project Managers' },
  { id: ROLES.SUPERVISOR,      label: 'Supervisors'      },
  { id: ROLES.ENGINEER,        label: 'Engineers'         },
];

/**
 * MESSAGE_ROLES
 *
 * Purpose:
 *   Defines the complete set of roles that an admin can grant a user
 *   messaging permissions toward. Passed as a prop into UserPermissionCard
 *   where it renders one checkbox per role.
 *
 * Shape: Array<{ id: string, label: string }>
 *   id    → role key stored inside user.permissions.canMessageRoles array
 *   label → human-readable label shown next to the checkbox
 */
const MESSAGE_ROLES = [
  { id: 'admin',           label: 'Admin'           },
  { id: 'project_manager', label: 'Project Manager' },
  { id: 'supervisor',      label: 'Supervisor'      },
  { id: 'engineer',        label: 'Engineer'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Function: normalizePermissions
 *
 * Purpose:
 *   Ensures a user's permissions object always has all expected fields with
 *   sensible defaults — even if the Firestore document was created before
 *   the permissions schema was defined, or if some fields are missing.
 *
 * Why this is important:
 *   Firestore returns `undefined` for missing fields. Without normalization,
 *   toggle states (checkboxes) would be `undefined` and behave unpredictably.
 *
 * Input:
 *   user {Object} — raw user document from Firestore (may have partial permissions)
 *
 * Output:
 *   {Object} — a complete permissions object with guaranteed fields:
 *     canViewDashboard  {boolean} — defaults to true  (access is open by default)
 *     canViewCharts     {boolean} — defaults to true  (charts visible by default)
 *     canMessageRoles   {Array}   — defaults to []    (no messaging rights by default)
 *
 * Used In:
 *   getEffectivePermissions() inside the Authentication component
 */
const normalizePermissions = (user) => {
  // Extract the permissions sub-object, or use an empty object as fallback
  const permissions = user.permissions || {};

  return {
    // Nullish coalescing (??) preserves false, only falls back if null/undefined
    canViewDashboard: permissions.canViewDashboard ?? true,
    canViewCharts:    permissions.canViewCharts    ?? true,

    // Guard against non-array values being stored in Firestore by mistake
    canMessageRoles: Array.isArray(permissions.canMessageRoles)
      ? permissions.canMessageRoles
      : [],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Component: Authentication
 *
 * Purpose:
 *   Main page component that renders the Admin's user permission management UI.
 *   It is a smart (stateful) component that orchestrates data fetching,
 *   optimistic permission editing, and batch saving to Firestore.
 *
 * State:
 *   users          {Array}   — full list of all user documents fetched from Firestore
 *   selectedTab    {string}  — currently active role tab (controls which users are visible)
 *   expandedUserId {string|null} — UID of the currently open accordion card (one at a time)
 *   modifiedUsers  {Object}  — map of { [uid]: permissions } for users with unsaved edits
 *   loading        {boolean} — true while the initial Firestore fetch is in progress
 *   saving         {boolean} — true while the batch Firestore update is being written
 *   error          {string}  — non-empty string shown in the error banner when fetch fails
 *
 * Child Components:
 *   PageShell        — provides the outer page card and consistent header
 *   Tabs             — renders the role tab strip
 *   UserPermissionCard — renders one accordion card per filtered user
 *
 * Rendered At:
 *   Route: /admin/authentication
 */
function Authentication() {
  // ── State Declarations ──────────────────────────────────────────────────────

  // Stores the raw user array returned from Firestore; empty until data loads
  const [users, setUsers] = useState([]);

  // Tracks which tab is active; initialised to PROJECT_MANAGER so data appears
  // immediately (most commonly the first role an Admin wants to manage)
  const [selectedTab, setSelectedTab] = useState(ROLES.PROJECT_MANAGER);

  // Only one UserPermissionCard is expanded at a time; null means all collapsed
  const [expandedUserId, setExpandedUserId] = useState(null);

  // Tracks only the users whose permissions have been changed but not yet saved.
  // Structure: { [uid: string]: permissionsObject }
  // When the Admin saves, this object is iterated to build Firestore update calls
  const [modifiedUsers, setModifiedUsers] = useState({});

  // Controls the initial loading spinner shown in place of the user list
  const [loading, setLoading] = useState(true);

  // Controls the spinner shown inside the Save button while writes are in flight
  const [saving, setSaving] = useState(false);

  // Stores a user-facing error message; empty string means no error
  const [error, setError] = useState('');

  // ── Lifecycle: Fetch Users on Mount ────────────────────────────────────────

  useEffect(() => {
    // Trigger the user fetch once when the component first mounts.
    // No cleanup needed as getAllUsers() is a one-shot async call (not a listener).
    loadUsers();
  }, []); // Empty dependency array → runs once on mount only

  // ── Data Fetching ───────────────────────────────────────────────────────────

  /**
   * Function: loadUsers
   *
   * Purpose:
   *   Fetch all user documents from the Firestore "users" collection and
   *   populate the local `users` state. Also called by the "Retry" button
   *   inside the error banner so the user can recover without a full page reload.
   *
   * Input:
   *   None
   *
   * Output:
   *   - On success: updates `users` state with the fetched array
   *   - On failure: updates `error` state with a user-friendly message
   *   - Always: resets `loading` to false in the finally block
   *
   * Used In:
   *   useEffect on mount, and the "Retry" button in the error state UI
   */
  async function loadUsers() {
    // Show the loading spinner and clear any previous error before fetching
    setLoading(true);
    setError('');

    try {
      // getAllUsers() queries Firestore and returns an array of user objects,
      // each containing { uid, name, role, permissions, assignedSites, ... }
      const data = await getAllUsers();

      // Store the fetched list; this will trigger re-render and filteredUsers
      // to recompute via useMemo
      setUsers(data);
    } catch (err) {
      // Log the raw error for developer debugging in the browser console
      console.error('Error loading users:', err);

      // Set a friendly message for the end user — never expose raw error text
      setError('Unable to load users. Please refresh.');
    } finally {
      // Always hide the spinner regardless of success or failure
      setLoading(false);
    }
  }

  // ── Derived / Memoized Data ─────────────────────────────────────────────────

  /**
   * filteredUsers
   *
   * Purpose:
   *   Returns only the users whose `role` field matches the currently selected tab.
   *   useMemo prevents this from running on every render — only recalculates when
   *   `users` or `selectedTab` changes, which keeps the UI responsive.
   *
   * Output:
   *   Array of user objects for the active tab's role
   */
  const filteredUsers = useMemo(
    () => users.filter((user) => user.role === selectedTab),
    [users, selectedTab]
  );

  /**
   * hasChanges
   *
   * Purpose:
   *   Boolean flag that determines whether the Save button should be enabled.
   *   True when at least one user has been edited (modifiedUsers is non-empty).
   *   Disabling the button when there are no changes prevents unnecessary
   *   Firestore writes.
   */
  const hasChanges = Object.keys(modifiedUsers).length > 0;

  // ── Permission Helpers ──────────────────────────────────────────────────────

  /**
   * Function: getEffectivePermissions
   *
   * Purpose:
   *   Returns the permissions object that should be rendered for a given user.
   *   If the Admin has made local edits (stored in modifiedUsers), those take
   *   precedence over the Firestore-persisted permissions — enabling an
   *   optimistic UI where changes are immediately reflected without a round-trip.
   *
   * Input:
   *   user {Object} — a user document from the `users` state array
   *
   * Output:
   *   {Object} — the effective (potentially unsaved) permissions for that user
   *
   * Used In:
   *   filteredUsers.map() in the JSX that renders UserPermissionCard list
   */
  const getEffectivePermissions = (user) => {
    // If the user has been modified locally, return the draft permissions;
    // otherwise fall back to the normalized Firestore-persisted permissions
    return modifiedUsers[user.uid] || normalizePermissions(user);
  };

  // ── Event Handlers ──────────────────────────────────────────────────────────

  /**
   * Function: handlePermissionChange
   *
   * Purpose:
   *   Called by UserPermissionCard whenever the Admin toggles any permission.
   *   Stores the updated permissions object in modifiedUsers (keyed by uid)
   *   so the change is visible immediately in the UI without hitting Firestore.
   *
   * How optimistic editing works:
   *   The modifiedUsers map acts as a "diff" layer on top of the server state.
   *   No Firestore write happens here — writes only happen on Save.
   *
   * Input:
   *   userUid       {string} — the UID of the user whose permissions changed
   *   nextPermissions {Object} — the complete new permissions object
   *
   * Output:
   *   Updates modifiedUsers state (triggers re-render of affected card)
   *
   * Used In:
   *   Passed as `onChange` prop to each UserPermissionCard
   */
  const handlePermissionChange = (userUid, nextPermissions) => {
    setModifiedUsers((prev) => ({
      ...prev,                   // Preserve edits to all other users
      [userUid]: nextPermissions, // Overwrite only the modified user's entry
    }));
  };

  /**
   * Function: handleSaveChanges
   *
   * Purpose:
   *   Persist all locally-modified permission objects back to Firestore.
   *   Uses Promise.all to dispatch all Firestore update calls concurrently
   *   rather than sequentially, dramatically reducing total write latency
   *   when multiple users have been edited at once.
   *
   * Input:
   *   None (reads from modifiedUsers state internally)
   *
   * Output:
   *   - On success: clears modifiedUsers, shows success toast
   *   - On failure: shows error toast, modifiedUsers preserved so user can retry
   *
   * Guard:
   *   Returns early if there are no changes to avoid empty Firestore operations.
   *
   * Used In:
   *   "Save Changes" button onClick handler
   */
  const handleSaveChanges = async () => {
    // Guard: if nothing has changed, do not proceed (button should already be
    // disabled, but this is a safety net against programmatic calls)
    if (!hasChanges) {
      return;
    }

    // Show spinning indicator inside the Save button
    setSaving(true);

    try {
      // Build an array of Firestore update promises — one per modified user.
      // Object.entries(modifiedUsers) → [['uid1', permsObj], ['uid2', permsObj], ...]
      const updatePromises = Object.entries(modifiedUsers).map(
        ([userUid, permissions]) => updateUserPermissions(userUid, permissions)
      );

      // Dispatch all writes concurrently; await until every promise resolves.
      // If any individual write rejects, the entire Promise.all rejects → caught below.
      await Promise.all(updatePromises);

      // Clear the diff layer since Firestore is now up-to-date
      setModifiedUsers({});

      // Confirm success to the Admin via a green toast notification
      toast.success('Permissions saved successfully.');
    } catch (err) {
      // Log the raw Firestore error for developer debugging
      console.error('Error saving permissions:', err);

      // Inform the Admin via a red toast; modifiedUsers is intentionally NOT
      // cleared here so the Admin can retry without re-entering all changes
      toast.error('Unable to save changes. Please try again.');
    } finally {
      // Always remove the spinning state from the Save button
      setSaving(false);
    }
  };

  // ── Sub-render Helpers ──────────────────────────────────────────────────────

  /**
   * Function: renderEmptyState
   *
   * Purpose:
   *   Returns a styled placeholder element when the selected role tab has no users.
   *   Separated into its own helper to keep the main JSX block readable.
   *
   * Input:
   *   None
   *
   * Output:
   *   JSX element — a dashed-border card with descriptive empty-state text
   *
   * Used In:
   *   The conditional rendering block inside the user list container
   */
  const renderEmptyState = () => (
    // Dashed border signals "nothing here yet" without being alarming to the user
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-400">
      <p className="text-lg font-semibold text-slate-200">No users found</p>
      <p className="mt-2 text-sm text-slate-500">
        There are no users registered for the selected role yet.
      </p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    /*
     * PageShell wraps this content inside the standard page card with a title
     * and subtitle. The title and description are passed as props so PageShell
     * can render the consistent header used across all admin pages.
     */
    <PageShell
      title="Authentication & Permissions"
      description="Manage user access, dashboard visibility, and messaging permissions."
    >
      <div className="space-y-6">

        {/* ── Page Header Row: Title + Save Button ─────────────────────────── */}
        {/* Grid layout: title takes available space, button aligns to the right */}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Access Control</h1>
            <p className="mt-2 text-slate-400">
              Edit permissions for project managers, supervisors, and engineers from one place.
            </p>
          </div>

          {/*
           * Save Changes Button
           *
           * Disabled when:
           *   - hasChanges is false (nothing edited yet)
           *   - saving is true (write is already in flight)
           *
           * Shows a spinner + "Saving..." text while the Firestore write is pending,
           * then reverts to the normal FaSave icon once complete.
           */}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-slate-700"
          >
            {saving ? (
              // While saving: show animated spinner and descriptive text
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              // Default state: show save icon and action label
              <>
                <FaSave /> Save Changes
              </>
            )}
          </button>
        </div>

        {/* ── Role Tab Strip ────────────────────────────────────────────────── */}
        {/*
         * Tabs renders a row of clickable tabs, one per ROLE_TAB entry.
         * onTabChange updates `selectedTab`, which in turn causes `filteredUsers`
         * (memoized) to recalculate and show users for the chosen role.
         */}
        <Tabs
          tabs={ROLE_TABS}
          activeTabId={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* ── User List Container ───────────────────────────────────────────── */}
        {/*
         * This outer container provides a consistent dark card background.
         * Its content switches between three conditional states:
         *   1. Loading  → spinner
         *   2. Error    → red banner with retry button
         *   3. No users → empty state placeholder
         *   4. Users    → list of UserPermissionCard accordion items
         */}
        <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">

          {loading ? (
            // ── Loading State ──────────────────────────────────────────────
            // Centered spinner shown while Firestore query is in flight
            <div className="flex items-center justify-center gap-3 py-20 text-slate-300">
              <FaSpinner className="animate-spin text-xl text-blue-400" />
              Loading users...
            </div>

          ) : error ? (
            // ── Error State ────────────────────────────────────────────────
            // Red-bordered banner shown when getAllUsers() throws an error.
            // Includes a "Retry" button that re-calls loadUsers() without
            // requiring a full page refresh.
            <div className="rounded-3xl border border-red-700 bg-red-900/20 p-6 text-red-200">
              <div className="flex items-center gap-3 mb-4">
                <FaExclamationTriangle />
                {/* Display the error message set during the failed fetch */}
                <span>{error}</span>
              </div>
              {/* Retry button re-executes loadUsers() to recover from transient errors */}
              <button
                type="button"
                onClick={loadUsers}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Retry
              </button>
            </div>

          ) : filteredUsers.length === 0 ? (
            // ── Empty State ────────────────────────────────────────────────
            // Renders when no users belong to the currently selected role tab
            renderEmptyState()

          ) : (
            // ── User Cards List ────────────────────────────────────────────
            // Map each user in the filtered list to a UserPermissionCard.
            // Each card receives:
            //   user        → the raw user document for name, role, sites display
            //   permissions → the effective (potentially locally-edited) permissions
            //   messageRoles → the full set of roles available as messaging targets
            //   expanded    → whether this specific card's accordion is open
            //   onToggleExpand → accordion toggle; ensures only one card is open at a time
            //   onChange    → callback invoked when any permission toggle/checkbox changes
            //   hasChanges  → whether this user has unsaved edits (shows amber dot indicator)
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserPermissionCard
                  key={user.uid}                           // Stable React key for efficient reconciliation
                  user={user}                              // Full user data (name, role, sites)
                  permissions={getEffectivePermissions(user)} // Draft or server permissions
                  messageRoles={MESSAGE_ROLES}             // Available messaging targets
                  expanded={expandedUserId === user.uid}   // True only for the currently open card
                  onToggleExpand={() =>
                    // Toggle logic: if this card is already open, close it (set null);
                    // otherwise open this card (close any previously open one)
                    setExpandedUserId((prev) =>
                      prev === user.uid ? null : user.uid
                    )
                  }
                  onChange={(nextPermissions) =>
                    // Bubble the change up so modifiedUsers is updated in this parent
                    handlePermissionChange(user.uid, nextPermissions)
                  }
                  hasChanges={Boolean(modifiedUsers[user.uid])} // True if this user has local edits
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// Export as default so it can be imported via lazy() in AppRoutes or directly
export default Authentication;
