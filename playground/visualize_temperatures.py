import os
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import numpy as np

DUMMY_YEAR = 2020  # Dummy year for date handling, since we only care about month and day

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Visualize temperature data over multiple days.')
    parser.add_argument('--station-data', required=True, help='Path to the station data file with daily min/max temps')
    parser.add_argument('--hourly-data-dir', required=True, help='Directory containing hourly temperature data files')
    parser.add_argument('--start-date', required=True, help='Start date in MM-DD format')
    parser.add_argument('--end-date', required=True, help='End date in MM-DD format')
    parser.add_argument('--output', help='Output file path for the plot', default='temperature_plot.png')
    return parser.parse_args()

def read_station_data(file_path, start_date, end_date):
    """Read and filter the station data for the specified date range."""
    df = pd.read_csv(file_path)
    
    # Convert dates to datetime objects
    df['datetime'] = pd.to_datetime(df['date'] + f"-{DUMMY_YEAR}", format='%m-%d-%Y')
    
    # Convert start/end dates to datetime objects for proper comparison
    start_datetime = datetime.strptime(f"{start_date}-{DUMMY_YEAR}", '%m-%d-%Y')
    end_datetime = datetime.strptime(f"{end_date}-{DUMMY_YEAR}", '%m-%d-%Y')
    
    # Handle case where date range crosses year boundary (e.g., Dec to Jan)
    if start_datetime > end_datetime:
        end_datetime = datetime.strptime(f"{end_date}-{DUMMY_YEAR+1}", '%m-%d-%Y')
        # For dates after Dec 31, increase their year for comparison
        mask = df['datetime'] < start_datetime
        df.loc[mask, 'datetime'] = df.loc[mask, 'datetime'] + pd.DateOffset(years=1)
    
    # Filter data based on datetime
    df = df[(df['datetime'] >= start_datetime) & (df['datetime'] <= end_datetime)]
    
    return df.reset_index(drop=True)

def read_hourly_data(hourly_dir, date_str):
    """Read hourly temperature data for a specific date."""
    file_name = f"hourly_temps_{date_str.replace('-', '')}.csv"
    file_path = os.path.join(hourly_dir, file_name)
    
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        return df
    else:
        print(f"Warning: Hourly data file not found for {date_str}: {file_path}")
        return None

def create_plot(station_data, hourly_data_dict, output_path):
    """Create a visualization of temperature data."""
    _, ax = plt.subplots(figsize=(14, 8))
    
    colors = plt.cm.viridis(np.linspace(0, 1, len(station_data)))
    
    # Plot hourly temperatures
    legend_entries = []
    for i, (date_str, color) in enumerate(zip(station_data['date'], colors)):
        if date_str in hourly_data_dict:
            hourly_df = hourly_data_dict[date_str]
            
            # Create x values for hours
            hours = list(range(24))
            temps = [hourly_df.iloc[0][f"hour_{h}"] for h in hours]
            
            # Convert hours to time format for x-axis using DUMMY_YEAR
            x_times = [datetime(DUMMY_YEAR, 1, 1, h, 0) for h in hours]
            
            # Plot hourly temperatures
            line, = ax.plot(x_times, temps, '-', linewidth=2, color=color, alpha=0.8)
            legend_entries.append((line, date_str))
            
            # Plot min-max temperature range as horizontal bar
            daily_min = station_data.loc[i, 'tasmin']
            daily_max = station_data.loc[i, 'tasmax']
            daily_avg = station_data.loc[i, 'tas']
            
            # Add horizontal bars for min-max range
            ax.hlines(y=daily_avg, xmin=x_times[0], xmax=x_times[-1], 
                      colors=color, linestyles='dotted', alpha=0.6)
            ax.plot([x_times[0], x_times[-1]], [daily_min, daily_min], '-', color=color, alpha=0.3)
            ax.plot([x_times[0], x_times[-1]], [daily_max, daily_max], '-', color=color, alpha=0.3)
            ax.fill_between([x_times[0], x_times[-1]], [daily_min, daily_min], 
                           [daily_max, daily_max], color=color, alpha=0.1)
    
    # Format x-axis to show hours
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:00'))
    ax.xaxis.set_major_locator(mdates.HourLocator(interval=2))
    
    # Add legend for days
    ax.legend([entry[0] for entry in legend_entries], 
              [entry[1] for entry in legend_entries],
              loc='upper left', title='Date')
    
    # Add labels and title
    ax.set_xlabel('Hour of Day')
    ax.set_ylabel('Temperature (°C)')
    ax.set_title('Daily Temperature Profiles with Min-Max Ranges')
    
    # Add grid for better readability
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # Set y limits with a bit of padding
    all_temps = []
    for date_str in hourly_data_dict:
        hourly_df = hourly_data_dict[date_str]
        all_temps.extend([hourly_df.iloc[0][f"hour_{h}"] for h in range(24)])
    
    min_temp = min(all_temps) - 1 if all_temps else None
    max_temp = max(all_temps) + 1 if all_temps else None
    
    if min_temp is not None and max_temp is not None:
        ax.set_ylim(min_temp, max_temp)
    
    plt.tight_layout()
    
    # Save the plot
    plt.savefig(output_path)
    print(f"Plot saved to {output_path}")
    
    # Show the plot
    plt.show()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Read station data for the specified date range
    station_data = read_station_data(args.station_data, args.start_date, args.end_date)
    
    # Read hourly data for each day
    hourly_data_dict = {}
    for date_str in station_data['date']:
        hourly_data = read_hourly_data(args.hourly_data_dir, date_str)
        if hourly_data is not None:
            hourly_data_dict[date_str] = hourly_data
    
    # Create and save the plot
    create_plot(station_data, hourly_data_dict, args.output)

if __name__ == "__main__":
    main()
