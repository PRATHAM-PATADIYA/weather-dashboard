import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('logs user in when username and password are valid', () => {
    const loggedIn = service.login('demo-user', '123456');

    expect(loggedIn).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getUsername()).toBe('demo-user');
  });

  it('rejects login when credentials are invalid', () => {
    const loggedIn = service.login('  ', '  ');

    expect(loggedIn).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logs user out', () => {
    service.login('demo-user', '123456');
    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getUsername()).toBe('');
  });
});
