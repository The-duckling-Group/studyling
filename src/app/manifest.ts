import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Studyling", short_name: "Studyling", description: "Alles, was du für die Schule lernen musst.", start_url: "/", display: "standalone", background_color: "#f7f8fc", theme_color: "#6257e7", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }; }
