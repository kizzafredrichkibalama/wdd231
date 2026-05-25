// weather.js
// Fetches current weather and 8-day forecast for Kampala, Uganda
// using OpenWeatherMap One Call API 3.0

const API_KEY = 'bd2d1e2f43825b995d228940e01fb671';
const LAT     = 0.3476;   // Kampala latitude
const LON     = 32.5825;  // Kampala longitude
const UNITS   = 'metric'; // Celsius

const BASE    = 'https://api.openweathermap.org/data/3.0/onecall';

// DOM elements
const tempEl        = document.getElementById('weather-temp');
const descEl        = document.getElementById('weather-desc');
const iconEl        = document.getElementById('weather-icon');
const humidityEl    = document.getElementById('weather-humidity');
const forecastEl    = document.getElementById('weather-forecast');

// Day name helper
function dayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-UG', { weekday: 'short' }).slice(0, 3);
}

// Fetch everything in one call from One Call API 3.0
async function fetchWeatherData() {
  const url = `${BASE}?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${UNITS}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorCode = res.status;
    if (errorCode === 401) {
      throw new Error('Invalid API key');
    } else if (errorCode === 429) {
      throw new Error('API rate limit exceeded');
    } else {
      throw new Error(`Weather API error: ${errorCode}`);
    }
  }
  
  return res.json();
}

// Render current weather
function renderCurrent(data) {
  const temp    = Math.round(data.current.temp);
  const desc    = data.current.weather[0].description;
  const icon    = data.current.weather[0].icon;
  const humidity = data.current.humidity;

  if (tempEl)     tempEl.textContent     = `${temp}°C`;
  if (descEl)     descEl.textContent     = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (humidityEl) humidityEl.textContent = `Humidity: ${humidity}%`;
  if (iconEl) {
    iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    iconEl.alt = desc;
  }
}

// Render 3-day forecast
function renderForecast(data) {
  if (!forecastEl) return;
  
  // Create forecast cards container if it doesn't exist
  let container = forecastEl.querySelector('.forecast-cards');
  if (!container) {
    container = document.createElement('div');
    container.className = 'forecast-cards';
    forecastEl.appendChild(container);
  }
  container.innerHTML = '';
  
  // Take the next 3 days from the daily forecast
  data.daily.slice(1, 4).forEach(day => {
    const high = Math.round(day.temp.max);
    const low  = Math.round(day.temp.min);
    const date = new Date(day.dt * 1000); // Convert Unix timestamp to JS date
    const name = dayName(date.toISOString());
    const icon = day.weather[0].icon;
    const desc = day.weather[0].description;

    const card = document.createElement('div');
    card.classList.add('forecast-day');
    card.innerHTML = `
      <p class="forecast-name">${name}</p>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" width="40" height="40" loading="lazy">
      <p class="forecast-temp"><strong>${high}°</strong> / ${low}°</p>
    `;
    container.appendChild(card);
  });
}

// Show error message
function showWeatherError(msg) {
  const section = document.getElementById('weather-section');
  if (section) {
    section.innerHTML = `
      <h2>Current Weather</h2>
      <p class="weather-error">${msg}</p>
    `;
  }
}

// Main function
async function loadWeather() {
  try {
    const data = await fetchWeatherData();
    renderCurrent(data);
    renderForecast(data);
  } catch (err) {
    console.error('Weather load failed:', err);
    if (err.message.includes('Invalid API key')) {
      showWeatherError('Invalid API key. Please check your OpenWeatherMap key.');
    } else if (err.message.includes('rate limit')) {
      showWeatherError('API rate limit reached. Try again in a moment.');
    } else {
      showWeatherError('Weather data could not be loaded. Please try again later.');
    }
  }
}

// Load when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadWeather);
} else {
  loadWeather();
}