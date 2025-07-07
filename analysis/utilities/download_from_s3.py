#!/usr/bin/env python3
"""
Download files from Scaleway S3 bucket
"""

import os
import sys
import argparse
import boto3
from botocore.exceptions import ClientError


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Download files from S3 bucket')
    parser.add_argument('--file', type=str, required=True,
                        help='Object name in S3 bucket to download')
    parser.add_argument('--output', type=str, required=True,
                        help='Local path where to save the downloaded file')
    parser.add_argument('--bucket', type=str, required=True,
                        help='S3 bucket name')
    parser.add_argument('--region', type=str, required=True,
                        help='S3 region name')
    parser.add_argument('--endpoint-url', type=str, required=True,
                        help='S3 endpoint URL (e.g., https://bucket.fr-par.scw.cloud)')
    return parser.parse_args()


def download_file(bucket, object_name, output_path, region, endpoint_url):
    """Download a file from an S3 bucket

    :param bucket: Bucket name
    :param object_name: S3 object name to download
    :param output_path: Local file path to save the downloaded file
    :param region: S3 region name
    :param endpoint_url: S3 endpoint URL
    :return: True if file was downloaded, False otherwise
    """
    # Check credentials
    if not os.environ.get('ACCESS_KEY') or not os.environ.get('SECRET_KEY'):
        print("Error: AWS credentials are not set. Please set ACCESS_KEY and SECRET_KEY environment variables.")
        return False
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Create S3 client with Scaleway endpoint
        s3_client = boto3.client(
            's3',
            region_name=region,
            endpoint_url=endpoint_url,
            aws_access_key_id=os.environ['ACCESS_KEY'],
            aws_secret_access_key=os.environ['SECRET_KEY']
        )
        
        print(f"Downloading {bucket}/{object_name} to {output_path}")
        s3_client.download_file(bucket, object_name, output_path)
        print(f"Successfully downloaded {bucket}/{object_name} to {output_path}")
        return True
    
    except ClientError as e:
        print(f"Error downloading from S3: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error when downloading file: {e}")
        return False


def download_multiple_files(bucket, object_names, output_paths, region, endpoint_url):
    """Download multiple files from an S3 bucket in an optimized way
    
    :param bucket: Bucket name
    :param object_names: List of S3 object names to download
    :param output_paths: List of local file paths to save the downloaded files
    :param region: S3 region name
    :param endpoint_url: S3 endpoint URL
    :return: List of successfully downloaded file paths
    """
    # Check credentials
    if not os.environ.get('ACCESS_KEY') or not os.environ.get('SECRET_KEY'):
        print("Error: AWS credentials are not set. Please set ACCESS_KEY and SECRET_KEY environment variables.")
        return []
    
    # Create output directories if they don't exist
    for output_path in output_paths:
        output_dir = os.path.dirname(output_path)
        os.makedirs(output_dir, exist_ok=True)
    
    successful_downloads = []
    
    try:
        # Create S3 client with Scaleway endpoint
        s3_client = boto3.client(
            's3',
            region_name=region,
            endpoint_url=endpoint_url,
            aws_access_key_id=os.environ['ACCESS_KEY'],
            aws_secret_access_key=os.environ['SECRET_KEY']
        )
        
        # Use S3 Transfer Manager for efficient downloads
        transfer_config = boto3.s3.transfer.TransferConfig(
            multipart_threshold=8 * 1024 * 1024,  # 8MB
            max_concurrency=10,
            use_threads=True
        )
        
        transfer = boto3.s3.transfer.S3Transfer(
            client=s3_client,
            config=transfer_config
        )
        
        print(f"Starting batch download of {len(object_names)} files from bucket {bucket}")
        
        for i, (object_name, output_path) in enumerate(zip(object_names, output_paths)):
            try:
                print(f"Downloading {i+1}/{len(object_names)}: {object_name}")
                transfer.download_file(bucket, object_name, output_path)
                successful_downloads.append(output_path)
                print(f"Successfully downloaded to {output_path}")
            except Exception as e:
                print(f"Error downloading {object_name}: {str(e)}")
        
        print(f"Batch download completed. {len(successful_downloads)}/{len(object_names)} files downloaded successfully.")
        
        return successful_downloads
        
    except Exception as e:
        print(f"Unexpected error during batch download: {str(e)}")
        return successful_downloads


def main():
    args = parse_arguments()
    
    # Download the file
    if download_file(args.bucket, args.file, args.output, args.region, args.endpoint_url):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
