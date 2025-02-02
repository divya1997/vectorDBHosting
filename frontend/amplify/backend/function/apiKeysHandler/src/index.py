import json
from api_key_utils import (
    create_api_key,
    list_api_keys,
    delete_api_key,
    validate_api_key
)

def handler(event, context):
    print('received event:', event)
    
    http_method = event.get('httpMethod', '')
    path_parameters = event.get('pathParameters', {})
    
    try:
        response_body = {}
        status_code = 200
        
        if http_method == 'GET':
            if path_parameters and path_parameters.get('api_key'):
                # Validate specific API key
                api_key = path_parameters['api_key']
                is_valid = validate_api_key(api_key)
                response_body = {'api_key': api_key, 'valid': is_valid}
            else:
                # List all API keys
                response_body = list_api_keys()
        
        elif http_method == 'POST':
            # Create new API key
            response_body = create_api_key()
            status_code = 201
        
        elif http_method == 'DELETE':
            # Delete API key
            api_key = path_parameters.get('api_key')
            if not api_key:
                status_code = 400
                response_body = {'error': 'api_key is required'}
            else:
                response_body = delete_api_key(api_key)
                if not response_body:
                    status_code = 404
                    response_body = {'error': f'API key {api_key} not found'}
        
        else:
            status_code = 400
            response_body = {'error': f'Unsupported method: {http_method}'}
        
        return {
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
            },
            'body': json.dumps({'error': str(e)})
        }