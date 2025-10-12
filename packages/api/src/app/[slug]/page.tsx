import Redirect from "./redirect";

import type { Metadata } from "next";

// 安全なURLスキーマを検証する関数
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

interface MusicData {
  title: string;
  artist: string;
  thumbnail: string;
  description: string;
  service: "youtube" | "spotify";
}

function extractMusicId(url: string): { id: string; service: "youtube" | "spotify" } | null {
  // YouTube Music patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { id: match[1], service: "youtube" };
    }
  }

  // Spotify patterns
  const spotifyPatterns = [/(?:open\.spotify\.com\/track\/)([^?]+)/];

  for (const pattern of spotifyPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { id: match[1], service: "spotify" };
    }
  }

  return null;
}

async function fetchYouTubeData(videoId: string): Promise<MusicData> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube Data API key is not configured");
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  const snippet = video.snippet;

  return {
    title: snippet.title || "Unknown Title",
    artist: snippet.channelTitle || "Unknown Artist",
    thumbnail:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      "",
    description: snippet.description || "",
    service: "youtube",
  };
}

async function fetchSpotifyData(trackId: string): Promise<MusicData> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify API credentials are not configured");
  }

  // Get access token
  const authResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!authResponse.ok) {
    throw new Error(`Spotify auth failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  // Get track data
  const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!trackResponse.ok) {
    throw new Error(`Spotify API request failed: ${trackResponse.status}`);
  }

  const trackData = await trackResponse.json();

  return {
    title: trackData.name || "Unknown Title",
    artist: trackData.artists?.[0]?.name || "Unknown Artist",
    thumbnail: trackData.album?.images?.[0]?.url || "",
    description: `${trackData.name} by ${trackData.artists?.[0]?.name}`,
    service: "spotify",
  };
}

async function fetchMusicData(musicId: string, service: "youtube" | "spotify"): Promise<MusicData> {
  if (service === "youtube") {
    return fetchYouTubeData(musicId);
  } else {
    return fetchSpotifyData(musicId);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    // paramsをawait
    const { slug } = await params;
    // slugをデコードして音楽URLを取得
    const musicUrl = decodeURIComponent(slug);
    const musicInfo = extractMusicId(musicUrl);

    if (!musicInfo) {
      return {
        title: "Invalid Music URL",
        description: "The provided URL is not a valid YouTube Music or Spotify URL.",
      };
    }

    const musicData = await fetchMusicData(musicInfo.id, musicInfo.service);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const ogImageUrl = `${baseUrl}/api/nowplaying?url=${encodeURIComponent(musicUrl)}`;

    return {
      title: `${musicData.title} - ${musicData.artist}`,
      description: `Now Playing: ${musicData.title} by ${musicData.artist}`,
      openGraph: {
        title: `${musicData.title} - ${musicData.artist}`,
        description: `Now Playing: ${musicData.title} by ${musicData.artist}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${musicData.title} by ${musicData.artist}`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${musicData.title} - ${musicData.artist}`,
        description: `Now Playing: ${musicData.title} by ${musicData.artist}`,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error loading song",
      description: "Failed to load the music track.",
    };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  // paramsをawait
  const { slug } = await params;
  // slugをデコードして音楽URLを取得
  const musicUrl = decodeURIComponent(slug);

  // URLの安全性を検証
  if (!isValidUrl(musicUrl)) {
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
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1>Invalid URL</h1>
        <p>The provided URL is not allowed for security reasons.</p>
      </div>
    );
  }

  // クライアントサイドで音楽URLにリダイレクト
  return <Redirect url={musicUrl} />;
}
