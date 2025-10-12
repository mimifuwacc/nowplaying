import fs from "fs";
import path from "path";

import React from "react";
import satori from "satori";

import { MusicServiceFactory } from "../../../services/music-service-factory";

import type { TrackData } from "../../../types/music-service";
import type { NextRequest } from "next/server";

interface VideoData {
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
  serviceName: string;
  serviceIcon: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return new Response("URL parameter is required", { status: 400 });
  }

  try {
    const provider = MusicServiceFactory.detectServiceFromUrl(url);
    if (!provider) {
      return new Response("Unsupported music service URL", { status: 400 });
    }

    const trackId = provider.extractId(url);
    if (!trackId) {
      return new Response("Invalid music service URL", { status: 400 });
    }

    const trackData = await provider.fetchTrackData(trackId);
    const videoData = convertTrackToVideoData(
      trackData,
      provider.getServiceName(),
      provider.getServiceIcon()
    );

    // 画像がない場合はデフォルト画像を使用
    if (!videoData.thumbnail) {
      videoData.thumbnail =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";
    }

    // フォントを読み込み
    const fontPath = path.join(process.cwd(), "public/fonts/NotoSansJP-Regular.ttf");
    const boldFontPath = path.join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf");

    const fonts = [
      {
        name: "Noto Sans JP",
        data: fs.readFileSync(fontPath),
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Noto Sans JP",
        data: fs.readFileSync(boldFontPath),
        weight: 700 as const,
        style: "normal" as const,
      },
    ];

    const svg = await satori(
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        React.createElement("img", {
          src: videoData.thumbnail,
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "1200px",
            textAlign: "center",
            filter: "blur(10px)",
          },
        }),
        React.createElement("div", {
          style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            textAlign: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }),
        React.createElement(
          "div",
          {
            style: {
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "64px",
              fontFamily: "Noto Sans JP",
              padding: "0 75px",
              boxSizing: "border-box",
            },
          },

          React.createElement("img", {
            src: videoData.thumbnail,
            style: {
              width: "480px",
              height: "480px",
              borderRadius: "16px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              objectFit: "cover",
            },
          }),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                color: "#ffffff",
                width: "506px",
                gap: "8px",
              },
            },
            React.createElement(
              "h1",
              {
                style: {
                  fontSize: "56px",
                  fontWeight: 700,
                  width: "100%",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitLineClamp: 2,
                },
              },
              videoData.title
            ),
            React.createElement(
              "p",
              {
                style: {
                  fontSize: "32px",
                  color: "#dddddd",
                  textAlign: "center",
                  marginTop: "0",
                  marginBottom: "32px",
                },
              },
              videoData.channelTitle
            ),
            React.createElement(
              "p",
              {
                style: {
                  fontSize: "24px",
                  color: "#555555",
                  textAlign: "center",
                  marginTop: "0",
                  marginBottom: "32px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                },
              },
              "#NowPlaying"
            ),
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#ffffff",
                },
              },
              React.createElement("img", {
                src: `${process.env.BASE_URL}${videoData.serviceIcon}`,
                alt: "#NowPlaying",
                style: {
                  width: "56px",
                  height: "56px",
                },
              }),
              React.createElement(
                "p",
                {
                  style: {
                    fontSize: "20px",
                    textAlign: "center",
                    marginLeft: "10px",
                  },
                },
                `from ${videoData.serviceName}`
              )
            )
          )
        )
      ),
      {
        width: 1240,
        height: 670,
        fonts,
      }
    );

    const png = await convertSvgToPng(svg);

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

function convertTrackToVideoData(
  trackData: TrackData,
  serviceName: string,
  serviceIcon: string
): VideoData {
  return {
    title: trackData.title,
    channelTitle: trackData.artist,
    thumbnail: trackData.thumbnail,
    description: trackData.description || "",
    serviceName,
    serviceIcon,
  };
}

async function convertSvgToPng(svg: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  try {
    // まずSVGをPNGに変換
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    // PNG画像のメタデータを取得
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();

    // 20pxずつ切り抜く
    const left = 20;
    const top = 20;
    const width = (metadata.width ?? 0) - 40;
    const height = (metadata.height ?? 0) - 40;

    // 幅・高さが40px未満の場合はそのまま返す
    if (width <= 0 || height <= 0) {
      return pngBuffer;
    }

    const croppedBuffer = await image.extract({ left, top, width, height }).png().toBuffer();

    return croppedBuffer;
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    throw error;
  }
}
