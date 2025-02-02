# Vector Database Builder

A modern web application for creating and managing vector databases from your documents. Built with Next.js and FastAPI.

## Features

- Create vector databases from uploaded documents
- Support for multiple embedding models
- Real-time processing status updates
- Modern, responsive UI
- RESTful API for integration

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vectorDBBuilder.git
cd vectorDBBuilder
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
# or
yarn install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
source venv/bin/activate  # On Windows use: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
# or
yarn dev
```

3. Open your browser and navigate to:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Backend Development

The backend is built with FastAPI and provides these endpoints:
- `POST /api/database/create` - Create a new database
- `GET /api/database/{database_id}/status` - Get database status
- More endpoints coming soon...

### Frontend Development

The frontend is built with Next.js 13+ and uses:
- TypeScript for type safety
- Tailwind CSS for styling
- Headless UI for components

## Amplify Deployment with GitHub Actions

This project uses AWS Amplify Gen 2 for the backend infrastructure and GitHub Actions for automated deployment.

### Setting up GitHub Actions Deployment

1. Create an IAM Role in AWS:
   - Go to AWS IAM Console
   - Create a new role for GitHub Actions
   - Add the following policies:
     - `AdministratorAccess-Amplify`
     - Necessary permissions for any additional AWS services you're using

2. Configure GitHub Repository Secrets:
   Navigate to your GitHub repository's Settings > Secrets and Variables > Actions and add the following secrets:
   - `AWS_ROLE_ARN`: The ARN of the IAM role created above
   - `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
   - `AWS_ACCESS_KEY_ID`: AWS access key with permission to assume the role
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key corresponding to the access key

3. Push to Main Branch:
   The GitHub Actions workflow will automatically:
   - Deploy the Amplify backend when pushing to the main branch
   - Run status checks on pull requests

### Local Development with Amplify

1. Install Amplify CLI:
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. Initialize Amplify:
   ```bash
   cd frontend
   amplify init
   ```

3. Pull the latest backend environment:
   ```bash
   amplify pull
   ```

### Amplify Configuration Files

The project uses two important configuration files for Amplify:

1. `amplify_outputs.json` (Production):
   - Generated automatically when deploying the Amplify backend
   - Contains AWS resource information (User Pools, API endpoints, etc.)
   - Created by GitHub Actions during deployment
   - Never commit this file to version control

2. `local-outputs.json` (Local Development):
   - Used for local development
   - Copy `local-outputs.template.json` to `local-outputs.json`
   - Fill in with your development environment values
   - Never commit this file to version control

Add both files to your `.gitignore`:
```bash
# Amplify configuration
amplify_outputs.json
local-outputs.json
```

### Amplify Backend Structure

The Amplify backend is organized as follows:
```
amplify/
├── auth/
│   └── resource.ts      # Authentication configuration
├── data/
│   └── resource.ts      # Data models and schema
├── backend.ts           # Main backend configuration
└── tsconfig.json        # TypeScript configuration
```

For more details on the Amplify implementation, see [AMPLIFY_GEN2_GUIDE.md](./AMPLIFY_GEN2_GUIDE.md).

## External API Usage

### Authentication
All external API requests require an API key. You can obtain an API key for a specific database from the dashboard or API Keys page. Each API key is associated with a specific database.

### Querying a Database
To query a database, make a POST request to:
```
POST http://localhost:8000/api/v1/database/external/query
```

Parameters (form data):
- `query` (required): The text query to search for
- `api_key` (required): Your API key (determines which database to query)
- `n_results` (optional): Number of results to return (default: 5)
- `model` (optional): Embedding model to use (default: "text-embedding-ada-002")

Example request using curl:
```bash
curl -X POST http://localhost:8000/api/v1/database/external/query \
  -F "query=your search query" \
  -F "api_key=your-api-key" \
  -F "n_results=5"
```

Example response:
```json
{
  "query": "your search query",
  "database_name": "Technical Documentation",
  "results": [
    {
      "text": "Relevant text snippet from the database",
      "source": "original_file.pdf",
      "score": 0.89
    },
    ...
  ]
}
```

Error Responses:
- 401: Invalid API key
- 404: Database not found
- 400: Database is not ready for querying
- 500: Internal server error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js and FastAPI
- UI components from Tailwind and Headless UI
- Vector embeddings powered by various models
