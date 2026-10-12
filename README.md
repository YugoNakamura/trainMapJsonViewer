# 鉄道路線マップ

OSMから抽出した鉄道路線JSONを読み込み、線路形状を地図上に表示するReact Leafletアプリです。選択した線路区間のIDをポップアップ表示し、クリックした区間を色で強調します。

## ローカルで起動

```sh
npm ci
npm run dev
```

## JSON形式

トップレベルの `ways` 配列に、線路区間ごとの `nodes`（`lat` / `lon`）を含むJSONに対応しています。

```json
{
  "route": {
    "tags": {
      "name": "路線名"
    }
  },
  "ways": [
    {
      "id": 123,
      "tags": {
        "name": "路線名"
      },
      "nodes": [
        { "lat": 35.0, "lon": 139.0 },
        { "lat": 35.1, "lon": 139.1 }
      ]
    }
  ]
}
```

## GitHub Pagesへの公開

`main` ブランチへpushすると、GitHub ActionsがビルドしてGitHub Pagesへ自動デプロイします。リポジトリの **Settings → Pages → Build and deployment → Source** が **GitHub Actions** になっていることを確認してください。

OSMタイルの帰属表示は地図上に表示されます。ファイルの読み込みはブラウザー内で行われ、JSONはサーバーへアップロードされません。
