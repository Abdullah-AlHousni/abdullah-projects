import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1DA1F2",
          dark: "#1A91DA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
