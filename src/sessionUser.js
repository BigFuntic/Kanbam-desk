const KEY = "user";

/**
 * Имя пользователя для этой вкладки. sessionStorage не общий между вкладками,
 * в отличие от localStorage — поэтому разные вкладки могут быть под разными аккаунтами.
 */
export function getSessionUser() {
  let user = sessionStorage.getItem(KEY);
  if (user) return user;
  const legacy = localStorage.getItem(KEY);
  if (legacy) {
    sessionStorage.setItem(KEY, legacy);
    localStorage.removeItem(KEY);
    return legacy;
  }
  return null;
}

export function setSessionUser(name) {
  sessionStorage.setItem(KEY, name);
  localStorage.removeItem(KEY);
}

export function clearSessionUser() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}
