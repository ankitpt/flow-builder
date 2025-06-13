import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env vars based on current mode (e.g., 'production')
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      // Make the env var available to the frontend
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
    },
    server: {
      proxy: {
        "/api": {
          target: env.API_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
