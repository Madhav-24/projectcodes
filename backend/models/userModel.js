// Module: User Model
// Purpose: Define user entity shape and mapping boundaries.
export function mapUserRecord(record) {
  return {
    id: record.id,
    uid: record.id, // alias used by the frontend
    name: record.name,
    email: record.email,
    role: record.role,
    employeeId: record.employee_id || null,
    phoneNumber: record.phone_number || null,
    assignedSite: record.assigned_site || null,
    status: record.status || 'active',
    permissions: record.permissions || {
      canViewDashboard: true,
      canViewCharts: true,
      canMessageRoles: [],
    },
    createdAt: record.created_at || record.createdAt,
    updatedAt: record.updated_at || record.updatedAt,
  };
}
