# 🔐 Authentication & Permissions Module - Quick Start

## ⚡ Quick Access

👉 **Admin Panel:** Login as Admin → Click "Authentication" in sidebar  
👉 **Integration Guide:** Read [AUTHENTICATION_PERMISSIONS_GUIDE.md](AUTHENTICATION_PERMISSIONS_GUIDE.md)  
👉 **Implementation Details:** See [authentication-permissions-implementation.md](memories/session/authentication-permissions-implementation.md)

---

## 🎯 What You Can Do Now

### As an Admin:

1. **View all users** grouped by role
2. **Manage Dashboard Access** - Toggle whether users can view dashboards
3. **Control Chart Visibility** - Toggle whether users see analytics charts
4. **Set Messaging Permissions** - Select which roles each user can message

### As a Developer:

```javascript
// In any component - check if user has dashboard access
import { useAccessControl } from '../../hooks/useAccessControl.jsx';

function MyComponent() {
  const { canViewDashboard, canViewCharts, canMessageRole } = useAccessControl();

  if (!canViewDashboard()) return <AccessDenied />;
  
  return (
    <div>
      {canViewCharts() && <AnalyticsSection />}
      {canMessageRole('admin') && <MessageAdmin />}
    </div>
  );
}
```

---

## 📁 File Structure

```
src/
├─ pages/admin/
│  └─ AuthenticationPage.jsx ← Main control panel
├─ components/cards/
│  └─ UserPermissionCard.jsx ← Permission editor per user
├─ hooks/
│  └─ useAccessControl.jsx ← Permission checking hook
├─ context/
│  └─ AuthContext.jsx ← Updated with default permissions
├─ components/layout/
│  └─ Sidebar.jsx ← Updated with Authentication menu
└─ routes/
   └─ AppRoutes.jsx ← Updated with /admin/authentication route

Documentation:
├─ AUTHENTICATION_PERMISSIONS_GUIDE.md ← Full integration guide
└─ memories/session/authentication-permissions-implementation.md ← Details
```

---

## 🚀 Getting Started (3 Steps)

### Step 1: Navigate to Authentication Panel
```
1. Login as Admin (admin@gmail.com / Admin@1234)
2. Look for "Authentication" in the sidebar (between Site Allocation & Settings)
3. Click to open the control panel
```

### Step 2: Select Users by Role
```
1. Click on a role tab: "Supervisors", "Engineers", or "Project Managers"
2. See list of users in that role
```

### Step 3: Edit User Permissions
```
1. Click on any user card to expand
2. Toggle: Dashboard Access ✓/✗
3. Toggle: Chart Visibility ✓/✗
4. Check/uncheck: Messaging roles
5. Click "Save Changes"
6. See confirmation toast
```

---

## 💡 Common Use Cases

### Block User from Dashboard
```javascript
// In Dashboard component
const { canViewDashboard } = useAccessControl();

if (!canViewDashboard()) {
  return <h2>Access Restricted - Please contact admin</h2>;
}
```

### Show Charts Only to Certain Roles
```javascript
{canViewCharts() && (
  <ChartSection>
    <BudgetBurnChart />
    <ProductivityChart />
  </ChartSection>
)}
```

### Validate Message Recipients
```javascript
function SendMessage({ targetRole }) {
  const { canMessageRole } = useAccessControl();

  if (!canMessageRole(targetRole)) {
    return <div>You don't have permission to message {targetRole}s</div>;
  }

  return <MessageComposer />;
}
```

### Check Multiple Permissions
```javascript
// Can message at least one of these roles
const { canMessageAnyRole } = useAccessControl();
if (canMessageAnyRole(['admin', 'supervisor'])) {
  // Show button
}

// Can message all these roles
const { canMessageAllRoles } = useAccessControl();
if (canMessageAllRoles(['supervisor', 'engineer'])) {
  // Show bulk message button
}
```

---

## 📊 Permission Data Format

When a user is created, they get these default permissions:

```javascript
permissions: {
  canViewDashboard: true,        // Can see the dashboard (admin can disable)
  canViewCharts: true,           // Can see analytics (admin can disable)
  canMessageRoles: [             // Can message these roles (admin can customize)
    'admin',
    'supervisor', 
    'engineer',
    'project_manager'
  ]
}
```

---

## 🔄 Real-Time Updates

- **Changes are instant** - No page refresh needed
- **Uses Firestore listeners** - Updates broadcast to all sessions
- **Automatic sync** - When any user changes permissions, all other users see it
- **Unsaved indicator** - Yellow dot shows if you have unsaved changes

---

## 🧪 Test It Now

1. Open Authentication panel
2. Click on a user → Expand
3. Uncheck "Can View Dashboard"
4. Click "Save Changes"
5. If that user is logged in → They'll see access restricted message
6. Log back in as that user to see the effect

---

## 📚 API Quick Reference

### `useAccessControl(userId?: string)`

**Returns:**
```javascript
{
  // Permission functions (use these!)
  canViewDashboard(): boolean,
  canViewCharts(): boolean,
  canMessageRole(roleId): boolean,
  canMessageAnyRole(roleIds): boolean,
  canMessageAllRoles(roleIds): boolean,

  // Permission object (use if you need it)
  permissions: {
    canViewDashboard: boolean,
    canViewCharts: boolean,
    canMessageRoles: string[]
  },

  // State
  loading: boolean,
  error: Error | null,

  // Legacy (for existing dashboards)
  assignedSites: string[],
  canViewAllSites: boolean,
  canEditDashboard: boolean
}
```

---

## ⚠️ Important Notes

1. **Frontend only** - Always validate permissions on backend for sensitive operations
2. **Default access** - New users get full permissions by default (admins can restrict)
3. **Real-time** - Permissions update via Firestore listeners
4. **Role-based defaults** - Site assignment rules still apply (Engineers/Supervisors need sites)
5. **Admin can override** - Admins can change permissions for any role

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see Authentication menu | Make sure you're logged in as Admin |
| Users not showing in tab | Check the role assignment in SettingsPage |
| Permissions not updating | Check browser console for errors; refresh page |
| Save button doesn't appear | Make sure you changed something |

---

## 📖 Full Documentation

For complete API reference, examples, and implementation patterns:  
👉 See **[AUTHENTICATION_PERMISSIONS_GUIDE.md](AUTHENTICATION_PERMISSIONS_GUIDE.md)**

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** April 13, 2026
