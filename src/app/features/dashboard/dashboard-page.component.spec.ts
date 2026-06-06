import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { INITIAL_WEATHER_STATE } from '../../core/services/weather-state.service';
import { AuthService } from '../../core/services/auth.service';
import { WeatherApiService } from '../../core/services/weather-api.service';
import { WeatherStateService } from '../../core/services/weather-state.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  const weatherStateMock = {
    state$: of({ ...INITIAL_WEATHER_STATE, status: 'error', errorMessage: 'Failed request', data: null }),
    loadByCurrentLocation: vi.fn(() => of(INITIAL_WEATHER_STATE)),
    loadByCity: vi.fn(() => of(INITIAL_WEATHER_STATE)),
    retryLastFetch: vi.fn(() => of(INITIAL_WEATHER_STATE)),
  };

  const weatherApiMock = {
    searchCities: vi.fn(() => of([])),
  };

  const authMock = {
    logout: vi.fn(),
  };

  const routerMock = {
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: WeatherStateService, useValue: weatherStateMock },
        { provide: WeatherApiService, useValue: weatherApiMock },
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('shows retry button when state is error', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Retry');
  });

  it('logs out and redirects', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;

    component.logout();

    expect(authMock.logout).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
