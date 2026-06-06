import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CitySuggestion, CurrentWeather, DailyForecast } from '../models/weather.models';

interface GeocodeResponse {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

interface CurrentWeatherResponse {
  name: string;
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    temp: {
      day?: number;
      min: number;
      max: number;
      feels_like?: number;
      temp?: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
  }>;
  city: {
    timezone: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WeatherApiService {
  private readonly apiKey = environment.openWeatherApiKey;
  private readonly baseUrl = environment.openWeatherBaseUrl;

  constructor(private readonly http: HttpClient) {}

  searchCities(query: string): Observable<CitySuggestion[]> {
    return this.http
      .get<GeocodeResponse[]>(`${this.baseUrl}/geo/1.0/direct`, {
        params: this.withKey({ q: query, limit: 5 }),
      })
      .pipe(
        map((cities) =>
          cities.map((city) => ({
            name: city.name,
            country: city.country,
            state: city.state,
            lat: city.lat,
            lon: city.lon,
          })),
        ),
      );
  }

  getCurrentByCity(city: string): Observable<CurrentWeather> {
    return this.http
      .get<CurrentWeatherResponse>(`${this.baseUrl}/data/2.5/weather`, {
        params: this.withKey({ q: city, units: 'metric' }),
      })
      .pipe(map((response) => this.toCurrentWeather(response)));
  }

  getCurrentByCoordinates(lat: number, lon: number): Observable<CurrentWeather> {
    return this.http
      .get<CurrentWeatherResponse>(`${this.baseUrl}/data/2.5/weather`, {
        params: this.withKey({ lat, lon, units: 'metric' }),
      })
      .pipe(map((response) => this.toCurrentWeather(response)));
  }

  getSevenDayForecast(lat: number, lon: number): Observable<DailyForecast[]> {
    return this.http
      .get<ForecastResponse>(`${this.baseUrl}/data/2.5/forecast`, {
        params: this.withKey({ lat, lon, units: 'metric' }),
      })
      .pipe(
        map((response) => this.toDailyForecasts(response)),
      );
  }

  private toCurrentWeather(response: CurrentWeatherResponse): CurrentWeather {
    return {
      city: response.name,
      country: response.sys.country,
      temperatureCelsius: response.main.temp,
      feelsLikeCelsius: response.main.feels_like,
      humidity: response.main.humidity,
      windSpeed: response.wind.speed,
      description: response.weather[0]?.description ?? 'Unknown',
      icon: response.weather[0]?.icon ?? '01d',
      sunrise: response.sys.sunrise,
      sunset: response.sys.sunset,
      observedAt: response.dt,
    };
  }

  private toDailyForecasts(response: ForecastResponse): DailyForecast[] {
    const timezoneOffset = response.city.timezone ?? 0;
    const groupedByDay = new Map<
      string,
      {
        date: number;
        minCelsius: number;
        maxCelsius: number;
        totalTemp: number;
        count: number;
        summary: string;
        icon: string;
      }
    >();

    response.list.forEach((entry) => {
      const localTimestamp = entry.dt + timezoneOffset;
      const dayKey = new Date(localTimestamp * 1000).toISOString().slice(0, 10);
      const current = groupedByDay.get(dayKey);
      const temperature = entry.temp.day ?? entry.temp.temp ?? (entry.temp.min + entry.temp.max) / 2;
      const weather = entry.weather[0];

      if (!current) {
        groupedByDay.set(dayKey, {
          date: entry.dt,
          minCelsius: entry.temp.min,
          maxCelsius: entry.temp.max,
          totalTemp: temperature,
          count: 1,
          summary: weather?.description ?? 'Clear',
          icon: weather?.icon ?? '01d',
        });
        return;
      }

      current.date = Math.min(current.date, entry.dt);
      current.minCelsius = Math.min(current.minCelsius, entry.temp.min);
      current.maxCelsius = Math.max(current.maxCelsius, entry.temp.max);
      current.totalTemp += temperature;
      current.count += 1;

      if (weather) {
        current.summary = weather.description;
        current.icon = weather.icon;
      }
    });

    return [...groupedByDay.values()].slice(0, 5).map((day) => ({
      date: day.date,
      minCelsius: day.minCelsius,
      maxCelsius: day.maxCelsius,
      avgCelsius: day.totalTemp / day.count,
      summary: day.summary,
      icon: day.icon,
      source: 'api',
    }));
  }

  private withKey(params: Record<string, string | number>): HttpParams {
    if (!this.apiKey || this.apiKey === 'REPLACE_WITH_OPENWEATHER_API_KEY') {
      throw new Error('OpenWeather API key is missing. Update environment.openWeatherApiKey.');
    }

    let httpParams = new HttpParams().set('appid', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
