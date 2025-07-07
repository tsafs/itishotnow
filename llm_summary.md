# Project Summary: `ziemlichwarmhier.de` — A German Climate Visualization Platform

We are building a German clone of [isitHotRightNow.com](https://isithotrightnow.com/) called **ziemlichwarmhier.de**, a platform that visualizes whether it's currently unusually hot (or cold) in Germany, based on real-time and historical temperature data from the Deutscher Wetterdienst (DWD).

## 🔍 Data Source

All climate data is obtained from the **DWD Climate Data Center (CDC) OpenData portal**, which provides:

- Historical and recent measurements from ~400 DWD climate stations
- Multi-year normals (e.g., 1981–2010)
- Hourly and daily resolution datasets
- Station metadata including geographic coordinates

## ⚙️ Architecture

The system is built as a containerized microservice stack using **Docker Compose**, with each service isolated in its own container:

### Services

1. **`daily-job` (Python)** 
   - Fetches historical data and long-term climate normals 
   - Normalizes and inserts the data into the database 

2. **`hourly-job` (Python)** 
   - Retrieves current observations from the DWD OpenData feed 
   - Stores and updates live readings for display 

3. **`backend` (FastAPI)** 
   - Provides REST/GraphQL APIs to the frontend 
   - Computes differences between current and historical averages 
   - Handles geospatial queries via PostGIS 

4. **`frontend` (Next.js + Tailwind CSS)** 
   - User-facing application similar to `isithotrightnow.com` 
   - Visualizes real-time temperature anomalies in a fun and informative way 

5. **`db` (PostgreSQL + PostGIS)** 
   - Central geospatial database for storing climate records 
   - Supports location-based queries and station metadata 

## 🧰 Tech Stack

- **Python 3.11** — ETL jobs, data normalization, cron-like scheduling
- **FastAPI** — Lightweight, modern Python API framework
- **Next.js + Tailwind CSS** — Frontend development for a responsive UI
- **PostgreSQL + PostGIS** — Robust geospatial storage and querying
- **Pandas, SQLAlchemy, GeoPandas** — Data wrangling and ORM

## 🎯 Goals

- Show temperature deltas compared to multi-year climate normals
- Support location-specific and region-wide statistics
- Enable scalable extensions (e.g. precipitation, wind, maps)
- Possibly add station-mapped heat visuals and user interaction

This system is designed for extensibility, high performance, and geographic accuracy, with strong emphasis on **climate transparency**, **open data**, and **public usability**.