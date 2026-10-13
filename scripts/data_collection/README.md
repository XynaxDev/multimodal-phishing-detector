# Ph5 Visual Dataset Collection & Ingestion Pipeline

This directory contains the automated data ingestion and web scraping scripts used to assemble the multimodal visual dataset (**2,915 screenshots**) for the Ph5 phishing detector.

---

## 1. Visual Corpus Provenance Overview

The 2,915 deduplicated screenshots in [`data/images/image_splits.csv`](../../data/images/image_splits.csv) originate from four primary sources:

| Source | Class | Sample Count | Methodology / File Identifier |
| :--- | :--- | :---: | :--- |
| **Kaggle Web Collections** | Benign (Class 0) | **1,101** | Public genuine landing pages (`genuine_*.png`) |
| **Kaggle Web Phishing** | Phishing (Class 1) | **515** | Public phishing clones (`phishing_*.png`) |
| **CIRCL Luxembourg** | Phishing (Class 1) | **444** | Automated BeautifulSoup scraper (`dataloader1.py`) from CIRCL `Clean_phishing/` |
| **OpenPhish Live Feed** | Phishing (Class 1) | **273** | Automated Selenium Headless Chrome (`datamaker.py`) from `openphish.com/feed.txt` |
| **Top-Domain Benign Scraping** | Benign (Class 0) | **501** | Multi-path Selenium Headless Chrome (`datamaker.py`, `benign_*.png`) |
| **Multi-Path & Incidents** | Mixed (46 B / 35 P) | **81** | Alexa/Tranco top domains (`/about`, `/contact`) + curated incidents |
| **Grand Total** | **1,648 Benign / 1,267 Phish** | **2,915** | SHA-256 deduplicated, stratified 70/15/15 partitions |

---

## 2. Ingestion Scripts

### A. `dataloader1.py` (CIRCL Open Security Repository Ingestion)
- **Target URL:** `https://www.circl.lu/opendata/datasets/circl-phishing-dataset-01/Clean_phishing/`
- **Mechanism:** Programmatic BeautifulSoup4 directory traversal downloading raw PNG/JPEG screenshot artifacts.
- **Why CIRCL has ~460 images:** The public CIRCL clean phishing dataset archive contains ~460 total images. This script downloaded all **444 active screenshots** from the directory (identifiable by their 4-word random slug filenames, e.g., `able-yellow-defective-variety.png`).

### B. `datamaker.py` (Live OpenPhish & Benign Screenshot Automation)
- **Mechanism:** Automated Google Chrome running in headless mode via Selenium WebDriver (`ChromeDriverManager` at $1920 \times 1080$ resolution with a 10s timeout and 2.0s DOM render delay).
- **Phishing Stream (`download_phishing_screenshots`):** Reads live URLs from `https://openphish.com/feed.txt` and captures active landing pages before domain suspension (saved as `phish_0000.png` through `phish_0272.png`, 273 samples).
- **Benign Stream (`download_benign_screenshots`):** Traverses 60 verified legitimate domains across multiple structural paths (`/about`, `/contact`, `/news`, `/help`, `/blog`) to avoid bare-domain memorization (saved as `benign_0000.png` through `benign_0500.png`, 501 samples).

---

## 3. Dataset Verification & Splits
All 2,915 images are indexed with cryptographic SHA-256 hashes and stratified into:
- **Training Set (70%):** 2,039 images (1,152 benign, 887 phishing)
- **Validation Set (15%):** 438 images (248 benign, 190 phishing)
- **Held-Out Test Set (15%):** 438 images (248 benign, 190 phishing)

Split assignments are stored in [`data/images/image_splits.csv`](../../data/images/image_splits.csv) and generated deterministically via [`ml/build_global_splits.py`](../../ml/build_global_splits.py).
