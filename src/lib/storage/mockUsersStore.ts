// src/lib/storage/mockUsersStore.ts

const globalForMock = globalThis as unknown as { __mockUsers: any[] | undefined };
const globalMockUsers: any[] = globalForMock.__mockUsers ?? [];
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
