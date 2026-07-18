const STORAGE_KEY = "mcq_app_password";

export function getStoredPassword(): string {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function setStoredPassword(password: string): void {
  sessionStorage.setItem(STORAGE_KEY, password);
}

export function clearStoredPassword(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
