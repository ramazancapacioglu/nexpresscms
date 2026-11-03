/** Yerleşik çizgi simgeleri (24×24, `stroke="currentColor"`). Ad → SVG yolu; liste kapalıdır, bilinmeyen ad "yıldız"a düşmez, çizilmez. */
export const ICON_PATHS: Record<string, string> = {
  check: "M20 6 9 17l-5-5",
  star: "m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z",
  heart: "M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  "map-pin": "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  shield: "M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6zM9 12l2 2 4-4",
  zap: "M13 2 4 14h7l-1 8 9-12h-7z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0",
  users: "M9 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2 20a7 7 0 0 1 14 0M16 6a3 3 0 0 1 0 6M18 14a6 6 0 0 1 4 6",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  download: "M12 3v12m-5-5 5 5 5-5M4 21h16",
  lock: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  award: "M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 14 7 22l5-3 5 3-1.5-8",
  rocket: "M5 19c0-3 1-5 3-7l4 4c-2 2-4 3-7 3zM12 12c0-5 4-9 9-9 0 5-4 9-9 9zM14 8.5h.01",
  chart: "M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3",
  home: "M3 11 12 3l9 8M5 10v10h14V10M10 20v-6h4v6",
  cart: "M3 4h3l2 11h10l2-8H7M10 20a1 1 0 1 0 0 .01M17 20a1 1 0 1 0 0 .01",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7C9 7 8 4 10 4s2 3 2 3zm0 0c3 0 4-3 2-3s-2 3-2 3z",
  message: "M4 5h16v11H9l-5 4z",
};

export const ICON_NAMES = Object.keys(ICON_PATHS);
