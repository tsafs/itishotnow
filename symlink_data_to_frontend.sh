#!/bin/bash

# This script creates symlinks in the frontend project to the data directories for different use cases.
# Ensure that the data exists in the specified paths before running this script.
# The data can either be 
# - downloaded and generated following the instructions in FILES.md
# - or downloaded from the S3 bucket at 
#   - https://esistwarm.jetzt/station_data/10min_station_data_20250707_with_hist_means.csv
#   - https://esistwarm.jetzt/data/10min_station_data/rolling_average/1951_2024/daily/
#   - https://esistwarm.jetzt/data/10min_station_data/rolling_average/1961_1990/daily/

# Function to create symlink if it doesn't already exist
create_symlink() {
  local target="$1"
  local link_name="$2"
  
  if [ ! -L "$link_name" ]; then
    echo "Creating symlink: $link_name -> $target"
    ln -s "$target" "$link_name"
  else
    echo "Symlink already exists: $link_name"
  fi
}

# Symlink data required for the map of Germany
mkdir -p $HOME/Projects/itishotnow/frontend/public/station_data
create_symlink "$HOME/Projects/itishotnow/data/10min_station_data/10min_station_data_20250707_with_hist_means.csv" "$HOME/Projects/itishotnow/frontend/public/station_data/10min_station_data_20250707_with_hist_means.csv"

# Symlink data required for the temperature scatter plot
mkdir -p $HOME/Projects/itishotnow/frontend/public/data/rolling_average/1951_2024
create_symlink "/home/sebastian/Projects/itishotnow/data/10min_station_data/rolling_average/1951_2024/daily" "/home/sebastian/Projects/itishotnow/frontend/public/data/rolling_average/1951_2024/daily"

# Symlink data required for the temperature bell curve plot
mkdir -p $HOME/Projects/itishotnow/frontend/public/data/rolling_average/1961_1990
create_symlink "$HOME/Projects/itishotnow/data/10min_station_data/rolling_average/1961_1990/daily" "$HOME/Projects/itishotnow/frontend/public/data/rolling_average/1961_1990/daily"