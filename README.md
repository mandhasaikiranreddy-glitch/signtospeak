# Sign2Speak — Real-Time Sign Language to English Translator (Demo Website)

A modern, responsive **frontend demo website** for a college/hackathon project:

**Sign2Speak – Real-Time Sign Language to English Translator**

Tagline: **Breaking Communication Barriers with AI**

This repository is **not a full backend implementation**. It provides:

- A clean project landing page explaining the problem and solution.
- A **working in-browser demo** that uses your webcam + **MediaPipe Hands** to detect hand landmarks in real time.
- A lightweight **gesture-to-text** example (rule-based) to simulate sign recognition.

## Project Type
- AI + Computer Vision based accessibility solution
- Academic / hackathon demo website
- Frontend-only (HTML, CSS, JavaScript)

## Live Demo (Working Preview)
The demo section can:
- Turn on your webcam
- Detect hand landmarks (MediaPipe)
- Draw landmarks on a canvas overlay
- Display a basic recognized phrase in English

### Demo Gesture Mapping (Rule-Based)
This is **not a trained ML classifier**; it’s a simple rules demo to feel like a working model.

- Open palm (all fingers extended) → `HELLO`
- Fist (no fingers extended) → `YES`
- Index + middle fingers extended → `THANK YOU`
- Index finger extended → `NO`
- Thumb only → `OK`
- Otherwise → `DETECTING...`

## Tech Stack
- **HTML + CSS + JavaScript**
- **MediaPipe Hands** (CDN)
- Optional **Web Speech API** (Text-to-Speech)

## How to Run
### Option A: Quick open (UI only)
You can open `index.html` directly to view the website layout.

However, **webcam access usually won’t work** when opening the file directly (browser security restrictions).

### Option B (Recommended): Run on localhost (webcam works)
Most browsers require camera access on **HTTPS** or **http://localhost**.

You can run a local server in the project folder.

#### Using Python (if installed)
```bash
python -m http.server 5500
```
Then open:

- http://localhost:5500

#### Using Node (if installed)
```bash
npx serve .
```
Then open the URL shown in your terminal.

## Files
- `index.html` — single-page website
- `styles.css` — styling (light theme, responsive layout, subtle animations)
- `script.js` — UI interactions + live demo logic (MediaPipe Hands)

## Links
- Demo Video: Placeholder in UI
- MVP Link: Placeholder in UI

## Team
- Team Name: **Sign2Speak**
- Team Leader: **M. Sai Kiran Reddy**

## Notes / Next Steps (to make it a real ML model)
To connect a real trained model (TensorFlow / TFJS / API):
- Replace the rule-based `classifyGesture(...)` logic in `script.js` with:
  - Feature extraction from landmarks
  - A trained classifier inference step
  - Smoothing / debouncing logic for stable predictions

## Disclaimer
This project is for **academic/hackathon purposes** and showcases an **accessibility-focused AI solution concept**.

