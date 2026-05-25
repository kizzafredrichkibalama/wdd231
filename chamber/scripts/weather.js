// weather.js - Kampala weather using OpenWeatherMap free tier API
const API_KEY = 'bd2d1e2f43825b995d228940e01fb671';
const LAT     = 0.3476;
const LON     = 32.5825;
const UNITS   = 'metric';

// DOM elements
const tempEl        = document.getElementById('weather-temp');
const descEl        = document.getElementById('weather-desc');
const iconEl        = document.getElementById('weather-icon');
const humidityEl    = document.getElementById('weather-humidity');
const forecastEl    = document.getElementById('weather-forecast');

console.log('Weather script loaded. Elements found:', {
  temp: !!tempEl,
  desc: !!descEl,
  icon: !!iconEl,
  humidity: !!humidityEl,
  forecast: !!forecastEl
});

async function getWeather() {
  try {
    console.log('Fetching weather for Kampala...');
    
    // Fetch current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=${UNITS}&appid=${API_KEY}`;
    console.log('Current weather URL:', currentUrl);
    
    const currentRes = await fetch(currentUrl);
    if (!currentRes.ok) throw new Error(`Current weather failed: ${currentRes.status}`);
    const current = await currentRes.json();
    console.log('Current weather data:', current);
    
    // Fetch forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=${UNITS}&appid=${API_KEY}`;
    console.log('Forecast URL:', forecastUrl);
    
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`Forecast failed: ${forecastRes.status}`);
    const forecast = await forecastRes.json();
    console.log('Forecast data:', forecast);
    
    // Render current
    if (tempEl) tempEl.textContent = Math.round(current.main.temp) + '°C';
    if (descEl) descEl.textContent = current.weather[0].description;
    if (humidityEl) humidityEl.textContent = 'Humidity: ' + current.main.humidity + '%';
    if (iconEl) {
      iconEl.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
      iconEl.alt = current.weather[0].description;
    }
    console.log('Rendered current weather');
    
    // Render forecast - get next 3 days (one per day at 12:00)
    if (forecastEl) {
      let container = forecastEl.querySelector('.forecast-cards');
      if (!container) {
        container = document.createElement('div');
        container.className = 'forecast-cards';
        forecastEl.appendChild(container);
      }
      container.innerHTML = '';
      
      // Group by date and get midday reading
      const byDate = {};
      forecast.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        const time = item.dt_txt.split(' ')[1];
        if (!byDate[date] || time === '12:00:00') {
          byDate[date] = item;
        }
      });
      
      // Skip today, get next 3 days
      const today = new Date().toISOString().split('T')[0];
      const upcomingDays = Object.entries(byDate)
        .filter(([date]) => date > today)
        .slice(0, 3);
      
      console.log('Forecast days to render:', upcomingDays.length);
      
      upcomingDays.forEach(([date, item]) => {
        const dayName = new Date(date).toLocaleDateString('en-UG', { weekday: 'short' });
        const card = document.createElement('div');
        card.className = 'forecast-day';
        card.innerHTML = `
          <p class="forecast-name">${dayName}</p>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" width="40" height="40" loading="lazy">
          <p class="forecast-temp"><strong>${Math.round(item.main.temp_max)}°</strong> / ${Math.round(item.main.temp_min)}°</p>
        `;
        container.appendChild(card);
      });
      console.log('Rendered forecast cards');
    }
    
  } catch (error) {
    console.error('WEATHER ERROR:', error);
    const section = document.getElementById('weather-section');
    if (section) {
      section.innerHTML = `
        <h2>Current Weather</h2>
        <p class="weather-error">Error: ${error.message}</p>
      `;
    }
  }
}

// Run when page loads
window.addEventListener('load', () => {
  console.log('Page loaded, fetching weather...');
  getWeather();
});

// Also try immediately in case load fires before script
if (document.readyState === 'complete') {
  console.log('Page already loaded, fetching weather...');
  getWeather();
}