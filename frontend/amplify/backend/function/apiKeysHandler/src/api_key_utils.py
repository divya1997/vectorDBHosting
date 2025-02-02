import boto3
import json
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

def get_table():
    dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table('ApiKeys')

def generate_api_key():
    return str(uuid.uuid4())

def create_api_key():
    table = get_table()
    api_key = generate_api_key()
    try:
        item = {
            'api_key': api_key,
            'created_at': int(datetime.now().timestamp()),
            'status': 'active'
        }
        table.put_item(Item=item)
        return item
    except ClientError as e:
        print(f"Error creating API key: {e.response['Error']['Message']}")
        raise

def list_api_keys():
    table = get_table()
    try:
        response = table.scan()
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error listing API keys: {e.response['Error']['Message']}")
        raise

def delete_api_key(api_key):
    table = get_table()
    try:
        response = table.delete_item(
            Key={'api_key': api_key},
            ReturnValues="ALL_OLD"
        )
        return response.get('Attributes')
    except ClientError as e:
        print(f"Error deleting API key: {e.response['Error']['Message']}")
        raise

def validate_api_key(api_key):
    table = get_table()
    try:
        response = table.get_item(Key={'api_key': api_key})
        item = response.get('Item')
        return item is not None and item.get('status') == 'active'
    except ClientError as e:
        print(f"Error validating API key: {e.response['Error']['Message']}")
        raise
