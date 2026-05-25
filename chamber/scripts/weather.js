// weather.js
// Fetches current weather and 3-day forecast for Kampala, Uganda
// from the OpenWeatherMap API.
//


const API_KEY = '5e5589389aa7fb47ce206b19494eedec';
const LAT     = 0.3476;
const LON     = 32.5825;
const UNITS   = 'metric';

const BASE    = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const tempEl        = document.getElementById('weather-temp');
const descEl        = document.getElementById('weather-desc');
const iconEl        = document.getElementById('weather-icon');
const humidityEl    = document.getElementById('weather-humidity');
const forecastEl    = document.getElementById('weather-forecast');

// Day name helper
function dayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-UG', { weekday: 'long' });
}

// Fetch current weather
async function fetchCurrentWeather() {
  const url = `${BASE}/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${UNITS}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

// Fetch 5-day / 3-hour forecast, then pick one reading per day
async function fetchForecast() {
  const url = `${BASE}/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${UNITS}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Forecast API error: ${res.status}`);
  const data = await res.json();

  // Group by calendar date and take the midday (12:00) reading
  const days = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    const time = item.dt_txt.split(' ')[1];
    if (!days[date] || time === '12:00:00') {
      days[date] = item;
    }
  });

  // Skip today, return next 3 days
  const today = new Date().toISOString().split('T')[0];
  return Object.entries(days)
    .filter(([date]) => date > today)
    .slice(0, 3)
    .map(([, item]) => item);
}

// Render current weather into the page
function renderCurrent(data) {
  const temp    = Math.round(data.main.temp);
  const desc    = data.weather[0].description;
  const icon    = data.weather[0].icon;
  const humidity = data.main.humidity;

  if (tempEl)     tempEl.textContent     = `${temp}°C`;
  if (descEl)     descEl.textContent     = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (humidityEl) humidityEl.textContent = `Humidity: ${humidity}%`;
  if (iconEl) {
    iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    iconEl.alt = desc;
  }
}

// Render 3-day forecast into the page
function renderForecast(days) {
  if (!forecastEl) return;
  // Find or create a container div inside the section for forecast cards
  let container = forecastEl.querySelector('.forecast-cards');
  if (!container) {
    container = document.createElement('div');
    container.className = 'forecast-cards';
    forecastEl.appendChild(container);
  }
  container.innerHTML = '';
  
  days.forEach(day => {
    const high = Math.round(day.main.temp_max);
    const low  = Math.round(day.main.temp_min);
    const name = dayName(day.dt_txt);
    const icon = day.weather[0].icon;
    const desc = day.weather[0].description;

    const card = document.createElement('div');
    card.classList.add('forecast-day');
    card.innerHTML = `
      <p class="forecast-name">${name}</p>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" width="40" height="40">
      <p class="forecast-temp"><strong>${high}°</strong> / ${low}°</p>
    `;
    container.appendChild(card);
  });
}

// Show a friendly error if API key is missing or request fails
function showWeatherError(msg) {
  const section = document.getElementById('weather-section');
  if (section) {
    section.innerHTML = `
      <h2>Current Weather</h2>
      <p class="weather-error">${msg}</p>
    `;
  }
}

// Main entry point
async function loadWeather() {
  if (API_KEY === '5e5589389aa7fb47ce206b19494eedec') {
    showWeatherError('Add your OpenWeatherMap API key to scripts/weather.js to enable live weather.');
    return;
  }
  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(),
      fetchForecast()
    ]);
    renderCurrent(current);
    renderForecast(forecast);
  } catch (err) {
    console.error('Weather load failed:', err);
    showWeatherError('Weather data could not be loaded. Check your API key and connection.');
  }
}

loadWeather();