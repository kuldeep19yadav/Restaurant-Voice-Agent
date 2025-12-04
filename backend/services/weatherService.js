const axios = require('axios');
const dayjs = require('dayjs');

const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Normalizes OpenWeatherMap weather strings into four high-level categories.
const mapWeatherToCategory = (condition = '') => {
  const value = condition.toLowerCase();
  if (value.includes('thunder')) {
    return 'thunderstorm';
  }
  if (value.includes('rain') || value.includes('drizzle')) {
    return 'rainy';
  }
  if (value.includes('cloud')) {
    return 'cloudy';
  }
  return 'sunny';
};

// Shared helper so both frontend + backend agree on seating recommendations.
const seatingFromCategory = (category) => {
  if (category === 'sunny') return 'outdoor';
  if (category === 'cloudy') return 'either';
  return 'indoor';
};

// Picks the forecast entry whose timestamp is closest to the requested date.
const pickBestForecast = (list, targetDate) => {
  if (!Array.isArray(list) || list.length === 0) return null;
  let best = list[0];
  let smallestDiff = Infinity;
  list.forEach((entry) => {
    const entryTime = dayjs(entry.dt * 1000);
    const diff = Math.abs(entryTime.diff(targetDate, 'hour', true));
    if (diff < smallestDiff) {
      smallestDiff = diff;
      best = entry;
    }
  });
  return best;
};

// Converts OpenWeatherMap payloads into the structure our Booking model stores.
const normalizeWeatherPayload = (payload, city) => {
  const weatherMain = payload?.weather?.[0]?.main || 'Clear';
  const description = payload?.weather?.[0]?.description || '';
  const category = mapWeatherToCategory(weatherMain);

  return {
    category,
    summary: description,
    temperatureC: payload?.main?.temp ?? null,
    humidity: payload?.main?.humidity ?? null,
    windKph: payload?.wind?.speed ? Number(payload.wind.speed) * 3.6 : null,
    city,
    timestamp: payload?.dt ? new Date(payload.dt * 1000) : new Date(),
    source: 'openweathermap',
    rawCondition: weatherMain,
  };
};

// Attempts to fetch 5-day forecast first, falls back to current weather if needed.
const fetchForecast = async (date, city) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENWEATHER_API_KEY is missing');
    error.statusCode = 500;
    throw error;
  }

  const targetDate = dayjs(date);
  if (!targetDate.isValid()) {
    const error = new Error('Invalid date provided for weather lookup');
    error.statusCode = 400;
    throw error;
  }

  const params = {
    q: city,
    appid: apiKey,
    units: 'metric',
  };

  try {
    const { data } = await axios.get(FORECAST_URL, { params });
    return pickBestForecast(data.list, targetDate) || null;
  } catch (error) {
    console.error('Forecast fetch failed, falling back to current weather', error.message);
    const { data } = await axios.get(CURRENT_URL, { params });
    return data;
  }
};

// Public service consumed by controllers to obtain normalized weather data.
const getWeatherForDate = async (date, city = process.env.DEFAULT_CITY || 'New York') => {
  const forecast = await fetchForecast(date, city);
  return normalizeWeatherPayload(forecast, city);
};

module.exports = {
  getWeatherForDate,
  seatingFromCategory,
};


