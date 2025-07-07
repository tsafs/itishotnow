#!/usr/bin/env python3
"""
Upload station data to Scaleway S3 bucket
"""

import os
import sys
import argparse
from pathlib import Path
import boto3
from botocore.exceptions import ClientError


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Upload station data to S3 bucket')
    parser.add_argument('--file', type=str, required=True,
                        help='Path to the CSV file to upload')
    parser.add_argument('--bucket', type=str, required=True,
                        help='S3 bucket name')
    parser.add_argument('--region', type=str, required=True,
                        help='S3 region name')
    parser.add_argument('--endpoint-url', type=str, required=True,
                        help='S3 endpoint URL (e.g., https://bucket.fr-par.scw.cloud')
    parser.add_argument('--object-name', type=str,
                        help='Object name in S3 bucket (default: same as file basename)')
    parser.add_argument('--directory', type=str,
                        help='Directory path in S3 bucket (will be prepended to object name)')
    return parser.parse_args()


def upload_file(file_path, bucket, region, endpoint_url, object_name=None, directory=None):
    """Upload a file to an S3 bucket

    :param file_path: Path to the file to upload
    :param bucket: Bucket name
    :param region: S3 region name
    :param endpoint_url: S3 endpoint URL
    :param object_name: S3 object name. If not specified, file_path basename is used
    :param directory: Directory path in S3 bucket
    :return: True if file was uploaded, False otherwise
    """
    # If S3 object_name was not specified, use file basename
    if object_name is None:
        object_name = Path(file_path).name
        
    # If directory is specified, prepend it to the object name
    if directory:
        # Remove leading/trailing slashes and join with object name
        directory = directory.strip('/')
        if directory:
            object_name = f"{directory}/{object_name}"

    # Check credentials
    if not os.environ.get('ACCESS_KEY') or not os.environ.get('SECRET_KEY'):
        print("Error: AWS credentials are not set. Please set ACCESS_KEY and SECRET_KEY environment variables.")
        return False
    
    try:
        # Create S3 client with Scaleway endpoint
        s3_client = boto3.client(
            's3',
            region_name=region,
            endpoint_url=endpoint_url,
            aws_access_key_id=os.environ['ACCESS_KEY'],
            aws_secret_access_key=os.environ['SECRET_KEY']
        )
        
        print(f"Uploading {file_path} to {bucket}/{object_name}")
        s3_client.upload_file(file_path, bucket, object_name, ExtraArgs={'ACL': 'public-read'})
        print(f"Successfully uploaded {file_path} to {bucket}/{object_name}")
        return True
    
    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        return False
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        return False


def main():
    args = parse_arguments()
    
    data_file = args.file
    
    if not Path(data_file).exists():
        print(f"Error: Data file {data_file} not found.")
        sys.exit(1)
    
    # Upload the file
    if upload_file(data_file, args.bucket, args.region, args.endpoint_url, 
                   args.object_name, args.directory):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
