#!/bin/bash
python3 -m pip install --target ./package boto3==1.34.0 botocore==1.34.0
cd package
zip -r ../deployment-package.zip .
cd ..
zip -g deployment-package.zip *.py
