from flask import Flask, render_template, request, jsonify, send_file
import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
import shutil
import os

# Counter to keep track of the number of submissions
submission_counter = 0

# Flag to indicate if submissions are closed
submissions_closed = False

new_filename = ""

app = Flask(__name__)


# Load dictionary from JSON file
def load_from_json(filename='channel_data.json'):
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        return {}
    except Exception as e:
        print(f"An error occurred while loading from JSON: {e}")
        return {}


# Save dictionary to JSON file
def save_to_json(data, filename='channel_data.json'):
    try:
        with open(filename, 'w') as f:
            json.dump(data, f)
        return True
    except Exception as e:
        print(f"An error occurred while saving to JSON: {e}")
        return False


# Load existing channel data
channel_data = load_from_json()


# Sanitize channel names by removing symbols
def sanitize_channel_name(name):
    return re.sub(r'[^a-zA-Z0-9]', '', name)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_channel_id', methods=['POST'])
def get_channel_id():
    global submission_counter, submissions_closed

    # Check if submissions are closed
    if submissions_closed:
        return jsonify({'status': 'closed', 'message': 'Submissions are closed.'})

    # Increment the counter
    submission_counter += 1

    # Check if the counter has reached the maximum limit
    if submission_counter >= 10:
        submissions_closed = True
        return jsonify({'status': 'closed', 'message': 'Maximum number of submissions reached.'})

    url = request.json.get('url', '')
    channel_name = url.split("@")[-1] if "@" in url else "Unknown"
    sanitized_channel_name = sanitize_channel_name(channel_name)

    if sanitized_channel_name in channel_data:
        return jsonify({"channel_id": channel_data[sanitized_channel_name]})

    try:
        response = requests.get(url)
        if response.status_code != 200:
            return jsonify({"error": "Could not fetch the webpage."}), 400

        soup = BeautifulSoup(response.text, 'html.parser')
        rss_link = soup.find("link", {"type": "application/rss+xml"})

        if rss_link:
            href = rss_link.get("href", "")
            match = re.search("channel_id=([a-zA-Z0-9_-]+)", href)
            if match:
                channel_id = match.group(1)
                channel_data[sanitized_channel_name] = channel_id
                save_to_json(channel_data)
                return jsonify({"channel_id": channel_id})
            else:
                return jsonify({"error": "Could not find channel ID."}), 400
        else:
            return jsonify({"error": "RSS link not found."}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500


@app.route('/download_json', methods=['GET'])
def download_json():
    global submissions_closed, new_filename

    # Check if submissions are closed
    if not submissions_closed:
        return jsonify({'status': 'error', 'message': 'Submissions are still open. Cannot download yet.'})

    # Rename the JSON file to include a timestamp
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{timestamp}_channel_data.json"
    shutil.copy('channel_data.json', new_filename)

    # Serve the JSON file for download
    try:
        return send_file(new_filename, as_attachment=True)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'An error occurred: {e}'})


@app.route('/get_json_data', methods=['GET'])
def get_json_data():
    global submissions_closed, new_filename  # Assuming you have a variable to track this and the new filename
    if submissions_closed:
        with open(new_filename, 'r') as f:
            json_data = json.load(f)
        return jsonify({'status': 'success', 'data': json_data})
    else:
        return jsonify({'status': 'error', 'message': 'Submissions are still open.'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use the PORT environment variable provided by Heroku; default to 5000 for local development
    app.run(host='0.0.0.0', port=port)

