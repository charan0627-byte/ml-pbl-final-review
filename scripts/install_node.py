import os
import sys
import urllib.request
import zipfile

NODE_URL = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
TOOLS_DIR = os.path.join(os.path.dirname(__file__), "..", "tools")
NODE_DIR = os.path.join(TOOLS_DIR, "node")
ZIP_PATH = os.path.join(TOOLS_DIR, "node.zip")

def install_node():
    os.makedirs(TOOLS_DIR, exist_ok=True)
    node_exe = os.path.join(NODE_DIR, "node-v20.18.0-win-x64", "node.exe")
    if os.path.exists(node_exe):
        print(f"Node.js already installed at {node_exe}")
        return node_exe

    print(f"Downloading Node.js from {NODE_URL}...")
    urllib.request.urlretrieve(NODE_URL, ZIP_PATH)
    print("Extracting Node.js...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(NODE_DIR)
    
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
    
    print(f"Node.js installed successfully at {node_exe}")
    return node_exe

if __name__ == "__main__":
    install_node()
