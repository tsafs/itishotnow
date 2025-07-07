#!/usr/bin/env python3
import os
import argparse
import xarray as xr
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np
import pandas as pd
from pathlib import Path
from matplotlib.colors import Normalize


def create_animation(file_path, output_format='gif', fps=10, dpi=100, year=None):
    """
    Create an animation showing the spatial distribution of climate data across all days.
    
    Parameters:
    -----------
    file_path : str
        Path to NetCDF file or directory containing NetCDF files
    output_format : str
        'gif' or 'mp4'
    fps : int
        Frames per second for the animation
    dpi : int
        Resolution of the output animation
    year : int or None
        Specific year to animate, or None to use the file provided
    """
    try:
        # Handle directory or single file
        if os.path.isdir(file_path):
            if year is None:
                print("Please specify a year when providing a directory")
                return
            
            # Find the file for the specified year
            year_files = [f for f in os.listdir(file_path) if f.endswith('.nc') and str(year) in f]
            if not year_files:
                print(f"No NetCDF files found for year {year}")
                return
            
            file_path = os.path.join(file_path, year_files[0])
            print(f"Using file: {file_path}")
        
        # Open the NetCDF file
        print(f"Opening NetCDF file: {file_path}")
        ds = xr.open_dataset(file_path)
        
        # Set the main variable to "tasmax" as requested
        main_var = "tasmax"
        
        # Check if the variable exists in the dataset
        if main_var not in ds.data_vars:
            print(f"Error: '{main_var}' not found in dataset. Available variables: {list(ds.data_vars)}")
            ds.close()
            return
            
        print(f"Animating variable: {main_var}")
        
        # Check dimensions
        dims = ds[main_var].dims
        print(f"Dimensions: {dims}")
        
        if 'time' not in dims or 'x' not in dims or 'y' not in dims:
            print("Error: Dataset doesn't have expected dimensions (time, x, y)")
            ds.close()
            return
            
        # Get number of time steps (days)
        num_days = len(ds.time)
        print(f"Number of days to animate: {num_days}")
        
        # Set up the figure
        fig, ax = plt.subplots(figsize=(8, 8))
        
        # Custom colormap setup
        cmap = plt.get_cmap('viridis')
        
        # Calculate min/max values for consistent colormap scaling
        if 'bnds' in dims:
            min_val = float(ds[main_var].isel(bnds=0).min().values)
            max_val = float(ds[main_var].isel(bnds=0).max().values)
        else:
            min_val = float(ds[main_var].min().values)
            max_val = float(ds[main_var].max().values)
        
        print(f"Data range: {min_val:.2f} to {max_val:.2f}")
        norm = Normalize(vmin=min_val, vmax=max_val)
        
        # Create empty plot to update
        if 'bnds' in dims:
            day_data = ds[main_var].isel(time=0, bnds=0).values
        else:
            day_data = ds[main_var].isel(time=0).values
            
        # Turn the spatial distribution upside down by using origin='lower'
        # The default in imshow is origin='upper', which puts [0,0] at the top-left
        # Using origin='lower' puts [0,0] at the bottom-left, effectively flipping vertically
        im = ax.imshow(day_data, cmap=cmap, norm=norm, origin='lower')
        
        # Add colorbar
        cbar = fig.colorbar(im, ax=ax, label=f"{main_var} ({ds[main_var].attrs.get('units', 'unknown')})")
        
        # Add title with placeholder for date
        title = ax.set_title("")
        
        # Function to update frame for animation
        def update_frame(frame_num):
            try:
                # Get data for this day
                if 'bnds' in dims:
                    day_data = ds[main_var].isel(time=frame_num, bnds=0).values
                else:
                    day_data = ds[main_var].isel(time=frame_num).values
                
                # Update the image data
                im.set_array(day_data)
                
                # Update the title with the date
                try:
                    date_str = str(pd.to_datetime(ds.time.values[frame_num]).date())
                except:
                    date_str = f"Day {frame_num + 1}"
                    
                title.set_text(f"{main_var} - Spatial Distribution on {date_str}")
                
                return [im, title]
            except Exception as e:
                print(f"Error updating frame {frame_num}: {e}")
                return [im, title]
        
        print("Creating animation...")
        # Create the animation
        ani = animation.FuncAnimation(
            fig, update_frame, frames=num_days, 
            interval=1000/fps, blit=True
        )
        
        # Set up output directory
        output_dir = Path("./data/animations")
        output_dir.mkdir(exist_ok=True, parents=True)
        
        # Get year from filename or time data
        try:
            if year is None:
                year_match = os.path.basename(file_path).split('_')[2]
                if year_match.isdigit():
                    year = year_match
                else:
                    # Try to get year from the time data
                    year = str(pd.to_datetime(ds.time.values[0]).year)
        except:
            year = "unknown"
            
        # Save the animation
        base_name = f"{main_var}_{year}_animation"
        
        if output_format.lower() == 'mp4':
            # For MP4 output
            output_file = output_dir / f"{base_name}.mp4"
            writer = animation.FFMpegWriter(fps=fps, metadata=dict(artist='Climate Data Tool'),
                                          bitrate=1800)
            ani.save(output_file, writer=writer, dpi=dpi)
            print(f"Animation saved to: {output_file}")
            
        else:  # Default to GIF
            output_file = output_dir / f"{base_name}.gif"
            # Try using 'pillow' writer first, fall back to 'imagemagick' if needed
            try:
                ani.save(output_file, writer='pillow', fps=fps, dpi=dpi)
            except:
                print("Pillow writer failed, trying imagemagick...")
                ani.save(output_file, writer='imagemagick', fps=fps, dpi=dpi)
                
            print(f"Animation saved to: {output_file}")
        
        # Close resources
        plt.close(fig)
        ds.close()
        print("Animation completed successfully!")
        
    except Exception as e:
        print(f"Error creating animation: {e}")


def main():
    parser = argparse.ArgumentParser(description="Create animations from NetCDF climate data")
    parser.add_argument("--file", type=str, help="Path to NetCDF file or directory containing NetCDF files",
                        default="./data/netcdf")
    parser.add_argument("--format", type=str, choices=['gif', 'mp4'], default='gif',
                       help="Output format (gif or mp4)")
    parser.add_argument("--fps", type=int, default=10, help="Frames per second")
    parser.add_argument("--dpi", type=int, default=100, help="DPI for output animation")
    parser.add_argument("--year", type=int, help="Specific year to animate (required if file is a directory)")
    
    args = parser.parse_args()
    
    if os.path.isdir(args.file) and args.year is None:
        print("Error: When providing a directory, you must specify a year with --year")
        return
        
    create_animation(args.file, args.format, args.fps, args.dpi, args.year)

if __name__ == "__main__":
    main()
