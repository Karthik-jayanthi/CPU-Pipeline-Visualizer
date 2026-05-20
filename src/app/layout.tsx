import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "CPU Pipeline Visualizer",
  description:
    "Interactive 5-stage MIPS pipeline simulation with hazard detection, forwarding, and performance analytics.",
  keywords: ["CPU", "pipeline", "MIPS", "computer architecture", "hazard detection"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
