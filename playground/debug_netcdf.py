import os
import argparse
import xarray as xr
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pathlib import Path

def list_netcdf_files(directory):
    """List all NetCDF files in the specified directory."""
    netcdf_files = []
    for file in os.listdir(directory):
        if file.endswith('.nc'):
            netcdf_files.append(os.path.join(directory, file))
    return netcdf_files

def explore_variable(ds, var_name):
    """Explore a specific variable from the dataset."""
    try:
        if var_name not in ds.variables:
            print(f"\n❌ Variable '{var_name}' not found in dataset. Available variables:")
            for v in ds.variables:
                print(f"  - {v}")
            return

        print(f"\n📊 EXPLORING VARIABLE: {var_name}")
        
        # Display variable information
        var = ds[var_name]
        print(f"\n  Data type: {var.dtype}")
        print(f"  Dimensions: {var.dims}")
        print(f"  Shape: {var.shape}")
        
        # Display variable attributes
        print("\n  Attributes:")
        for attr_name, attr_value in var.attrs.items():
            print(f"    - {attr_name}: {attr_value}")
            
        # Display data sample
        print("\n  Data sample:")
        print(var.head())
        
        # Calculate some basic statistics if numeric
        if np.issubdtype(var.dtype, np.number):
            print("\n  Basic statistics:")
            try:
                print(f"    - Mean: {float(var.mean().values):.2f}")
                print(f"    - Min: {float(var.min().values):.2f}")
                print(f"    - Max: {float(var.max().values):.2f}")
                print(f"    - Std Dev: {float(var.std().values):.2f}")
            except Exception as e:
                print(f"    - Could not calculate statistics: {e}")
        
        # Check dimensions and create appropriate visualization
        dims = var.dims
        
        # Try to create a visualization
        try:
            plt.figure(figsize=(10, 6))
            
            if 'time' in dims and 'x' in dims and 'y' in dims:
                # For climate grid data
                day_data = var.isel(time=0)
                var_label = var_name
                    
                plt.title(f"{var_label} - Spatial Distribution (First Day)")
                im = plt.imshow(day_data, cmap='viridis')
                plt.colorbar(im, label=f"{var_label} ({var.attrs.get('units', 'unknown')})")
                plt.xlabel('X coordinate (grid points)')
                plt.ylabel('Y coordinate (grid points)')
                
            elif len(dims) == 1 and dims[0] == 'time':
                # For time series
                plt.plot(range(len(var)), var.values)
                plt.title(f"{var_name} - Time Series")
                plt.xlabel('Time Index')
                plt.ylabel(f"{var_name} ({var.attrs.get('units', 'unknown')})")
                
            elif len(dims) == 2:
                # For 2D data
                plt.title(f"{var_name} - 2D Visualization")
                im = plt.imshow(var.values, cmap='viridis')
                plt.colorbar(im, label=f"{var_name} ({var.attrs.get('units', 'unknown')})")
                plt.xlabel(dims[1])
                plt.ylabel(dims[0])
            
            # Save the plot
            output_dir = Path("./data/plots")
            output_dir.mkdir(exist_ok=True, parents=True)
            plot_file = output_dir / f"{var_name}_plot.png"
            plt.savefig(plot_file)
            print(f"\n📷 Plot saved to: {plot_file}")
            plt.close()
            
        except Exception as e:
            print(f"\n⚠️ Couldn't plot {var_name}: {e}")
    
    except Exception as e:
        print(f"\n❌ Error exploring variable {var_name}: {e}")


def explore_netcdf(file_path, specific_var=None):
    """Explore the contents of a NetCDF file."""
    try:
        # Open the NetCDF file
        ds = xr.open_dataset(file_path)
        
        print("\n" + "="*80)
        print(f"EXPLORING NETCDF FILE: {os.path.basename(file_path)}")
        print("="*80)
        
        # If a specific variable was requested, only explore that one
        if specific_var:
            explore_variable(ds, specific_var)
            ds.close()
            return
        
        # Display dataset information
        print("\n🔍 DATASET OVERVIEW:")
        print(ds)
        
        # Display dimensions
        print("\n📏 DIMENSIONS:")
        for dim_name, dim_size in ds.dims.items():
            print(f"  - {dim_name}: {dim_size}")
        
        # Display variables
        print("\n📊 VARIABLES:")
        for var_name, var in ds.variables.items():
            print(f"  - {var_name} ({var.dtype}):")
            print(f"    Dimensions: {var.dims}")
            print(f"    Attributes: {list(var.attrs.keys())}")
        
        # Display global attributes
        print("\n🌐 GLOBAL ATTRIBUTES:")
        for attr_name, attr_value in ds.attrs.items():
            print(f"  - {attr_name}: {attr_value}")
        
        # Try to visualize the first data variable (if possible)
        data_vars = list(ds.data_vars)
        if data_vars:
            main_var = data_vars[0]
            print(f"\n📈 DATA SAMPLE for {main_var}:")
            
            # Get better insights about the variable structure based on dimensions
            dims = ds[main_var].dims
            print(f"  Shape: {ds[main_var].shape}")
            print(f"  Dimensions: {dims}")
            
            # Check if we have time, x, y dimensions as expected from your explanation
            if 'time' in dims and 'x' in dims and 'y' in dims:
                # Display some sample data points
                print("\n  Sample values:")
                
                # Get the first day data
                first_day = ds[main_var].isel(time=0)
                print(f"  First day (time=0) mean value: {float(first_day.mean().values):.2f}")
                print(f"  First day min: {float(first_day.min().values):.2f}, max: {float(first_day.max().values):.2f}")
                
                # Get middle day data
                mid_day_idx = len(ds.time) // 2
                mid_day = ds[main_var].isel(time=mid_day_idx)
                print(f"  Mid-year day (time={mid_day_idx}) mean value: {float(mid_day.mean().values):.2f}")
                
                # Get the last day data
                last_day = ds[main_var].isel(time=-1)
                print(f"  Last day (time={len(ds.time)-1}) mean value: {float(last_day.mean().values):.2f}")
                
                # Display time values (convert to dates if possible)
                try:
                    time_values = ds.time.values
                    if hasattr(time_values, 'astype') and hasattr(time_values[0], 'astype'):
                        print("\n  Time range:")
                        print(f"  Start: {pd.to_datetime(time_values[0])}")
                        print(f"  End: {pd.to_datetime(time_values[-1])}")
                    else:
                        print("\n  Time values (first 3):", time_values[:3])
                except Exception as e:
                    print(f"\n  Could not parse time values: {e}")
                
                # Sample grid points
                print("\n  Grid point samples:")
                
                # Center point - selecting first value in "bnds" dimension (temperature)
                center_y = len(ds.y) // 2
                center_x = len(ds.x) // 2
                
                # Check if 'bnds' is in the dimensions and select only the temperature value (first index)
                if 'bnds' in dims:
                    print("  Note: Selecting only temperature data (first value in 'bnds' dimension)")
                    first_day_value = float(first_day.isel(y=center_y, x=center_x, bnds=0).values)
                    print(f"  Center grid point (y={center_y}, x={center_x}) temperature for first day: {first_day_value:.2f}")
                else:
                    # If no 'bnds' dimension, use the existing code
                    print(f"  Center grid point (y={center_y}, x={center_x}) for first day: "
                          f"{float(first_day.isel(y=center_y, x=center_x).values):.2f}")
                
                # If coordinates are available, show their values
                if 'y' in ds.coords and 'x' in ds.coords:
                    print(f"  Coordinates of center point: x={float(ds.x[center_x].values):.2f}, "
                          f"y={float(ds.y[center_y].values):.2f}")
                
                # Explanation of the "bnds" dimension
                if 'bnds' in dims:
                    print("\n  Note about 'bnds' dimension: First value (index 0) appears to be temperature, second value (index 1) appears to be humidity.")
            else:
                # Fallback for other variable structures
                print("\n  Sample data snippet:")
                print(ds[main_var].head())
            
            # Try to create a basic plot
            try:
                plt.figure(figsize=(10, 6))
                
                # Create different visualizations based on the dimensions
                if 'time' in dims and 'x' in dims and 'y' in dims:
                    # For typical climate data: plot spatial map for a single time step
                    day_idx = 0  # First day
                    
                    # Select only temperature data if 'bnds' dimension exists
                    if 'bnds' in dims:
                        day_data = ds[main_var].isel(time=day_idx, bnds=0)  # Select only temperature (first index)
                    else:
                        day_data = ds[main_var].isel(time=day_idx)
                    
                    # Get the time as a string if possible
                    try:
                        time_str = str(pd.to_datetime(ds.time.values[day_idx]).date())
                    except:
                        time_str = f"time index {day_idx}"
                    
                    data_label = f"{main_var} - Temperature" if 'bnds' in dims else main_var
                    plt.title(f"{data_label} - Spatial Distribution on {time_str}")
                    im = plt.imshow(day_data, cmap='viridis')
                    plt.colorbar(im, label=f"{data_label} ({ds[main_var].attrs.get('units', 'unknown')})")
                    plt.xlabel('X coordinate (grid points)')
                    plt.ylabel('Y coordinate (grid points)')
                    
                    # Optional: Create a second plot for time series at the center point
                    plt.figure(figsize=(10, 6))
                    center_y = len(ds.y) // 2
                    center_x = len(ds.x) // 2
                    
                    # Select only temperature data for time series if 'bnds' dimension exists
                    if 'bnds' in dims:
                        time_series = ds[main_var].isel(y=center_y, x=center_x, bnds=0)
                    else:
                        time_series = ds[main_var].isel(y=center_y, x=center_x)
                    
                    plt.plot(range(len(time_series)), time_series.values)
                    plt.title(f"{data_label} - Time Series at Center Grid Point (y={center_y}, x={center_x})")
                    plt.xlabel('Time Index (days)')
                    plt.ylabel(f"{data_label} ({ds[main_var].attrs.get('units', 'unknown')})")
                    
                    output_dir = Path("./data/plots")
                    output_dir.mkdir(exist_ok=True, parents=True)
                    
                    # Save both plots
                    file_suffix = "_temp" if 'bnds' in dims else ""
                    spatial_plot_file = output_dir / f"{os.path.basename(file_path).split('.')[0]}_{main_var}{file_suffix}_spatial_plot.png"
                    plt.savefig(spatial_plot_file)
                    print(f"\n📷 Spatial plot saved to: {spatial_plot_file}")
                    
                    time_plot_file = output_dir / f"{os.path.basename(file_path).split('.')[0]}_{main_var}{file_suffix}_time_series_plot.png"
                    plt.savefig(time_plot_file)
                    print(f"\n📷 Time series plot saved to: {time_plot_file}")
                    
                elif len(ds[main_var].dims) == 2:
                    # For 2D data, create a heatmap
                    plt.title(f"{main_var} - 2D Visualization")
                    im = plt.imshow(ds[main_var].values, cmap='viridis')
                    plt.colorbar(im, label=f"{main_var} ({ds[main_var].attrs.get('units', 'unknown')})")
                    plt.xlabel(ds[main_var].dims[1])
                    plt.ylabel(ds[main_var].dims[0])
                    
                    output_dir = Path("./data/plots")
                    output_dir.mkdir(exist_ok=True, parents=True)
                    plot_file = output_dir / f"{os.path.basename(file_path).split('.')[0]}_{main_var}_plot.png"
                    plt.savefig(plot_file)
                    print(f"\n📷 Plot saved to: {plot_file}")
                
                elif len(ds[main_var].dims) >= 1:
                    # For 1D data or time series, plot the first slice
                    if len(ds[main_var].dims) > 1:
                        # Take a slice if multi-dimensional
                        data_slice = ds[main_var].values.flatten()[:1000]  # Take first 1000 points
                        plt.title(f"{main_var} - First 1000 values (flattened)")
                    else:
                        data_slice = ds[main_var].values[:1000]  # Take first 1000 points
                        plt.title(f"{main_var} - First 1000 values")
                    
                    plt.plot(data_slice)
                    plt.xlabel("Index")
                    plt.ylabel(f"{main_var} ({ds[main_var].attrs.get('units', 'unknown')})")
                    
                    output_dir = Path("./data/plots")
                    output_dir.mkdir(exist_ok=True, parents=True)
                    plot_file = output_dir / f"{os.path.basename(file_path).split('.')[0]}_{main_var}_plot.png"
                    plt.savefig(plot_file)
                    print(f"\n📷 Plot saved to: {plot_file}")
                
                plt.close('all')
                
            except Exception as e:
                print(f"\n⚠️ Couldn't plot {main_var}: {e}")
        
        # Close the dataset
        ds.close()
        
    except Exception as e:
        print(f"\n❌ Error reading NetCDF file: {e}")

def main():
    parser = argparse.ArgumentParser(description="Debug and explore NetCDF files")
    parser.add_argument("--file", type=str, help="Path to a specific NetCDF file to explore", required=True)
    parser.add_argument("--var", type=str, help="Specific variable name to explore (e.g., tasmax)")
    
    args = parser.parse_args()
    
    if os.path.exists(args.file):
        explore_netcdf(args.file, args.var)
    else:
        print(f"File {args.file} does not exist")

if __name__ == "__main__":
    main()
