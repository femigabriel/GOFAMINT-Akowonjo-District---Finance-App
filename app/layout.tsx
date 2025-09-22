// app/layout.tsx
import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import { ConfigProvider } from "antd";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "GOFAMINT Akowonjo District - Finance App",
  description: "Finance management system for GOFAMINT assemblies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/images/Gofamint_logo" />
      </head>
      <body>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1e3a8a",
              borderRadius: 8,
              fontFamily: "Inter, sans-serif",
            },
          }}
        >
          <AuthProvider>{children}</AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
