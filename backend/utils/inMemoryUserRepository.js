// Module: In-Memory User Repository
// Purpose: Provide a swappable data source for local development and tests.
const mockUsers = [
  {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@gmail.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function createInMemoryUserRepository() {
  async function findAll() {
    return [...mockUsers];
  }

  async function findById(userId) {
    return mockUsers.find((user) => user.id === userId) || null;
  }

  return {
    findAll,
    findById,
  };
}
