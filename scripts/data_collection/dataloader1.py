import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Base directory URL
BASE_URL = "https://www.circl.lu/opendata/datasets/circl-phishing-dataset-01/Clean_phishing/"

# Create output folder
os.makedirs("clean_phishing_images", exist_ok=True)

# Fetch directory page
response = requests.get(BASE_URL)
soup = BeautifulSoup(response.text, "html.parser")

# Allowed image extensions
image_ext = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp")

# Find all links on the page
links = soup.find_all("a")

print("Downloading images...")

for link in links:
    file_name = link.get("href")

    # Skip parent directory and non-files
    if not file_name or not file_name.lower().endswith(image_ext):
        continue
    
    # Build full URL
    file_url = urljoin(BASE_URL, file_name)
    save_path = os.path.join("clean_phishing_images", file_name)

    try:
        img_data = requests.get(file_url).content
        with open(save_path, "wb") as f:
            f.write(img_data)
        print(f"Downloaded: {file_name}")
    except Exception as e:
        print(f"Failed: {file_name} → {e}")

print("✔ All images downloaded successfully!")
