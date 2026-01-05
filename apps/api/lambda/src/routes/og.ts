import { Hono } from "hono";
import satori from "satori";
import sharp from "sharp";
import { buffer } from "stream/consumers";

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

  // SVGを生成（画像は使わない）
  const svgToConvert = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Noto Sans JP",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
                padding: "0 75px",
                boxSizing: "border-box",
              },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: "72px",
                      fontWeight: 700,
                      color: "#ffffff",
                      textAlign: "center",
                    },
                    children: title,
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      fontSize: "48px",
                      color: "#dddddd",
                      textAlign: "center",
                    },
                    children: artist,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                    },
                    children: [
                      {
                        type: "p",
                        props: {
                          style: {
                            fontSize: "32px",
                            color: "#555555",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                          },
                          children: "#NowPlaying",
                        },
                      },
                      {
                        type: "p",
                        props: {
                          style: {
                            fontSize: "28px",
                            color: "#ffffff",
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

  // SVGをPNGに変換（viewBoxでエッジをクロップ）
  const svgWithCrop = svgToConvert.replace(/<svg[^>]*>/, (match) => {
    return match
      .replace(/viewBox="([^"]*)"/, 'viewBox="20 20 1200 630"')
      .replace(/width="([^"]*)"/, 'width="1200"')
      .replace(/height="([^"]*)"/, 'height="630"');
  });

  const pngBuffer = await sharp(Buffer.from(svgToConvert)).png().toBuffer();

  // HonoのLambdaアダプタが自動でBase64エンコードとisBase64Encoded: trueを設定する
  // 単純にバイナリデータをそのまま返す
  c.header("Content-Type", "image/png");
  // @ts-expect-error - HonoのLambdaアダプタはBufferを正しく処理する
  return c.body(pngBuffer);
});

async function loadFont(weight: "regular" | "bold"): Promise<ArrayBuffer> {
  const isDev = process.env.ENV === "development";
  const fileName = weight === "bold" ? "NotoSansJP-Bold.ttf" : "NotoSansJP-Regular.ttf";

  if (isDev) {
    // ローカル開発環境の場合
    const fs = await import("fs");
    const path = await import("path");
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const fontPath = path.join(__dirname, `../../../layer/fonts/${fileName}`);
    return fs.readFileSync(fontPath).buffer;
  } else {
    // Lambda環境の場合
    const fs = await import("fs");
    const fontPath = `/opt/fonts/${fileName}`;
    return fs.readFileSync(fontPath).buffer;
  }
}

export default og;
