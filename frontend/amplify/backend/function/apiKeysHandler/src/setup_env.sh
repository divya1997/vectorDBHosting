#!/bin/bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install boto3==1.34.0 botocore==1.34.0

# Create the deployment package
mkdir -p package
pip install --target ./package boto3==1.34.0 botocore==1.34.0
cd package
zip -r ../deployment-package.zip .
cd ..
zip -g deployment-package.zip *.py

# Deactivate virtual environment
deactivate
