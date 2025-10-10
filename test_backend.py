import requests

# Test your backend
backend_url = "https://excel-gpt-zeta.vercel.app"

try:
    # Test health endpoint
    response = requests.get(f"{backend_url}/health")
    print(f"Health check: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test data info endpoint
    response = requests.get(f"{backend_url}/data/info")
    print(f"Data info: {response.status_code}")
    if response.status_code == 200:
        print(f"Data info: {response.json()}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error connecting to backend: {e}")
