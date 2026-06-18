import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function apiProxy() {
  let apiKey;
  return {
    name: 'api-proxy',
    configureServer(server) {
      apiKey = loadEnv('', process.cwd(), 'GROQ_').GROQ_API_KEY;

      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'GROQ_API_KEY not set in .env' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        const { messages } = JSON.parse(body);

        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              max_tokens: 1000,
              messages,
            }),
          });

          const data = await response.json();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to reach Groq API' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiProxy()],
})
