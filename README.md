# Wedding Guest Check-In App

This is a web-based guest check-in application created for Enshuo and Jolene's wedding. It allows guests to search their names, confirm attendance, leave a message, and receive event and seating information.

## Features

- Live guest name search with fuzzy matching
- Selectable party member check-in
- Optional message input for well wishes
- Confirmation section with table number and event schedule
- Mobile-friendly design with elegant styling
- Serverless backend using Netlify functions

## Tech Stack

- HTML, Tailwind CSS
- Vanilla JavaScript
- Netlify Functions (serverless backend)
- Environment-configured endpoints for fetching and submitting guest data

## Project Structure

/assets/ # Contains images like couple photo and table map
index.html # Main HTML file
script.js # Client-side logic for guest search and check-in
fetch-guests.js # Serverless function to fetch guest data
submit-checkin.js # Serverless function to handle check-in submission
google-script.js #Sample google script

## Setup and Deployment

1. **Clone the repository**

   git clone https://github.com/your-username/wedding-checkin.git
   cd wedding-checkin

2. **Configure environment variables**

Set the following environment variable on Netlify:
GOOGLE_SCRIPT_URL=https://your-backend-endpoint.com/api

This should be a valid endpoint returning a JSON guest list for fetch-guests, and accepting POST data for submit-checkin.

## Deploy on Netlify

- Connect the repository to Netlify
- Set the environment variable above
- Deploy the site

Notes
- The guest list is fetched from a google sheets via Google Scripts URL
- Submissions are posted in plain text format to the same endpoint
- Ensure all assets such as couple pic.jpg and map.jpeg are correctly placed in the assets/ folder


