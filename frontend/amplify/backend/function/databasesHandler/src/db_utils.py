import boto3
import json
from datetime import datetime
from botocore.exceptions import ClientError

def get_table():
    dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table('Databases')

def create_database(db_name, description=""):
    table = get_table()
    try:
        item = {
            'db_name': db_name,
            'description': description,
            'created_at': int(datetime.now().timestamp()),
            'status': 'active'
        }
        table.put_item(Item=item)
        return item
    except ClientError as e:
        print(f"Error creating database: {e.response['Error']['Message']}")
        raise

def get_database(db_name):
    table = get_table()
    try:
        response = table.get_item(Key={'db_name': db_name})
        return response.get('Item')
    except ClientError as e:
        print(f"Error getting database: {e.response['Error']['Message']}")
        raise

def list_databases():
    table = get_table()
    try:
        response = table.scan()
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error listing databases: {e.response['Error']['Message']}")
        raise

def update_database(db_name, updates):
    table = get_table()
    update_expression = "SET "
    expression_values = {}
    
    for key, value in updates.items():
        if key != 'db_name':  # Skip primary key
            update_expression += f"#{key} = :{key}, "
            expression_values[f":{key}"] = value
    
    try:
        if expression_values:
            response = table.update_item(
                Key={'db_name': db_name},
                UpdateExpression=update_expression.rstrip(", "),
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames={f"#{k}": k for k in updates.keys() if k != 'db_name'},
                ReturnValues="ALL_NEW"
            )
            return response.get('Attributes')
    except ClientError as e:
        print(f"Error updating database: {e.response['Error']['Message']}")
        raise

def delete_database(db_name):
    table = get_table()
    try:
        response = table.delete_item(
            Key={'db_name': db_name},
            ReturnValues="ALL_OLD"
        )
        return response.get('Attributes')
    except ClientError as e:
        print(f"Error deleting database: {e.response['Error']['Message']}")
        raise
