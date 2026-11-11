import os

# Automatically change directory into backend/ when gunicorn is launched from repo root
chdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
