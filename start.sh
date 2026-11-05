#!/bin/bash
# Sales Buddy 3.0 - Start Script
echo "Starting Sales Buddy 3.0..."
cd "$(dirname "$0")/backend"
python3 app.py
