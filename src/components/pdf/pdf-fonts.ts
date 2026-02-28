import { Font } from "@react-pdf/renderer";

// Register Inter font family with 3 weights for PDF rendering.
// Font files served from public/ directory via Next.js static file serving.
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Inter-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
  ],
});

// Disable hyphenation — Spanish text should not be auto-hyphenated
Font.registerHyphenationCallback((word) => [word]);
