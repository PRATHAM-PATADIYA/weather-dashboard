import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WeatherApiService } from './weather-api.service';
import { WeatherStateService } from './weather-state.service';

describe('WeatherStateService', () => {
  const apiMock = {
    searchCities: vi.fn(),
    getCurrentByCoordinates: vi.fn(),
    getSevenDayForecast: vi.fn(),
  };

  let service: WeatherStateService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: WeatherApiService, useValue: apiMock }],
    });

    service = TestBed.inject(WeatherStateService);
  });

  it('loads weather by city and computes upcoming 4-day average', async () => {
    apiMock.searchCities.mockReturnValue(of([{ name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59 }]));
    apiMock.getCurrentByCoordinates.mockReturnValue(
      of({
        city: 'Bengaluru',
        country: 'IN',
        temperatureCelsius: 30,
        feelsLikeCelsius: 33,
        humidity: 50,
        windSpeed: 2,
        description: 'clear',
        icon: '01d',
        sunrise: 1,
        sunset: 2,
        observedAt: 3,
      }),
    );
    apiMock.getSevenDayForecast.mockReturnValue(
      of([
        { date: 1, minCelsius: 20, maxCelsius: 30, avgCelsius: 25, summary: 'a', icon: '01d', source: 'api' },
        { date: 2, minCelsius: 21, maxCelsius: 31, avgCelsius: 26, summary: 'b', icon: '01d', source: 'api' },
        { date: 3, minCelsius: 22, maxCelsius: 32, avgCelsius: 27, summary: 'c', icon: '01d', source: 'api' },
        { date: 4, minCelsius: 23, maxCelsius: 33, avgCelsius: 28, summary: 'd', icon: '01d', source: 'api' },
        { date: 5, minCelsius: 24, maxCelsius: 34, avgCelsius: 29, summary: 'e', icon: '01d', source: 'api' },
        { date: 6, minCelsius: 25, maxCelsius: 35, avgCelsius: 30, summary: 'f', icon: '01d', source: 'api' },
        { date: 7, minCelsius: 26, maxCelsius: 36, avgCelsius: 31, summary: 'g', icon: '01d', source: 'api' },
      ]),
    );

    const result = await service.loadByCity('Bengaluru').toPromise();

    expect(result?.status).toBe('success');
    expect(result?.data?.fourDayAverageCelsius).toBe(27.5);
    expect(apiMock.searchCities).toHaveBeenCalledWith('Bengaluru');
  });

  it('sets error state when city lookup fails', async () => {
    apiMock.searchCities.mockReturnValue(throwError(() => new Error('Network down')));

    const result = await service.loadByCity('Bengaluru').toPromise();

    expect(result?.status).toBe('error');
    expect(result?.errorMessage).toContain('Network down');
  });
});
