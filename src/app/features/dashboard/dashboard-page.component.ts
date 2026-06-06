import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, startWith, switchMap } from 'rxjs';
import { INITIAL_WEATHER_STATE, WeatherStateService } from '../../core/services/weather-state.service';
import { AuthService } from '../../core/services/auth.service';
import { CitySuggestion } from '../../core/models/weather.models';
import { WeatherApiService } from '../../core/services/weather-api.service';

interface DashboardInsight {
  label: string;
  value: string;
  note: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly weatherStateService = inject(WeatherStateService);
  private readonly weatherApi = inject(WeatherApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cityControl = new FormControl('', { nonNullable: true });

  readonly weatherState = toSignal(this.weatherStateService.state$, {
    initialValue: INITIAL_WEATHER_STATE,
  });

  readonly currentHighlights = computed<DashboardInsight[]>(() => {
    const data = this.weatherState().data;

    if (!data) {
      return [];
    }

    return [
      {
        label: 'Feels like',
        value: `${data.current.feelsLikeCelsius.toFixed(0)}°C`,
        note: `Observed ${this.formatObservedTime(data.current.observedAt)}`,
      },
      {
        label: 'Humidity',
        value: `${data.current.humidity}%`,
        note: 'Moisture in the air right now',
      },
      {
        label: 'Wind',
        value: `${data.current.windSpeed.toFixed(1)} m/s`,
        note: 'Surface wind speed',
      },
      {
        label: 'Sun cycle',
        value: `${this.formatClockTime(data.current.sunrise)} - ${this.formatClockTime(data.current.sunset)}`,
        note: 'Local sunrise and sunset',
      },
    ];
  });

  readonly forecastHighlights = computed<DashboardInsight[]>(() => {
    const weatherState = this.weatherState();
    const data = weatherState.data;

    if (!data) {
      return [];
    }

    const forecast = data.sevenDayForecast;
    const warmestDay = forecast.reduce((warmest, day) => (day.maxCelsius > warmest.maxCelsius ? day : warmest), forecast[0]);
    const coolestDay = forecast.reduce((coolest, day) => (day.minCelsius < coolest.minCelsius ? day : coolest), forecast[0]);

    return [
      {
        label: 'Upcoming 4-day avg',
        value: `${this.upcomingAverage().toFixed(1)}°C`,
        note: 'Tomorrow through day 4',
      },
      {
        label: 'Warmest day',
        value: `${warmestDay.maxCelsius.toFixed(0)}°C`,
        note: `${warmestDay.summary} · ${this.formatForecastDate(warmestDay.date)}`,
      },
      {
        label: 'Coolest day',
        value: `${coolestDay.minCelsius.toFixed(0)}°C`,
        note: `${coolestDay.summary} · ${this.formatForecastDate(coolestDay.date)}`,
      },
      {
        label: 'Today range',
        value: `${(forecast[0].maxCelsius - forecast[0].minCelsius).toFixed(0)}°C`,
        note: `Spread between ${forecast[0].minCelsius.toFixed(0)}°C and ${forecast[0].maxCelsius.toFixed(0)}°C`,
      },
    ];
  });

  readonly citySuggestions = toSignal(
    this.cityControl.valueChanges.pipe(
      startWith(''),
      map((value) => value.trim()),
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.length < 2) {
          return of<CitySuggestion[]>([]);
        }

        return this.weatherApi.searchCities(query).pipe(catchError(() => of<CitySuggestion[]>([])));
      }),
    ),
    { initialValue: [] },
  );

  readonly upcomingAverage = computed(() => this.weatherState().data?.fourDayAverageCelsius ?? 0);

  ngOnInit(): void {
    this.weatherStateService.loadDefault().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.cityControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(500),
        distinctUntilChanged(),
        filter((value) => value.length >= 2),
        switchMap((value) => this.weatherStateService.loadByCity(value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  useCitySuggestion(suggestion: CitySuggestion): void {
    const cityLabel = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;

    this.cityControl.setValue(cityLabel, { emitEvent: false });
    this.weatherStateService.loadByCoordinates(suggestion.lat, suggestion.lon, cityLabel).subscribe();
  }

  refreshLocation(): void {
    this.weatherStateService.loadByCurrentLocation().subscribe();
  }

  retryFetch(): void {
    this.weatherStateService.retryLastFetch().subscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  trackByDate(_index: number, forecast: { date: number }): number {
    return forecast.date;
  }

  private formatClockTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private formatObservedTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private formatForecastDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}
