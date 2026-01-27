import { Hono } from "hono";
import satori from "satori";
import sharp from "sharp";

const og = new Hono();

og.get("/og", async (c) => {
  const url = c.req.query("url");

  // TODO: 実際のデータ取得処理を後で実装
  // 今はダミーデータを使用
  const title = "改変";
  const artist = "GIRLS REVOLUTION PROJECT - Topic";
  const thumbnail =
    "https://camo.githubusercontent.com/5e45bc648dba68520ce949a53690af6bcef2880f84a1d46cbb1636649afd6d84/68747470733a2f2f796176757a63656c696b65722e6769746875622e696f2f73616d706c652d696d616765732f696d6167652d313032312e6a7067";
  const serviceName = "YouTube Music";

  // フォントデータを読み込み
  const regularFontData = await loadFont("regular");
  const boldFontData = await loadFont("bold");

  // アイコンを読み込み
  const serviceIcon = await loadIcon("youtube-music");

  // SVGを生成
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [
          // 背景画像（ぼかし）
          {
            type: "img",
            props: {
              src: thumbnail,
              style: {
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                height: "1200px",
                textAlign: "center",
                filter: "blur(10px)",
              },
            },
          },
          // オーバーレイ
          {
            type: "div",
            props: {
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
            },
          },
          // メインコンテンツ
          {
            type: "div",
            props: {
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
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              children: [
                {
                  type: "img",
                  props: {
                    src: thumbnail,
                    style: {
                      width: "480px",
                      height: "480px",
                      borderRadius: "16px",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                      objectFit: "cover",
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      color: "#ffffff",
                      width: "506px",
                      gap: "8px",
                    },
                    children: [
                      // タイトル
                      {
                        type: "h1",
                        props: {
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
                          children: title,
                        },
                      },
                      // アーティスト名
                      {
                        type: "p",
                        props: {
                          style: {
                            fontSize: "32px",
                            color: "#dddddd",
                            marginTop: "0",
                            marginBottom: "32px",
                          },
                          children: artist,
                        },
                      },
                      {
                        type: "p",
                        props: {
                          style: {
                            fontSize: "24px",
                            color: "#ffffff",
                            marginTop: "0",
                            marginBottom: "32px",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            backgroundColor: "rgba(255, 255, 255, 0.15)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                          },
                          children: "#NowPlaying",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            color: "#ffffff",
                          },
                          children: [
                            {
                              type: "img",
                              props: {
                                src: serviceIcon,
                                style: {
                                  width: "56px",
                                  height: "56px",
                                },
                              },
                            },
                            {
                              type: "p",
                              props: {
                                style: {
                                  fontSize: "20px",
                                  textAlign: "center",
                                  marginLeft: "10px",
                                },
                                children: `from ${serviceName}`,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1240,
      height: 670,
      fonts: [
        {
          name: "Noto Sans JP",
          data: regularFontData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Noto Sans JP",
          data: boldFontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  // SVGをPNGに変換してエッジをカット
  const pngBuffer = await convertSvgToPng(svg);

  c.header("Content-Type", "image/png");
  return c.body(new Uint8Array(pngBuffer));
});

async function loadFont(weight: "regular" | "bold"): Promise<ArrayBuffer> {
  const isDev = process.env.ENV === "development";
  const fileName = weight === "bold" ? "NotoSansJP-Bold.ttf" : "NotoSansJP-Regular.ttf";

  if (isDev) {
    // ローカル開発環境の場合
    const fs = await import("fs");
    const path = await import("path");
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const fontPath = path.join(__dirname, `../../../layer/assets/fonts/${fileName}`);
    return fs.readFileSync(fontPath).buffer;
  } else {
    // Lambda環境の場合
    const fs = await import("fs");
    const fontPath = `/opt/fonts/${fileName}`;
    return fs.readFileSync(fontPath).buffer;
  }
}

async function loadIcon(service: "spotify" | "youtube-music"): Promise<string> {
  const isDev = process.env.ENV === "development";
  const fileName = service === "spotify" ? "spotify.svg" : "yt.svg";

  let iconSvg: string;

  if (isDev) {
    // ローカル開発環境の場合
    const fs = await import("fs");
    const path = await import("path");
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const iconPath = path.join(__dirname, `../../../layer/assets/icons/${fileName}`);
    iconSvg = fs.readFileSync(iconPath, "utf-8");
  } else {
    // Lambda環境の場合
    const fs = await import("fs");
    const iconPath = `/opt/icons/${fileName}`;
    iconSvg = fs.readFileSync(iconPath, "utf-8");
  }

  // SVGをbase64エンコードされたdata URLに変換
  const base64 = Buffer.from(iconSvg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

async function convertSvgToPng(svg: string): Promise<Buffer> {
  try {
    // まずSVGをPNGに変換
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    // PNG画像のメタデータを取得
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();

    // 40pxずつ切り抜く
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

export default og;
