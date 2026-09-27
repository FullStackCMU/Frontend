import { defineConfig, type Plugin } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// ลำดับ CSS layer ของทั้งแอป (ต้องตรงกับ src/index.css)
const LAYER_ORDER =
  "@layer properties, theme, base, legacy, app, components, utilities;";

// ระหว่างย้าย UI ไป Tailwind: หน้าเดิมยังใช้ Pico เฉพาะใน .pico
// pico.conditional ใส่ ".pico " นำหน้าทุก selector ทำให้ specificity สูงขึ้น 1 class
// จนชนะ CSS เดิมใน styles/ → เปลี่ยนเป็น :where(.pico) ให้ specificity เท่า Pico ปกติ
// แล้วครอบด้วย layer legacy (อยู่เหนือ preflight แต่ต่ำกว่า utility ของ Tailwind)
// ย้ายหน้าครบแล้ว: ลบ plugin นี้ + import ใน main.tsx
function legacyPico(): Plugin {
  return {
    name: "legacy-pico",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("pico.conditional")) return;
      const scoped = code
        .replace(/@charset[^;]*;/, "")
        .replace(/\.pico(?![\w-])/g, ":where(.pico)");
      return {
        code: `${LAYER_ORDER}\n@layer legacy {\n${scoped}\n}`,
        map: null,
      };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    legacyPico(),
  ],

  server: {
    // https://stackoverflow.com/a/74430384
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (_, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
  },
});
