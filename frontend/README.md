# Ist es jetzt wirklich warm? - Frontend

A React-based interactive web application that shows real-time temperature data across Germany, allowing users to compare and analyze temperature patterns.

## Features

- Interactive D3-based map visualization of temperature data
- Historical temperature analysis
- City comparison functionality
- Responsive design for mobile and desktop
- Redux state management

## Tech Stack

- React (with React Router for routing)
- Redux (with Redux Toolkit for state management)
- D3.js for interactive data visualizations
- CSS for styling

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/itishotnow.git
cd itishotnow/frontend
```

2. Install dependencies:
```bash
npm install
```

### Data Setup

Before running the application, you need to set up the data by creating symlinks to the data directories:

```bash
# Run the script from the project root
./symlink_data_to_frontend.sh
```

This script creates symlinks in the frontend directory that point to the required data files:
- Station data for the map of Germany
- Rolling average data (1951-2024) for the temperature scatter plot
- Rolling average data (1961-1990) for the temperature bell curve plot

The data can either be:
- Downloaded and generated following the hints left in FILES.md and .vscode/launch.json. Real instructions will follow.
- Downloaded directly from the S3 bucket at:
  - https://esistwarm.jetzt/station_data/10min_station_data_20250707_with_hist_means.csv
  - https://esistwarm.jetzt/data/10min_station_data/rolling_average/1951_2024/daily/
  - https://esistwarm.jetzt/data/10min_station_data/rolling_average/1961_1990/daily/
  
### Development

To start the development server:
```bash
npm run start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

There is a GitHub Action that automatically builds the frontend on push and stores it in an S3 bucket for serving.

## Data Sources

The application uses data from:
- GeoNames for city information
- Weather station data for temperature information
- Europe GeoJSON data for map rendering

## Contributing

Feel free to contribute however you like, whether it is actively in the repository or in your fork. There can never be enough plots.

## License

This project is licensed under the MIT License - see the LICENSE file for details.