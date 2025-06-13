# Onebox Email Aggregator

This example project collects emails from IMAP, categorizes them using an AI model, and indexes the results into Elasticsearch for search.

## Groq Cloud setup

The AI categorization uses the [Groq Cloud](https://console.groq.com/home) API. You can provide these environment variables:

- `GROQ_API_KEY` – your Groq Cloud API key
- `GROQ_API_URL` – optional override for the API endpoint (defaults to `https://api.groq.com/openai/v1/chat/completions`)
- `GROQ_MODEL` – model name (defaults to `groq-1`)

This project uses the official [`groq-sdk`](https://www.npmjs.com/package/groq-sdk) to talk to the API.

Run `npm run build` to compile the TypeScript source and `npm start` to launch the server.
