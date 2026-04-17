/**
 * File: UserPermissionCard.jsx
 * Path: /src/components/auth/
 *
 * Purpose:
 *   A reusable accordion-style card component that displays a single user's
 *   profile summary and — when expanded — renders interactive controls that
 *   let the Admin toggle that user's permissions in real-time.
 *
 * Features:
 *   - Displays user avatar (initials), full name, role badge, employee ID,
 *     and all assigned construction sites
 *   - Collapsible accordion panel toggled by a single click anywhere on the header
 *   - Toggle switch for "Dashboard Access" (canViewDashboard)
 *   - Toggle switch for "Chart Visibility" (canViewCharts)
 *   - Checkbox list for "Messaging Permissions" (canMessageRoles)
 *   - Amber dot indicator on the card header when the user has unsaved edits
 *
 * Data Flow:
 *   1. Parent (Authentication.jsx) passes the current permissions snapshot
 *   2. localPermissions state mirrors that snapshot internally
 *   3. When the Admin makes a change, localPermissions is updated AND
 *      onChange() is called so the parent can track the diff
 *   4. When the parent resets permissions (e.g. after Save), useEffect syncs
 *      localPermissions back to the latest snapshot from the parent
 *
 * Props:
 *   user          {Object}   — Firestore user document (name, role, uid, assignedSites, employeeId)
 *   permissions   {Object}   — effective permissions (may be a locally-edited draft or server data)
 *   messageRoles  {Array}    — list of { id, label } for messaging permission checkboxes
 *   expanded      {boolean}  — whether this card's accordion panel is currently open
 *   onToggleExpand {Function} — called when the user clicks the card header to expand/collapse
 *   onChange      {Function} — called with the updated permissions object whenever a toggle changes
 *   hasChanges    {boolean}  — true when parent's modifiedUsers map contains an entry for this user
 *
 * Used In:
 *   Authentication.jsx — rendered once per user in the filteredUsers.map() list
 *
 * Dependencies:
 *   - React (useState, useEffect)
 *   - react-icons/fa (FaChevronDown, FaChevronUp)
 */

// ─── React Core ──────────────────────────────────────────────────────────────
// useState  → manages a local copy of permissions for synchronous UI feedback
// useEffect → keeps localPermissions in sync when parent overrides the prop
//             (e.g. after a successful save that clears all modified state)
import { useEffect, useState } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
// FaChevronDown → shown on collapsed cards to hint "click to expand"
// FaChevronUp   → shown on the expanded card to hint "click to collapse"
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CONSTANTS
// Defined outside the component to avoid recreation on every render
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ROLE_LABELS
 *
 * Purpose:
 *   Maps the raw role string stored in Firestore to a human-readable label
 *   displayed inside the role badge on each card header.
 *
 * Why not use the ROLES constant here:
 *   This map is specific to display formatting for this component only.
 *   Keeping it local avoids coupling this component to the global constants file
 *   for a purely presentational concern.
 *
 * Fallback behaviour:
 *   If `user.role` does not match any key, the raw role string is shown instead
 *   (see: `ROLE_LABELS[user.role] || user.role` in the render)
 */
const ROLE_LABELS = {
  project_manager: 'Project Manager',
  supervisor:      'Supervisor',
  engineer:        'Engineer',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Component: UserPermissionCard
 *
 * Purpose:
 *   Renders a single collapsible card for one system user.
 *   The collapsed state shows identity info; the expanded state adds
 *   the interactive permission controls.
 *
 * Design decision — local state vs. pure controlled:
 *   Permissions are kept in localPermissions (local state) rather than being
 *   purely controlled (just using the prop directly). This gives immediate
 *   toggle feedback without waiting for the parent's setState to propagate,
 *   resulting in a snappier UI. The parent still owns the canonical draft state;
 *   localPermissions is only a synchronised copy for fast rendering.
 *
 * State:
 *   localPermissions {Object} — current draft of this user's permissions,
 *                               mirroring the `permissions` prop
 */
function UserPermissionCard({
  user,           // Full Firestore user document
  permissions,    // Effective permissions for this user (draft or server)
  messageRoles,   // Array of available messaging target roles
  expanded,       // Whether the accordion panel is open (controlled by parent)
  onToggleExpand, // Callback to toggle this card's expanded state in the parent
  onChange,       // Callback to propagate permission changes up to the parent
  hasChanges,     // Whether this user currently has unsaved edits
}) {

  /**
   * localPermissions
   *
   * Purpose:
   *   A synchronised local copy of the incoming `permissions` prop.
   *   Storing permissions locally allows toggle switches to update
   *   instantly without a round-trip through the parent component's state.
   *
   * Sync strategy:
   *   useEffect below watches the `permissions` prop. If the parent ever
   *   provides a new snapshot (e.g. after Save clears modifiedUsers),
   *   localPermissions is reset to match — keeping them always in sync.
   */
  const [localPermissions, setLocalPermissions] = useState(permissions);

  // ── Prop Sync Effect ────────────────────────────────────────────────────────

  useEffect(() => {
    /**
     * Purpose:
     *   Synchronise localPermissions whenever the parent passes a new
     *   `permissions` snapshot. This handles two cases:
     *     1. After a successful Save — parent clears modifiedUsers, so the
     *        prop reverts to the now-persisted Firestore data.
     *     2. If the parent re-fetches and replaces the users array entirely,
     *        each card's permissions prop will be a new reference.
     *
     * Why this dependency array [permissions]:
     *   We only want to reset localPermissions when the parent deliberately
     *   changes the prop. Using object reference equality means this effect
     *   fires correctly when the parent constructs a fresh permissions object.
     */
    setLocalPermissions(permissions);
  }, [permissions]); // Run whenever the `permissions` prop reference changes

  // ── Derived Data ─────────────────────────────────────────────────────────────

  /**
   * assignedSites
   *
   * Purpose:
   *   Normalise the site assignment data from the Firestore document into
   *   a consistent array, regardless of how it was stored.
   *
   * Why two field names:
   *   Older user documents in Firestore may use the singular `assignedSite`
   *   string field. Newer documents use the plural `assignedSites` array.
   *   This guard handles both variants so the UI works for all users.
   *
   * Output:
   *   Always an Array (possibly empty) of site name strings
   */
  const assignedSites = Array.isArray(user.assignedSites)
    ? user.assignedSites          // Modern document: already an array → use directly
    : user.assignedSite
    ? [user.assignedSite]         // Legacy document: wrap the single string in an array
    : [];                         // No site data: empty array → "No Sites Assigned" badge

  // ── Internal Helpers ─────────────────────────────────────────────────────────

  /**
   * Function: updatePermissions
   *
   * Purpose:
   *   Single point of truth for mutating localPermissions. Every permission
   *   toggle (switches and checkboxes) calls this helper rather than calling
   *   setLocalPermissions and onChange separately — preventing desync bugs.
   *
   * Input:
   *   nextPermissions {Object} — the complete updated permissions object
   *
   * Output:
   *   - Updates localPermissions state (immediate UI feedback)
   *   - Calls onChange() so parent's modifiedUsers map is updated (enables Save button)
   *
   * Used In:
   *   handleCheckboxToggle(), and inline onChange handlers for the toggle switches
   */
  const updatePermissions = (nextPermissions) => {
    // Update local state first for instant visual feedback
    setLocalPermissions(nextPermissions);

    // Bubble the change to Authentication.jsx so it can track this user's diff
    onChange(nextPermissions);
  };

  // ── Event Handlers ────────────────────────────────────────────────────────────

  /**
   * Function: handleCheckboxToggle
   *
   * Purpose:
   *   Adds or removes a role ID from the canMessageRoles array when the
   *   Admin clicks a messaging permission checkbox.
   *
   * Toggle logic:
   *   - If roleId is already in the array  → filter it out (remove permission)
   *   - If roleId is NOT in the array      → spread it in (grant permission)
   *
   * Input:
   *   roleId {string} — the role identifier to add/remove (e.g. 'engineer')
   *
   * Output:
   *   Calls updatePermissions() with the new canMessageRoles array,
   *   which in turn notifies the parent.
   *
   * Used In:
   *   onChange handler for each messaging permission checkbox label
   */
  const handleCheckboxToggle = (roleId) => {
    // Determine the new canMessageRoles array based on current state
    const nextRoles = localPermissions.canMessageRoles.includes(roleId)
      ? localPermissions.canMessageRoles.filter((item) => item !== roleId) // Remove
      : [...localPermissions.canMessageRoles, roleId];                     // Add

    // Merge updated canMessageRoles into the full permissions object and propagate
    updatePermissions({
      ...localPermissions,
      canMessageRoles: nextRoles,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    /*
     * Card Container
     * Blue border on hover communicates interactivity.
     * The border transitions smoothly using Tailwind's `transition` utility.
     */
    <div className="rounded-3xl border border-slate-700 bg-slate-900/70 shadow-sm transition hover:border-blue-500">

      {/* ── Card Header (Accordion Toggle Button) ──────────────────────────── */}
      {/*
       * The entire header row is a <button> so all its content is keyboard-
       * accessible and screen-reader focusable. Clicking it calls onToggleExpand,
       * which is handled in Authentication.jsx to open/close this card.
       */}
      <button
        type="button"
        className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left"
        onClick={onToggleExpand}
      >
        {/* ── Left: Avatar + User Identity Info ─────────────────────────── */}
        <div className="flex items-center gap-4">

          {/* Avatar Circle — displays up to 2 initials derived from user.name */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-xl font-semibold text-blue-100">
            {/*
             * Avatar generation logic:
             *   1. Split name into word tokens (e.g. "John Doe" → ["John", "Doe"])
             *   2. Take the first character of each token (["J", "D"])
             *   3. Join them together ("JD")
             *   4. Uppercase the result ("JD")
             *   5. Fallback to "U" (Unknown) if name is undefined or empty
             *
             * Optional chaining (?.) on user.name guards against null/undefined
             */}
            {user.name
              ?.split(' ')
              .map((token) => token[0])
              .join('')
              .toUpperCase() || 'U'}
          </div>

          {/* Text Info Block: name badge, role badge, employee ID, site tags */}
          <div>

            {/* ── Name + Role Badge Row ──────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{user.name}</h3>

              {/*
               * Role Badge
               * Shows the human-readable role label (from ROLE_LABELS map).
               * Falls back to user.role raw string if no label mapping exists.
               */}
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            {/* ── Employee ID ────────────────────────────────────────────── */}
            {/* Em dash (—) is shown as a friendly fallback if employeeId is missing */}
            <p className="mt-1 text-sm text-slate-400">
              ID: {user.employeeId || '—'}
            </p>

            {/* ── Assigned Sites Tags ────────────────────────────────────── */}
            {/*
             * Iterates assignedSites array (normalised above).
             * Shows a pill/badge for each site, or a single "No Sites Assigned"
             * badge if the array is empty.
             */}
            <div className="mt-3 flex flex-wrap gap-2">
              {assignedSites.length > 0 ? (
                assignedSites.map((site) => (
                  <span
                    key={site}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                  >
                    {site}
                  </span>
                ))
              ) : (
                // Fallback when no sites have been assigned to this user
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  No Sites Assigned
                </span>
              )}
            </div>

          </div>
        </div>

        {/* ── Right: Unsaved Indicator + Chevron ────────────────────────────── */}
        <div className="flex items-center gap-2 text-slate-400">

          {/*
           * Amber Dot Indicator
           * Shown only when the parent reports this user has unsaved changes.
           * Gives the Admin a clear visual signal of which users need attention
           * before clicking Save.
           */}
          {hasChanges && (
            <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400" />
          )}

          {/* Chevron icon flips direction to communicate the accordion state */}
          {expanded ? <FaChevronUp /> : <FaChevronDown />}

        </div>
      </button>

      {/* ── Accordion Expanded Panel ──────────────────────────────────────────── */}
      {/*
       * Only rendered when `expanded` is true.
       * Contains all interactive permission controls for this user.
       * Using short-circuit evaluation (&&) ensures the DOM element is fully
       * unmounted when collapsed — which also resets any intermediate focus state.
       */}
      {expanded && (
        <div className="border-t border-slate-700 px-6 pb-6 pt-4">

          {/* ── Toggle Switches Grid ────────────────────────────────────────── */}
          {/* Two-column grid on medium+ screens for compact display */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* ── Toggle 1: Dashboard Access ──────────────────────────────── */}
            <div className="rounded-3xl bg-slate-950 p-4">

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Dashboard Access
                </span>

                {/*
                 * Custom Toggle Switch (CSS-only, built with Tailwind peer utilities)
                 *
                 * How it works:
                 *   - The real <input type="checkbox"> is hidden (sr-only) but still
                 *     functional and accessible to screen readers
                 *   - The first <div> renders the track (grey → blue when checked)
                 *   - The second <div> renders the thumb (translates right when checked)
                 *   - `peer` on the input makes its checked state available to
                 *     sibling elements via `peer-checked:` variants
                 *
                 * Why `sr-only` not `hidden`:
                 *   `hidden` removes the element from the accessibility tree entirely.
                 *   `sr-only` keeps it visible to screen readers for proper labelling.
                 */}
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localPermissions.canViewDashboard}
                    onChange={() =>
                      // Flip the current boolean value and propagate to parent
                      updatePermissions({
                        ...localPermissions,
                        canViewDashboard: !localPermissions.canViewDashboard,
                      })
                    }
                    className="peer sr-only"
                  />
                  {/* Toggle track: bg-slate-700 by default, bg-blue-600 when checked */}
                  <div className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-blue-600" />
                  {/* Toggle thumb: moves 5 units (translate-x-5) when checked */}
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </label>
              </div>

              {/* Contextual help text that updates to reflect the current state */}
              <p className="text-xs leading-5 text-slate-500">
                {localPermissions.canViewDashboard
                  ? 'User can access the dashboard.'
                  : 'Dashboard access is blocked.'}
              </p>
            </div>

            {/* ── Toggle 2: Chart Visibility ──────────────────────────────── */}
            {/*
             * Identical structure to the Dashboard Access toggle above.
             * Controls whether this user can see charts and analytics graphs
             * on their dashboard view.
             */}
            <div className="rounded-3xl bg-slate-950 p-4">

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Chart Visibility
                </span>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localPermissions.canViewCharts}
                    onChange={() =>
                      // Flip canViewCharts boolean while preserving all other fields
                      updatePermissions({
                        ...localPermissions,
                        canViewCharts: !localPermissions.canViewCharts,
                      })
                    }
                    className="peer sr-only"
                  />
                  {/* Track */}
                  <div className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-blue-600" />
                  {/* Thumb */}
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </label>
              </div>

              {/* Dynamic status text */}
              <p className="text-xs leading-5 text-slate-500">
                {localPermissions.canViewCharts
                  ? 'Charts are visible to this user.'
                  : 'Charts are hidden from this user.'}
              </p>
            </div>

          </div>

          {/* ── Messaging Permissions Checkbox Grid ─────────────────────────── */}
          {/*
           * Renders one checkbox per entry in the messageRoles array (passed from parent).
           * The checked state for each checkbox is determined by whether that role's ID
           * exists inside the canMessageRoles array.
           * Clicking a checkbox calls handleCheckboxToggle() to add/remove the role ID.
           */}
          <div className="mt-6 rounded-3xl bg-slate-950 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-300">
              Messaging Permissions
            </p>

            {/* Two-column grid on small+ screens for a compact, scannable layout */}
            <div className="grid gap-3 sm:grid-cols-2">
              {messageRoles.map((role) => (
                /*
                 * Wrapping in <label> makes the entire pill row clickable,
                 * not just the small checkbox input — better UX for touch/click targets.
                 */
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 transition hover:border-blue-500"
                >
                  <input
                    type="checkbox"
                    // Checked if this role.id exists anywhere in the canMessageRoles array
                    checked={localPermissions.canMessageRoles.includes(role.id)}
                    // Toggle adds or removes role.id from the array
                    onChange={() => handleCheckboxToggle(role.id)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500"
                  />
                  {/* Human-readable role label for this messaging permission */}
                  <span className="text-sm text-slate-200">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      )}
      {/* END: Accordion Expanded Panel */}

    </div>
    // END: Card Container
  );
}

// Export as default so Authentication.jsx can import using the file path
export default UserPermissionCard;
