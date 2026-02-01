"""
Thread Heaven - Flask Server
Run with: python app.py
"""

from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# Serve index.html at root
@app.route('/')
def index():
    return send_file('index.html')

# Serve admin dashboard
@app.route('/admin')
@app.route('/admin.html')
def admin():
    return send_file('admin.html')

# Serve static files (js, css, assets)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("\n* Thread Heaven Server")
    print("=" * 40)
    print("Store:  http://localhost:5000")
    print("Admin:  http://localhost:5000/admin")
    print("=" * 40 + "\n")
    app.run(debug=True, port=5000)
