from http.server import BaseHTTPRequestHandler
import json
import time

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        health_data = {
            "status": "healthy",
            "service": "Enhanced Legal Clause Analyzer",
            "version": "2.0-enhanced-vercel",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "message": "API is running successfully"
        }
        
        self.wfile.write(json.dumps(health_data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()