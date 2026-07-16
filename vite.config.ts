import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Use VITE_API_BASE_URL if it's a full URL, otherwise fallback to local backend on 8080
  const apiTarget = env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.startsWith("http")
    ? env.VITE_API_BASE_URL
    : "http://127.0.0.1:8080/api";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

