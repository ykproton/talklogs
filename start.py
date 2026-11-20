from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

if __name__ == "__main__":
    url = "http://127.0.0.1:8765/"
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent / "dist"))
    with ThreadingHTTPServer(("127.0.0.1", 8765), handler) as server:
        print("Open " + url + " (Ctrl+C to stop)", flush=True)
        webbrowser.open(url)
        server.serve_forever()
