import boto3
import json
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

def get_table():
    dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table('Usage')

def log_usage(db_name, operation_type):
    table = get_table()
    try:
        item = {
            'db_name': db_name,
            'timestamp': int(datetime.now().timestamp()),
            'operation_type': operation_type
        }
        table.put_item(Item=item)
        return item
    except ClientError as e:
        print(f"Error logging usage: {e.response['Error']['Message']}")
        raise

def get_usage_stats(db_name=None, days=30):
    table = get_table()
    start_time = int((datetime.now() - timedelta(days=days)).timestamp())
    
    try:
        if db_name:
            # Get usage for specific database
            response = table.query(
                KeyConditionExpression='db_name = :db_name AND #ts >= :start_time',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':db_name': db_name,
                    ':start_time': start_time
                }
            )
        else:
            # Get usage for all databases
            response = table.scan(
                FilterExpression='#ts >= :start_time',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={':start_time': start_time}
            )
        
        items = response.get('Items', [])
        
        # Aggregate usage statistics
        stats = {}
        for item in items:
            db = item['db_name']
            op_type = item['operation_type']
            
            if db not in stats:
                stats[db] = {}
            
            if op_type not in stats[db]:
                stats[db][op_type] = 0
            
            stats[db][op_type] += 1
        
        return stats
        
    except ClientError as e:
        print(f"Error getting usage stats: {e.response['Error']['Message']}")
        raise
