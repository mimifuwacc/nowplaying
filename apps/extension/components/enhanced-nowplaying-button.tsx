import React from "react";

interface EnhancedNowPlayingButtonProps {
  service?: "youtube" | "spotify";
  compact?: boolean;
}

const EnhancedNowPlayingButton: React.FC<EnhancedNowPlayingButtonProps> = ({
  service = "youtube",
  compact = false,
}) => {
  const handleClick = () => {
    let urlToShare = "";

    if (service === "spotify") {
      // h1タグを子孫に持つaタグのhrefからtrack IDを取得
      const linkWithH1 = document.querySelector<HTMLAnchorElement>("a:has(h1)");
      if (linkWithH1?.href) {
        const trackRegex = /:track:([^?]+)/;
        const trackMatch = trackRegex.exec(linkWithH1.href);
        if (trackMatch?.[1]) {
          urlToShare = `https://open.spotify.com/track/${trackMatch[1]}`;
        }
      }

      // フォールバック: npv-metadata-container内のaタグから取得
      if (!urlToShare) {
        const metadataContainer = document.querySelector('[data-testid="npv-metadata-container"]');
        const metadataLink = metadataContainer?.querySelector<HTMLAnchorElement>("a");
        if (metadataLink?.href) {
          const trackRegex = /\/track\/([^?]+)/;
          const trackMatch = trackRegex.exec(metadataLink.href);
          if (trackMatch?.[1]) {
            urlToShare = `https://open.spotify.com/track/${trackMatch[1]}`;
          }
        }
      }
    } else {
      // YouTube Music
      const playerTitleLink = document.querySelector<HTMLAnchorElement>(
        'a[data-sessionlink*="feature=player-title"]'
      );
      if (playerTitleLink?.href) {
        const urlParts = playerTitleLink.href.split("?");
        if (urlParts.length > 1) {
          const urlParams = new URLSearchParams(urlParts[1]);
          const videoId = urlParams.get("v");
          if (videoId) {
            const cleanVideoId = videoId.split("&")[0];
            urlToShare = `https://music.youtube.com/watch?v=${cleanVideoId}`;
          }
        }
      }
    }

    if (urlToShare) {
      const shareUrl = `https://nowplaying.mimifuwa.cc/${encodeURIComponent(urlToShare)}`;
      const shareText = `#NowPlaying ${shareUrl}`;
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  const cssString = `
    .enhanced-nowplaying-container {
      display: flex;
      width: ${compact ? "auto" : "100%"};
      padding: ${compact ? "8px" : "16px"};
      box-sizing: border-box;
      container-type: inline-size;
    }

    .enhanced-nowplaying-button {
      display: flex;
      align-items: center;
      padding: ${compact ? "8px 12px" : "12px 20px"};
      width: ${compact ? "auto" : "100%"};
      cursor: pointer;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: ${compact ? "12px" : "16px"};
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      text-decoration: none;
    }

    .enhanced-nowplaying-icon {
      width: ${compact ? "20px" : "28px"};
      height: ${compact ? "20px" : "28px"};
      margin-right: ${compact ? "0" : "12px"};
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: ${compact ? "6px" : "8px"};
      backdrop-filter: blur(10px);
    }

    .enhanced-nowplaying-text {
      flex: 1;
    }

    .enhanced-nowplaying-arrow {
      margin-left: 12px;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    header {
      @container (max-width: 100px) {
        .enhanced-nowplaying-button {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          margin: -15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .enhanced-nowplaying-icon {
          margin-right: 0;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0);
        }
        
        .enhanced-nowplaying-text,
        .enhanced-nowplaying-arrow {
          display: none;
        }
      }
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-container {
      width: 100%;
      padding: 16px;
      container-type: normal;
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-button {
      width: 100%;
      padding: 16px 24px;
      border-radius: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-icon {
      width: 32px;
      height: 32px;
      margin-right: 16px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-text {
      display: block;
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-text span {
      font-size: 16px;
      font-weight: 700;
    }

    [data-testid="npv-footer"] .enhanced-nowplaying-arrow {
      display: block;
    }

  `;

  return (
    <>
      <style>{cssString}</style>
      <div className="enhanced-nowplaying-container">
        <button onClick={handleClick} className="enhanced-nowplaying-button">
          <div className="enhanced-nowplaying-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height={compact ? "16" : "20"}
              viewBox="0 0 24 24"
              width={compact ? "16" : "20"}
              focusable="false"
              aria-hidden="true"
              style={{
                fill: "#fff",
                display: "block",
              }}
            >
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
          </div>
          <div className="enhanced-nowplaying-text">
            <span
              style={{
                fontSize: "15px",
                fontWeight: "600",
                lineHeight: "20px",
                color: "#fff",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: "0.3px",
              }}
            >
              Now Playing
            </span>
          </div>
          <div className="enhanced-nowplaying-arrow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16"
              viewBox="0 0 24 24"
              width="16"
              style={{
                fill: "#fff",
              }}
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </div>
        </button>
      </div>
    </>
  );
};

export default EnhancedNowPlayingButton;
