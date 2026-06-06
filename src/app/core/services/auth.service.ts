import { Injectable } from '@angular/core';

const AUTH_STORAGE_KEY = 'weather-dashboard-auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  login(username: string, password: string): boolean {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      return false;
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: crypto.randomUUID(),
        username: normalizedUsername,
        loggedInAt: Date.now(),
      }),
    );

    return true;
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  }

  getUsername(): string {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) {
      return '';
    }

    try {
      const parsed = JSON.parse(rawValue) as { username?: string };
      return parsed.username ?? '';
    } catch {
      return '';
    }
  }
}
