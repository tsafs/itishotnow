# ./data/10min_station_data/now

Contains all weather data from today for all weather stations publicly made available by the DWD.

We use that data to generate `./data/10min_station_data/10min_station_data.csv`, as described below.

# ./data/10min_station_data/10min_station_data.csv

Contains the latest weather measurements from today for all weather stations that have measurements available in the DWD HYRAS dataset.

On the website, we showcase this data.

# ./data/10min_station_data/hyras/42_114_garmisch_partenkirchen.csv

Format: <grid x coordinate>_<grid y coordinate>_<escaped station name>.csv

Contains historical weather data of the corresponding station for which also live data is available. Originates from the DWD HYRAS dataset.

On the website, this data is taken to display plots for each weather station.

# ./data/10min_station_data/rolling_average/1961-1990/avg_7d_42_114_garmisch_partenkirchen_1961-1990.csv

Format: avg_<days>d_<x>_<y>_<station>_<year range>.csv

Contains rolling average data for the corresponding station. The rolling average is calculated from all values between <days> days before and <days> days after the current day. 

For example, for the file `avg_7d_42_114_garmisch_partenkirchen_1961-1990.csv`, if today is 8th of July, then the value of today is calculated from all values from 1st July to 15th July. The average is not yet taken over the years.

On the website, this data is taken to display plots for each weather station.

# ./data/10min_station_data/rolling_average/1961-1990/avg_7d_over_years_42_114_garmisch_partenkirchen_1961-1990.csv

Contains the rolling average as described above, but also averaged over the years.

On the website, the live weather data of a weather station is compared to the corresponding values in this file.

Note: Comparing a live value to a multi-day average is always a little flawed, because the average is often artificially lowered or raised by the surrounding days. It is best to compare an average vs an average, e.g. past week's monday's rolling average to the historical one.   