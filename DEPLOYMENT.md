# Deployment Guide

This guide will help you deploy the Vector DB Builder application on Hostinger.

## Frontend Deployment

1. **Build the Frontend**:
   ```bash
   cd frontend
   chmod +x build.sh
   ./build.sh
   ```
   This will create a production build in the `out` directory.

2. **Deploy to Hostinger**:
   - Log in to your Hostinger control panel
   - Go to "File Manager"
   - Navigate to your domain's public_html directory
   - Upload all contents from the `out` directory to this location

3. **Configure Domain**:
   - In Hostinger control panel, go to "Domains"
   - Select your domain
   - Point it to the public_html directory where you uploaded the frontend files

## Backend Deployment

1. **Prepare Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure Python Environment**:
   - Log in to Hostinger control panel
   - Go to "Advanced" → "Python"
   - Create a new Python application
   - Set the Python version to 3.9 or higher
   - Set the startup file to `app/main.py`
   - Set the application path to your backend directory

3. **Environment Variables**:
   - In Hostinger control panel, go to "Environment Variables"
   - Add the following variables:
     ```
     OPENAI_API_KEY=your_api_key
     VECTOR_DB_DIR=/path/to/vector_dbs
     ALLOWED_ORIGINS=https://yourdomain.com
     PORT=8000
     ```

4. **Upload Backend Files**:
   - Use FTP or File Manager to upload the backend files to your designated Python application directory

5. **Configure Domain for API**:
   - Create a subdomain (e.g., api.yourdomain.com)
   - Point it to your Python application
   - Configure SSL certificate for the subdomain

## Final Configuration

1. **Update Frontend API URL**:
   - Make sure the `.env.production` file in frontend has the correct API URL:
     ```
     NEXT_PUBLIC_API_URL=https://api.yourdomain.com
     ```

2. **CORS Configuration**:
   - In backend's `.env.production`, ensure ALLOWED_ORIGINS matches your frontend domain:
     ```
     ALLOWED_ORIGINS=https://yourdomain.com
     ```

3. **SSL Certificates**:
   - Enable SSL for both your main domain and API subdomain
   - You can use Hostinger's free SSL certificates

4. **Vector DB Directory**:
   - Create a directory for vector databases
   - Update VECTOR_DB_DIR in backend's .env.production
   - Ensure proper permissions are set

## Monitoring and Maintenance

1. **Check Logs**:
   - Monitor Python application logs in Hostinger control panel
   - Check for any errors or issues

2. **Backup**:
   - Regularly backup your vector database directory
   - Keep track of environment variables

3. **Updates**:
   - Regularly update dependencies
   - Monitor security advisories

## Troubleshooting

1. **CORS Issues**:
   - Verify ALLOWED_ORIGINS in backend configuration
   - Check frontend API URL configuration
   - Ensure SSL is properly configured

2. **Database Issues**:
   - Check vector database directory permissions
   - Verify path configuration
   - Monitor disk space

3. **API Connection Issues**:
   - Verify subdomain configuration
   - Check Python application status
   - Review application logs

## Security Considerations

1. **API Key Protection**:
   - Keep OpenAI API key secure
   - Use environment variables
   - Never expose keys in code

2. **File Permissions**:
   - Set appropriate permissions for uploaded files
   - Secure vector database directory

3. **SSL/TLS**:
   - Maintain valid SSL certificates
   - Force HTTPS for all connections

## Support

If you encounter any issues:
1. Check Hostinger's documentation
2. Review application logs
3. Contact Hostinger support if needed
