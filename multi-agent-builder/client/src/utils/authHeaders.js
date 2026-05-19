export function currentUserKey(user) {
  return user?.email || user?.id || null;
}

export function userHeaders(userId) {
  return userId ? { "x-user-id": userId } : {};
}
