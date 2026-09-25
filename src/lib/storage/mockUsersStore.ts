// src/lib/storage/mockUsersStore.ts

const DEFAULT_MOCK_USERS = [
  {
    id: 'mock-1790249917377',
    fullName: 'Mohamed Waseem',
    email: 'waseem@pentacloudconsulting.com',
    role: 'MANAGER',
    status: 'ACTIVE',
    workspacePermissions: [{ workspaceType: 'SFMC' }, { workspaceType: 'SALES_CLOUD' }],
  },
  {
    id: 'mock-1790236181574',
    fullName: 'Zuhaib',
    email: 'zuhaib@pentacloud.com',
    role: 'AGENT',
    status: 'ACTIVE',
    workspacePermissions: [{ workspaceType: 'SFMC' }, { workspaceType: 'SALES_CLOUD' }],
  }
];

const globalForMock = globalThis as unknown as { __mockUsers: any[] | undefined };
const globalMockUsers: any[] = globalForMock.__mockUsers ?? [...DEFAULT_MOCK_USERS];
if (process.env.NODE_ENV !== 'production') globalForMock.__mockUsers = globalMockUsers;

export function getMockUsers() {
  return globalMockUsers;
}

export function addMockUser(user: any) {
  globalMockUsers.push(user);
}

export function updateMockUser(userId: string, updates: any) {
  const user = globalMockUsers.find(u => u.id === userId);
  if (user) {
    Object.assign(user, updates);
  }
}

export function deleteMockUser(userId: string) {
  const index = globalMockUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    globalMockUsers.splice(index, 1);
  }
}
