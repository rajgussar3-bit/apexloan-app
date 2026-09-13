import os
import sys
from flask import Flask, send_from_directory, request, Response, redirect
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR)

VERCEL_BACKEND_API = "https://nbfc-loan-app.vercel.app/api"

@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/apply')
@app.route('/apply.html')
def apply_page():
    return send_from_directory(BASE_DIR, 'apply.html')

@app.route('/login')
@app.route('/login.html')
def login_page():
    return send_from_directory(BASE_DIR, 'login.html')

@app.route('/dashboard')
@app.route('/dashboard.html')
def dashboard_page():
    return send_from_directory(BASE_DIR, 'dashboard.html')

# Forward all /api requests directly to Vercel backend
@app.route('/api/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_api(subpath):
    if request.method == 'OPTIONS':
        return Response('', status=200, headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        })

    target_url = f"{VERCEL_BACKEND_API}/{subpath}"
    headers = {k: v for k, v in request.headers if k.lower() not in ['host', 'content-length']}

    try:
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=request.get_data(),
            allow_redirects=False,
            timeout=15
        )
        res_headers = [(name, value) for (name, value) in resp.raw.headers.items()
                       if name.lower() not in ['content-encoding', 'content-length', 'transfer-encoding', 'connection']]
        res_headers.append(('Access-Control-Allow-Origin', '*'))
        return Response(resp.content, resp.status_code, res_headers)
    except Exception as e:
        return Response(f'{{"error": "{str(e)}"}}', status=500, mimetype='application/json')

@app.route('/<path:filename>')
def static_files(filename):
    filepath = os.path.join(BASE_DIR, filename)
    if os.path.exists(filepath) and not os.path.isdir(filepath):
        return send_from_directory(BASE_DIR, filename)
    return redirect('/')

application = app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
