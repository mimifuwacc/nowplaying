import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("search", async (c) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Server configuration error (API Key missing)" }, 500);
  }

  try {
    // YouTube APIのエンドポイント構築
    const params = new URLSearchParams({
      q: `JPP302500371`, // ★ここでISRC検索を指定
      maxResults: "1",
      key: apiKey,
    });

    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

    // Hono (Web Standard) の fetch を使用
    const response = await fetch(youtubeUrl);

    if (!response.ok) {
      return c.json({ error: "Failed to fetch from YouTube API" }, response.status as any);
    }

    const data: any = await response.json();

    // 検索結果のチェック
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      console.log(item);
      return c.json(item);
    } else {
      // 見つからなかった場合
      return c.json(
        {
          found: false,
          message: "No video found for this ISRC",
          isrc: "JPP302500371",
        },
        404
      );
    }
  } catch (e) {
    return c.json({ error: "Internal Server Error", details: String(e) }, 500);
  }
});

export { app };
