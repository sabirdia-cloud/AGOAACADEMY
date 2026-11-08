import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  
  app.use(vite.middlewares);

  // Serve index.html for all routes (SPA fallback)
  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;
      // In dev, Vite handles the index.html serving via its middleware
      // but we can also explicitly serve it if needed.
      // Since appType is 'spa', Vite middleware already handles this.
    } catch (e) {
      console.error(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
