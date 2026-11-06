"""Serve static pages with Netlify-style extensionless HTML routes."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parts = urlsplit(self.path)
        route = self.translate_path(parts.path)
        if not Path(route).exists() and Path(route + '.html').is_file():
            self.path = parts.path + '.html' + ('?' + parts.query if parts.query else '')
        super().do_GET()
if __name__ == '__main__':
    print('Open http://localhost:8000')
    ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
