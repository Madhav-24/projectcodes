# Authentication & Permissions Module - Integration Guide

## 📋 Module Overview

The Authentication & Permissions module provides a centralized control system for managing user access, visibility, and messaging permissions in the Construction AI Monitoring Web Application.

### ✅ What's Implemented

1. **Admin Control Panel** (`/admin/authentication`)
   - View all users grouped by role (Supervisors, Engineers, Project Managers)
   - Expandable user cards showing permissions
   - Real-time permission updates via Firestore

2. **Permission Types**
   - ✅ Dashboard Access (ON/OFF)
   - ✅ Chart Visibility (ON/OFF)
   - ✅ Messaging Roles (Multi-select)

3. **Core Components**
   - `AuthenticationPage.jsx` - Admin control panel
   - `UserPermissionCard.jsx` - Expandable user permission editor
   - `useAccessControl.jsx` - Permission access hook

---

## 🔧 Firestore Data Structure

When a user is created, the following structure is automatically initialized:

```javascript
users/
  uid: "user_id_123"
  name: "John Doe"
  email: "john@example.com"
  role: "supervisor"
  employeeId: "EMP001"
  phoneNumber: "+1234567890"
  assignedSite: "Site A"
  permissions: {
    canViewDashboard: true,      // Can view dashboard (admin can toggle)
    canViewCharts: true,         // Can view charts (admin can toggle)
    canMessageRoles: [           // Can message specific roles (admin can multi-select)
      "admin",
      "engineer"
    ]
  }
```

---

## 🚀 How to Use

### 1. Access the Authentication Panel (Admin Only)

1. Login as Admin
2. Click **"Authentication"** in the sidebar
3. Select a role tab (Supervisors, Engineers, Project Managers)
4. Click on any user to expand their permissions
5. Adjust permissions and click **"Save Changes"**

### 2. Check Permissions in Components

Use the `useAccessControl` hook to check user permissions:

```javascript
import { useAccessControl } from '../../hooks/useAccessControl.jsx';

function MyDashboard() {
  const { 
    canViewDashboard,           // Function
    canViewCharts,              // Function  
    canMessageRole,             // Function
    canMessageAnyRole,          // Function
    canMessageAllRoles,         // Function
    permissions,                // Object
    loading,                    // Boolean
    error                       // Error or null
  } = useAccessControl();

  if (loading) return <div>Loading permissions...</div>;

  if (!canViewDashboard()) {
    return <div>Access Restricted</div>;
  }

  return (
    <div>
      {canViewCharts() && <ChartsSection />}
      <DashboardContent />
    </div>
  );
}
```

### 3. Check Messaging Permissions

Before allowing a user to send a message:

```javascript
import { useAccessControl } from '../../hooks/useAccessControl.jsx';

function MessageComposer({ targetRole }) {
  const { canMessageRole } = useAccessControl();

  if (!canMessageRole(targetRole)) {
    return <div>You cannot message {targetRole}s</div>;
  }

  return <MessageForm />;
}

// Or check multiple roles
function MessagePicker() {
  const { canMessageAnyRole, canMessageAllRoles } = useAccessControl();

  const canMessageEngineersOrSupervisors = canMessageAnyRole(['engineer', 'supervisor']);
  const canMessageEveryone = canMessageAllRoles(['admin', 'supervisor', 'engineer', 'project_manager']);

  return (
    <div>
      {canMessageEngineersOrSupervisors && <Button>Message Team</Button>}
      {canMessageEveryone && <Button>Message All</Button>}
    </div>
  );
}
```

### 4. Get Current Permissions Object

Access the full permissions object:

```javascript
function UserInfo() {
  const { permissions } = useAccessControl();

  return (
    <div>
      <p>Dashboard: {permissions.canViewDashboard ? '✓' : '✗'}</p>
      <p>Charts: {permissions.canViewCharts ? '✓' : '✗'}</p>
      <p>Can Message: {permissions.canMessageRoles.join(', ')}</p>
    </div>
  );
}
```

---

## 📱 Example Implementation: Dashboard with Permissions

```javascript
import { useAccessControl } from '../../hooks/useAccessControl.jsx';
import SiteDashboardTemplate from '../../components/common/SiteDashboardTemplate.jsx';

function SupervisorDashboard() {
  const { 
    canViewDashboard,
    canViewCharts,
    assignedSites,
    canViewAllSites
  } = useAccessControl();

  // Check if user has dashboard access
  if (!canViewDashboard()) {
    return (
      <div className="p-8 bg-red-500/20 border border-red-500 rounded">
        <h2>Access Restricted</h2>
        <p>Your dashboard access has been disabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Workers" value={12} />
        <KpiCard title="Progress" value="75%" />
        <KpiCard title="Issues" value={3} accent="bg-danger" />
        <KpiCard title="Status" value="Active" accent="bg-success" />
      </div>

      {/* Only show charts if user has permission */}
      {canViewCharts() && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <BudgetBurnChart />
          <PlannedVsActualChart />
        </div>
      )}

      <SiteDashboardTemplate site={siteData} />
    </div>
  );
}
```

---

## 📧 Example Implementation: Messaging Permissions

```javascript
import { useAccessControl } from '../../hooks/useAccessControl.jsx';

function MessageThreadList() {
  const { canMessageRole, canMessageAnyRole } = useAccessControl();

  const threads = [
    { id: 1, name: 'Admin', role: 'admin' },
    { id: 2, name: 'Supervisor', role: 'supervisor' },
    { id: 3, name: 'Engineer', role: 'engineer' },
  ];

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <div key={thread.id}>
          {canMessageRole(thread.role) ? (
            <button className="text-blue-500">
              Message {thread.name}
            </button>
          ) : (
            <span className="text-gray-400">
              Cannot message {thread.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SendMessage({ recipientRole }) {
  const { canMessageRole } = useAccessControl();

  if (!canMessageRole(recipientRole)) {
    return <div>You don't have permission to message this role</div>;
  }

  return <MessageForm />;
}
```

---

## 🔄 Real-Time Permission Updates

Permissions are fetched real-time using Firestore `onSnapshot()`:

- **When user logs in**: Permissions are automatically loaded
- **When admin updates permissions**: Changes reflect immediately via Firestore listener
- **No page refresh needed**: Real-time updates in all components using the hook

---

## 📚 API Reference

### `useAccessControl(userId?: string)`

Custom hook for accessing user permissions.

**Parameters:**
- `userId` (optional): Specific user ID to fetch permissions for. If not provided, uses current logged-in user.

**Returns:**

```javascript
{
  // Permissions-based access
  permissions: {
    canViewDashboard: boolean,
    canViewCharts: boolean,
    canMessageRoles: string[]
  },
  loading: boolean,
  error: Error | null,
  
  // Helper functions for permissions
  canViewDashboard(): boolean,
  canViewCharts(): boolean,
  canMessageRole(roleId: string): boolean,
  canMessageAnyRole(roleIds: string[]): boolean,
  canMessageAllRoles(roleIds: string[]): boolean,
  
  // Site-based access (for existing dashboards)
  assignedSites: string[],
  canViewAllSites: boolean,
  canEditDashboard: boolean
}
```

---

## 🔐 Security Notes

1. **Permission checks are enforced on the frontend** - Always validate permissions on the backend when handling sensitive operations
2. **Firestore security rules** should restrict direct updates to permissions field
3. **Admin-only operations** are validated by RoleRoute component
4. **Permission changes are logged** in Firestore for audit purposes

---

## 📝 Next Steps

### Phase 2: Advanced Features
- [ ] Permission groups (e.g., "Full Access", "Limited View")
- [ ] Time-based permissions (access expires at certain date)
- [ ] Department-based permissions
- [ ] Audit logging for permission changes

### Phase 3: Backend Validation
- [ ] Add Firestore security rules
- [ ] Backend permission validation for API calls
- [ ] Permission caching strategy

---

## 📞 Support

For questions about implementing permissions:
1. Check the component examples above
2. Review the hook documentation
3. Test in the admin Authentication panel

---

**Last Updated:** April 13, 2026  
**Version:** 1.0.0
