export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  city: string;
  country: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  observedAt: number;
}

export interface DailyForecast {
  date: number;
  minCelsius: number;
  maxCelsius: number;
  avgCelsius: number;
  summary: string;
  icon: string;
  source: 'api' | 'estimated';
}

export interface DashboardWeather {
  current: CurrentWeather;
  sevenDayForecast: DailyForecast[];
  fourDayAverageCelsius: number;
}

export interface WeatherState {
  status: 'idle' | 'loading' | 'success' | 'error';
  activeCity: string;
  data: DashboardWeather | null;
  errorMessage: string | null;
}
