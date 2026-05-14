import type { MetadataRoute } from "next";

const BASE_URL = "https://project-sense.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE_URL}/leaderboard`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/multiplayer`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/test`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/games`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/games/twenty-four`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/games/zetamac`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/profile`, lastModified, changeFrequency: "daily", priority: 0.5 },
  ];
}
