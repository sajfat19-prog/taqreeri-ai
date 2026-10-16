# تقريري AI — Taqreeri AI

A bilingual Arabic/English academic report generator. Features include title suggestions, a student/stage cover, adjustable approximate length, Arabic RTL support, and browser-based PDF export.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Set `OPENAI_API_KEY` in your local environment (never commit the key).
4. Run `npm start` and open `http://localhost:3000`.

## Deploy on Railway

1. Create a GitHub repository and upload these project files to its root.
2. In Railway, create a project/service from that GitHub repository and branch `main`.
3. In Railway → service → Variables, add `OPENAI_API_KEY` with your private API key. Optionally add `OPENAI_MODEL=gpt-4o-mini`.
4. Deploy. Railway will run `npm start`; the server listens on `PORT`.
5. Generate a public Railway domain from the service's Networking/Domains section.

## Security and limitations

- The OpenAI key is only read by the server and is never sent to the browser.
- PDF export runs in the browser using html2pdf.js; internet access is needed to load the PDF library and web fonts.
- Page count is an approximate target. PDF pagination depends on content and fonts.
- AI-generated citations and suggested sources should be checked before submission.
- Add authentication, rate limiting, and abuse controls before opening the service to large-scale public use.
