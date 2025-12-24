# CloudFront デプロイ手順

## 概要

このプロジェクトでは、CloudFrontをAPI Gatewayの前に配置して、パフォーマンスとセキュリティを向上させています。

アーキテクチャ:

```
[Client] → [Cloudflare (DNS + Proxy)] → [CloudFront] → [API Gateway] → [Lambda]
```

## キャッシュ戦略

CloudFrontは以下のキャッシュポリシーで設定されています：

- **デフォルトTTL**: 5分
- **最小TTL**: 1分
- **最大TTL**: 1時間
- **クエリパラメータ**: 全てを含める（`?q=xxx` など）
- **圧縮**: Gzip/Brotli有効

同じ検索クエリに対しては、CloudFrontがキャッシュを返すため、API GatewayとLambdaの呼び出しを削減できます。

## デプロイ手順

### 1. 証明書の作成（us-east-1）

CloudFrontでカスタムドメインを使用するには、**us-east-1**リージョンでACM証明書を作成する必要があります。

```bash
# us-east-1リージョンで証明書スタックをデプロイ
cd apps/api
cdk deploy CertificateStack --region us-east-1
```

デプロイが完了すると、CloudFormationの出力から以下を確認できます：

- **CertificateArn**: 証明書のARN（後で使用）
- **DomainName**: ドメイン名（`np.mimifuwa.cc`）

### 2. DNS検証の設定

ACM証明書を検証するために、CloudflareでDNSレコードを追加します。

1. AWSコンソールのACMページ（us-east-1）で、証明書の「ドメイン」をクリック
2. DNS検証用のレコード情報を確認（例：`_xxxxxxxxxxxxx.np.mimifuwa.cc`）
3. CloudflareのDNS設定に以下のレコードを追加:
   - **Type**: CNAME
   - **Name**: `_xxxxxxxxxxxxx.np`（または `_xxxxxxxxxxxxx`）
   - **Target**: ACMに表示されるターゲット（例：`_xxxxxxxxxxxxx.acm-validations.aws`）
   - **Proxy status**: **DNSのみ**（灰色の雲マーク）
   - **TTL**: Auto

4. 数分待つと、ACMコンソールで証明書のステータスが「検証中」→「発行済み」に変わります

### 3. 証明書ARNをCDKコンテキストに追加

証明書が発行されたら、ARNを`cdk.json`のコンテキストに追加します。

```json
{
  "context": {
    "certificateArn": "arn:aws:acm:us-east-1:XXXXXXXX:certificate/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX"
  }
}
```

### 4. メインスタックのデプロイ

```bash
# ap-northeast-1リージョンでメインスタックをデプロイ
cdk deploy NowplayingApiGwStack
```

デプロイが完了すると、以下の出力が得られます：

- **CloudFrontDomainName**: `xxx.cloudfront.net`
- **ApiUrl**: API Gatewayのエンドポイント

### 5. CloudflareでDNS設定（メインのドメイン）

Cloudflareのダッシュボードで以下のDNSレコードを追加します：

1. **CNAMEレコード**を追加:
   - **Type**: CNAME
   - **Name**: `np`（またはサブドメインなし）
   - **Target**: CloudFrontのドメイン名（例：`dxxxxxxxx.cloudfront.net`）
   - **Proxy status**: **プロキシーオン**（オレンジ色の雲マーク）
   - **TTL**: Auto

2. **SSL/TLS設定**:
   - SSL/TLS → **Full (strict)** に設定

### 6. 動作確認

```bash
# カスタムドメインでアクセス
curl https://np.mimifuwa.cc

# 検索エンドポイントをテスト
curl https://np.mimifuwa.cc/search

# キャッシュの確認（同じリクエストを2回送信）
curl -I https://np.mimifuwa.cc/search
```

2回目のリクエストでは、レスポンスヘッダーに `X-Cache: Hit from cloudfront` が含まれているはずです。

## ファイル構成

- `lib/nowplaying-api-gw-stack.ts`: メインのAPIスタック（ap-northeast-1）
- `lib/certificate-stack.ts`: 証明書用スタック（us-east-1）
- `bin/nowplaying-api-gw.ts`: メインスタックのエントリーポイント
- `bin/certificate.ts`: 証明書スタックのエントリーポイント

## 注意事項

1. **証明書のリージョン**: CloudFront用の証明書は必ず**us-east-1**で作成してください
   - ap-northeast-1 など他のリージョンでは動作しません
   - これはCloudFrontの仕様上の制約です

2. **DNS検証レコードのプロキシーモード**:
   - DNS検証用のレコード（`_xxxxxxxxxxxxx`）は**DNSのみ**（灰色の雲マーク）
   - メインのドメイン（`np`）は**プロキシーオン**（オレンジ色の雲マーク）

3. **キャッシュの無効化**:
   - キャッシュをクリアする場合は、CloudFrontコンソールからキャッシュ無効化を作成できます
   - または、`?timestamp=xxx` のようなユニークなクエリパラメータを追加して回避

## トラブルシューティング

### 証明書が検証されない場合

- DNSレコードが正しく設定されているか確認
- プロキシーモードが「DNSのみ」（灰色の雲マーク）になっているか確認
- DNS伝播には最大24時間かかりますが、通常は数分で完了します

### CloudFrontから502エラーが返ってくる場合

- API Gatewayが正しくデプロイされているか確認
- CloudFrontのオリジン設定が正しいか確認
- Lambda関数が正常に動作しているか確認

### Cloudflareで「Too Many Redirects」エラー

- SSL/TLS設定が「Full (strict)」になっているか確認
- CloudFrontとCloudflare間のSSL設定を確認

### キャッシュが効いていない場合

- CloudFrontのキャッシュポリシーが正しく設定されているか確認
- レスポンスヘッダーに `Cache-Control` や `Expires` が含まれていないか確認
- CloudFrontのキャッシュ無効化ログでエラーがないか確認

## コスト最適化

- CloudFrontはデータ転送量とリクエスト数に応じて課金されます
- キャッシュヒット率が高いほど、API GatewayとLambdaのコストを削減できます
- CloudCost Explorerで定期的にコストを確認してください
