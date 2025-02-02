import json
from usage_utils import (
    log_usage,
    get_usage_stats
)

def handler(event, context):
    print('received event:', event)
    
    http_method = event.get('httpMethod', '')
    path_parameters = event.get('pathParameters', {})
    query_parameters = event.get('queryStringParameters', {})
    body = {}
    if event.get('body'):
        body = json.loads(event.get('body'))
    
    try:
        response_body = {}
        status_code = 200
        
        if http_method == 'GET':
            # Get usage statistics
            db_name = path_parameters.get('db_name')
            days = int(query_parameters.get('days', 30))
            response_body = get_usage_stats(db_name, days)
        
        elif http_method == 'POST':
            # Log usage
            db_name = body.get('db_name')
            operation_type = body.get('operation_type')
            
            if not db_name or not operation_type:
                status_code = 400
                response_body = {'error': 'db_name and operation_type are required'}
            else:
                response_body = log_usage(db_name, operation_type)
                status_code = 201
        
        else:
            status_code = 400
            response_body = {'error': f'Unsupported method: {http_method}'}
        
        return {
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
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
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({'error': str(e)})
        }