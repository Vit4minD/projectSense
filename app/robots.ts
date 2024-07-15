import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
            }
        ],
        sitemap: "https://project-sense.vercel.app/sitemap.xml"
    }
}