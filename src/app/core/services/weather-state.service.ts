import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { DashboardWeather, WeatherState } from '../models/weather.models';
import { WeatherApiService } from './weather-api.service';

export const INITIAL_WEATHER_STATE: WeatherState = {
  status: 'idle',
  activeCity: 'Bangalore',
  data: null,
  errorMessage: null,
};

@Injectable({
  providedIn: 'root',
})
export class WeatherStateService {
  private readonly stateSubject = new BehaviorSubject<WeatherState>(INITIAL_WEATHER_STATE);
  private activeCoordinates: { lat: number; lon: number } | null = null;

  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly weatherApi: WeatherApiService) {}

  loadDefault(): Observable<WeatherState> {
    return this.loadByCity('Bangalore');
  }

  loadByCity(city: string): Observable<WeatherState> {
    this.patchState({ status: 'loading', errorMessage: null, activeCity: city });

    return this.weatherApi.searchCities(city).pipe(
      map((cities) => cities[0]),
      switchMap((cityData) => {
        if (!cityData) {
          throw new Error('No matching city found. Try a different search term.');
        }

        const activeCity = cityData.state
          ? `${cityData.name}, ${cityData.state}, ${cityData.country}`
          : `${cityData.name}, ${cityData.country}`;

        return this.loadByCoordinates(cityData.lat, cityData.lon, activeCity);
      }),
    );
  }

  loadByCoordinates(lat: number, lon: number, activeCity = ''): Observable<WeatherState> {
    this.patchState({ status: 'loading', errorMessage: null, activeCity: activeCity || this.stateSubject.value.activeCity });
    this.activeCoordinates = { lat, lon };

    return this.loadWeatherBundle(lat, lon).pipe(
      map(({ current, forecast }) => this.toDashboardWeather(current, forecast)),
      tap((data) => {
        this.patchState({
          status: 'success',
          data,
          errorMessage: null,
          activeCity: `${data.current.city}, ${data.current.country}`,
        });
      }),
      map(() => this.stateSubject.value),
      catchError((error: Error) => {
        this.patchState({
          status: 'error',
          errorMessage: error.message || 'Unable to fetch weather right now.',
        });

        return of(this.stateSubject.value);
      }),
    );
  }

  loadByCurrentLocation(defaultCity = 'Bangalore'): Observable<WeatherState> {
    if (!navigator.geolocation) {
      return this.loadByCity(defaultCity);
    }

    this.patchState({ status: 'loading', errorMessage: null });

    return from(
      new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 120000 },
        );
      }),
    ).pipe(
      switchMap((coords) => this.loadByCoordinates(coords.latitude, coords.longitude)),
      catchError(() => this.loadByCity(defaultCity)),
    );
  }

  retryLastFetch(): Observable<WeatherState> {
    const { activeCity } = this.stateSubject.value;

    if (this.activeCoordinates) {
      return this.loadByCoordinates(this.activeCoordinates.lat, this.activeCoordinates.lon, activeCity);
    }

    return this.loadByCity(activeCity || 'Bangalore');
  }

  private loadWeatherBundle(
    lat: number,
    lon: number,
  ): Observable<{ current: DashboardWeather['current']; forecast: DashboardWeather['sevenDayForecast'] }> {
    return forkJoin({
      current: this.weatherApi.getCurrentByCoordinates(lat, lon),
      forecast: this.weatherApi.getSevenDayForecast(lat, lon),
    });
  }

  private toDashboardWeather(current: DashboardWeather['current'], forecast: DashboardWeather['sevenDayForecast']): DashboardWeather {
    const nextFourDays = forecast.slice(1, 5);
    const total = nextFourDays.reduce((sum, day) => sum + day.avgCelsius, 0);
    const fourDayAverageCelsius = nextFourDays.length ? total / nextFourDays.length : forecast[0]?.avgCelsius ?? 0;

    return {
      current,
      sevenDayForecast: forecast,
      fourDayAverageCelsius,
    };
  }

  private patchState(patch: Partial<WeatherState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
