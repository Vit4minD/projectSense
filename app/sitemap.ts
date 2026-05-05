import type { MetadataRoute } from "next";

const BASE_URL = "https://project-sense.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/register`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE_URL}/home`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/multiplayer`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/testGen`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/twenty-four`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/zetamac`, lastModified, changeFrequency: "weekly", priority: 0.6 },
  ];
}
