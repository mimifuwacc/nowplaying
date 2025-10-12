"use client";

import { useEffect } from "react";

interface RedirectProps {
  url: string;
}

// 安全なURLスキーマを検証する関数（クライアントサイド用）
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // 許可するプロトコルのみ
    const allowedProtocols = ["http:", "https:"];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    // URL.parseでエラーの場合は無効なURL
    return false;
  }
}

export default function Redirect({ url }: RedirectProps) {
  useEffect(() => {
    // クライアントサイドでもURLの安全性を再検証
    if (isValidUrl(url)) {
      // ページが読み込まれたら安全なURLにリダイレクト
      window.location.href = url;
    } else {
      console.error("Invalid URL attempted for redirect:", url);
      // 安全な場所にリダイレクト
      window.location.href = "/";
    }
  }, [url]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#1a1a1a",
        color: "white",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #333",
            borderTop: "4px solid #fff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
      <p>Redirecting...</p>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
