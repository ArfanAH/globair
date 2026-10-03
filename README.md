# GLOBAIR 🌍

### Global Air Quality Visualization

GLOBAIR is an interactive 3D globe that visualizes real-time air-quality information for cities around the world.

Users can explore the globe, search for cities, select locations, and view current air-quality data including US AQI, PM2.5, PM10, O₃, and NO₂.

## ✨ Features

* 🌍 Interactive 3D Earth
* 📍 Accurate city locations from Natural Earth
* 🔎 City and country search
* 🌫️ Real air-quality data from Open-Meteo
* 📊 US AQI, PM2.5, PM10, O₃ and NO₂
* 🔄 Automatic AQI refresh every 15 minutes
* 🖱️ Globe rotation and interaction
* 📱 Responsive design for desktop, tablet and mobile
* ⚡ Fast Next.js application
* 🌑 Dark, minimal interface
* 🗺️ Natural Earth geographic data for land and cities

## 🛠️ Tech Stack

* Next.js
* TypeScript
* React
* Three.js
* React Three Fiber
* @react-three/drei
* Tailwind CSS
* Lucide React
* Open-Meteo Air Quality API
* Natural Earth Data

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd air-quality-globe
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🏗️ Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## 🌫️ Air Quality Data

Air-quality information is provided by the Open-Meteo Air Quality API.

The application uses:

* US AQI
* PM2.5
* PM10
* Ozone (O₃)
* Nitrogen Dioxide (NO₂)

The displayed AQI is model-based and may differ from measurements recorded by local monitoring stations.

## 🗺️ Geographic Data

City and geographic information is based on Natural Earth datasets.

The application uses Natural Earth data for:

* Major cities
* Capital cities
* World cities
* Population information
* Geographic land boundaries


## 📜 License & Data Sources

This project code is developed for portfolio and educational purposes.

Third-party geographic and environmental data remains subject to the licenses and terms of their respective providers.

### Data Sources

* Natural Earth — Geographic and populated-place datasets
* Open-Meteo — Air Quality API
* NASA Blue Marble — Earth imagery

## 👨‍💻 Developer

**Md. Arfan Ahmed**

Built with Next.js, Three.js and real-world environmental data.
