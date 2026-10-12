# 鉄道路線マップ

`.osm.json` と `.trainmap.json` の鉄道路線データを読み込み、線路形状を地図上に表示するReact Leafletアプリです。選択した線路区間のIDをポップアップ表示し、クリックした区間を色で強調します。trainmap形式では駅と分岐点も表示します。

## ローカルで起動

```sh
npm ci
npm run dev
```

## JSON形式

`.osm.json` はトップレベルの `ways` 配列に、線路区間ごとの `nodes`（`lat` / `lon`）を含む形式に対応しています。

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

`.trainmap.json` はトップレベルの `sections` 配列に、区間ごとの `coords`（`[緯度, 経度]` の配列）を含む形式に対応しています。任意で `stations` と `switchPoints` 配列を含めると、駅と分岐点もマーカーで表示します。

```json
{
  "sections": [
    {
      "id": "A-B",
      "coords": [
        [35.0, 139.0],
        [35.1, 139.1]
      ]
    }
  ],
  "stations": [
    {
      "id": "A",
      "name": "駅A",
      "coord": [35.0, 139.0]
    }
  ],
  "switchPoints": [
    {
      "id": "switch-1",
      "coord": [35.05, 139.05]
    }
  ]
}
```

## GitHub Pagesへの公開

`main` ブランチへpushすると、GitHub ActionsがビルドしてGitHub Pagesへ自動デプロイします。リポジトリの **Settings → Pages → Build and deployment → Source** が **GitHub Actions** になっていることを確認してください。

OSMタイルの帰属表示は地図上に表示されます。ファイルの読み込みはブラウザー内で行われ、JSONはサーバーへアップロードされません。
