import json
from db_utils import (
    create_database,
    get_database,
    list_databases,
    update_database,
    delete_database
)

def handler(event, context):
    print('received event:', event)
    
    http_method = event.get('httpMethod', '')
    path_parameters = event.get('pathParameters', {})
    body = {}
    if event.get('body'):
        body = json.loads(event.get('body'))
    
    try:
        response_body = {}
        status_code = 200
        
        if http_method == 'GET':
            if path_parameters and path_parameters.get('db_name'):
                # Get specific database
                db_name = path_parameters['db_name']
                response_body = get_database(db_name)
                if not response_body:
                    status_code = 404
                    response_body = {'error': f'Database {db_name} not found'}
            else:
                # List all databases
                response_body = list_databases()
        
        elif http_method == 'POST':
            # Create new database
            db_name = body.get('db_name')
            description = body.get('description', '')
            if not db_name:
                status_code = 400
                response_body = {'error': 'db_name is required'}
            else:
                response_body = create_database(db_name, description)
                status_code = 201
        
        elif http_method == 'PUT':
            # Update database
            db_name = path_parameters.get('db_name')
            if not db_name:
                status_code = 400
                response_body = {'error': 'db_name is required'}
            else:
                response_body = update_database(db_name, body)
                if not response_body:
                    status_code = 404
                    response_body = {'error': f'Database {db_name} not found'}
        
        elif http_method == 'DELETE':
            # Delete database
            db_name = path_parameters.get('db_name')
            if not db_name:
                status_code = 400
                response_body = {'error': 'db_name is required'}
            else:
                response_body = delete_database(db_name)
                if not response_body:
                    status_code = 404
                    response_body = {'error': f'Database {db_name} not found'}
        
        else:
            status_code = 400
            response_body = {'error': f'Unsupported method: {http_method}'}
        
        return {
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
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
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
            },
            'body': json.dumps({'error': str(e)})
        }