# AWS Lambda Function Deployment Guide

## Overview
This guide outlines the steps and best practices for deploying Python-based Lambda functions using AWS Amplify. It specifically addresses common issues with dependency management and deployment packaging.

## Directory Structure
Each Lambda function should have the following structure:
```
function-name/
├── amplify.yml
└── src/
    ├── build.sh
    ├── index.py
    ├── requirements.txt
    └── package/       # Created during build
```

## Key Files

### 1. amplify.yml
```yaml
version: 1.0
backend:
  phases:
    build:
      commands:
        - cd src
        - chmod +x build.sh
        - ./build.sh
        - cd ..
  artifacts:
    baseDirectory: src
    files:
      - '**/*'
```

### 2. build.sh
```bash
#!/bin/bash
python3 -m pip install --target ./package boto3==1.34.0 botocore==1.34.0
cd package
zip -r ../deployment-package.zip .
cd ..
zip -g deployment-package.zip *.py
```

### 3. requirements.txt
```
boto3==1.34.0
botocore==1.34.0
```

## Best Practices

1. **Avoid Using Pipenv**
   - Do not use Pipfile or Pipfile.lock
   - Use requirements.txt for dependency management
   - This prevents conflicts with AWS Lambda's Python runtime

2. **Package Dependencies Correctly**
   - Use `pip install --target ./package` to install dependencies in a separate directory
   - This ensures clean dependency isolation
   - Prevents issues with Python path and module imports

3. **Use Explicit Versions**
   - Always specify exact versions in requirements.txt
   - Prevents unexpected behavior from package updates

4. **Deployment Package Creation**
   - Create a ZIP file containing all dependencies
   - Add function code files separately
   - Keep the package size under AWS Lambda limits (50MB zipped, 250MB unzipped)

## Common Issues and Solutions

1. **Python Version Mismatch**
   - AWS Lambda supports specific Python versions
   - Currently using Python 3.8 for compatibility
   - Test locally with the same Python version

2. **Dependency Conflicts**
   - Remove all Pipfiles and Pipfile.lock files
   - Use only requirements.txt
   - Command: `find . -name "Pipfile*" -delete`

3. **Permission Issues**
   - Make build script executable
   - Command: `chmod +x */src/build.sh`

4. **Large Deployment Packages**
   - Only include necessary dependencies
   - Use layer for common dependencies
   - Clean up unnecessary files before packaging

## Deployment Steps

1. **Clean Environment**
   ```bash
   # Remove any existing Pipfiles
   find . -name "Pipfile*" -delete
   
   # Make build scripts executable
   chmod +x */src/build.sh
   ```

2. **Update Dependencies**
   ```bash
   # Update requirements.txt if needed
   echo "boto3==1.34.0\nbotocore==1.34.0" > requirements.txt
   ```

3. **Deploy with Amplify**
   ```bash
   # Deploy changes
   amplify push --yes
   ```

## Troubleshooting

1. **Missing Dependencies**
   - Check if all required packages are in requirements.txt
   - Verify package versions are compatible with Python runtime

2. **Build Failures**
   - Check build.sh permissions
   - Verify Python version compatibility
   - Check for dependency conflicts

3. **Runtime Errors**
   - Test function locally before deployment
   - Check CloudWatch logs for errors
   - Verify IAM roles and permissions

## Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Test with new AWS Lambda runtimes
   - Monitor function performance

2. **Version Control**
   - Track changes to function code
   - Document API changes
   - Maintain deployment scripts

## Security Considerations

1. **Dependencies**
   - Regularly update dependencies for security patches
   - Use trusted packages from PyPI
   - Pin dependency versions

2. **IAM Roles**
   - Follow principle of least privilege
   - Regularly review permissions
   - Update roles as needed
