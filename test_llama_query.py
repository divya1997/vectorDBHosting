import requests
import json
import argparse
import sys

def query_vector_db(query: str, api_key: str) -> dict:
    """Query the vector database using the external API"""
    url = "http://localhost:8000/api/v1/database/external/query"
    
    data = {
        "query": query,
        "api_key": api_key,
        "n_results": 5
    }
    
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()  # Raise exception for non-200 status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying vector database: {str(e)}")
        if hasattr(e.response, 'text'):
            print(f"Server response: {e.response.text}")
        sys.exit(1)

def query_llama(prompt: str) -> str:
    """Query the local Llama server"""
    url = "http://localhost:8080/completion"
    
    data = {
        "prompt": prompt,
        "n_predict": 512,
        "temperature": 0.7,
        "stop": ["</answer>", "Human:", "Assistant:"]  # Stop tokens
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()["content"]
    except requests.exceptions.RequestException as e:
        print(f"Error querying Llama: {str(e)}")
        sys.exit(1)

def format_prompt(query: str, context: list) -> str:
    """Format the prompt with context for Llama"""
    prompt = "Human: Use the following context to answer the question. Only use information from the context. If you can't answer the question based on the context, say 'I don't have enough information to answer that.'\n\n"
    
    prompt += "Context:\n"
    for idx, result in enumerate(context, 1):
        source = result.get('source', 'unknown')
        text = result.get('text', '').strip()
        score = result.get('score', 0)
        prompt += f"{idx}. [{source}] (relevance: {score:.2f}): {text}\n"
    
    prompt += f"\nQuestion: {query}\n\nAssistant: Let me help you with that question based on the provided context.\n"
    return prompt

def main():
    parser = argparse.ArgumentParser(description='Query vector database and Llama')
    parser.add_argument('--api-key', required=True, help='API key for the vector database')
    parser.add_argument('--query', required=True, help='Query to search for')
    parser.add_argument('--debug', action='store_true', help='Print debug information')
    args = parser.parse_args()
    
    # Step 1: Query vector database for context
    print("\n1. Querying vector database for context...")
    try:
        db_response = query_vector_db(args.query, args.api_key)
        
        if args.debug:
            print("\nRaw DB Response:")
            print(json.dumps(db_response, indent=2))
        
        if not db_response.get('results'):
            print("No results found in the database.")
            sys.exit(1)
            
        print(f"\nFound {len(db_response['results'])} relevant passages from: {db_response.get('database_name', 'unknown')}")
        
        # Step 2: Format prompt with context
        print("\n2. Formatting prompt with context...")
        prompt = format_prompt(args.query, db_response['results'])
        
        # Optional: Print prompt for debugging
        print("\nPrompt:")
        print("-" * 80)
        print(prompt)
        print("-" * 80)
        
        # Step 3: Query Llama
        print("\n3. Querying Llama...")
        llama_response = query_llama(prompt)
        
        # Print final answer
        print("\nLlama's Answer:")
        print("-" * 80)
        print(llama_response.strip())
        print("-" * 80)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
