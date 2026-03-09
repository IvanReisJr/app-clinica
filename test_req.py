import requests

# 1. Login to get token
login_data = {
    'username': 'admin',
    'password': '123'
}
try:
    auth_resp = requests.post('http://127.0.0.1:8000/api/v1/auth/login/', data=login_data)
    auth_resp.raise_for_status()
    token = auth_resp.json().get('access')
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 2. Make the POST request
    data = {
        'name': 'São Carlos',
        'specialty': 'dddddd',
        'crm': '3123123123',
        'phone': '(21) 981239054',
        'email': 'eu@nao.sei'
    }
    resp = requests.post('http://127.0.0.1:8000/api/v1/professionals/', json=data, headers=headers)
    print(f'Status: {resp.status_code}')
    print(f'Body: {resp.text}')
except Exception as e:
    print(f'Error: {e}')
