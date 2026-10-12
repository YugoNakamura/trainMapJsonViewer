import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";

function parseRailwayJson(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.ways)) {
    throw new Error("JSONに ways の配列がありません。");
  }

  const ways = value.ways
    .map((way, index) => {
      const positions = Array.isArray(way.nodes)
        ? way.nodes
            .filter(
              (node) =>
                Number.isFinite(node?.lat) &&
                Number.isFinite(node?.lon) &&
                node.lat >= -90 &&
                node.lat <= 90 &&
                node.lon >= -180 &&
                node.lon <= 180,
            )
            .map((node) => [node.lat, node.lon])
        : [];

      return {
        id: way.id ?? index,
        name: way.tags?.name ?? `線路 ${index + 1}`,
        positions,
      };
    })
    .filter((way) => way.positions.length >= 2);

  if (ways.length === 0) {
    throw new Error("描画可能な線路データがありません。各wayに緯度・経度付きのnodesが必要です。");
  }

  return ways;
}

function isValidPosition(position) {
  return (
    Array.isArray(position) &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1]) &&
    position[0] >= -90 &&
    position[0] <= 90 &&
    position[1] >= -180 &&
    position[1] <= 180
  );
}

function parseTrainMapJson(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.sections)) {
    throw new Error("trainmap JSONに sections の配列がありません。");
  }

  const ways = value.sections
    .map((section, index) => ({
      id: section?.id ?? index,
      name: section?.id ?? `区間 ${index + 1}`,
      positions: Array.isArray(section?.coords)
        ? section.coords.filter(isValidPosition)
        : [],
    }))
    .filter((section) => section.positions.length >= 2);

  if (ways.length === 0) {
    throw new Error("描画可能な区間データがありません。各sectionに2点以上のcoordsが必要です。");
  }

  const points = [
    ...(Array.isArray(value.stations)
      ? value.stations.map((station, index) => ({
          id: `station-${station?.id ?? index}`,
          name: station?.name ?? station?.id ?? `駅 ${index + 1}`,
          position: station?.coord,
          kind: "station",
        }))
      : []),
    ...(Array.isArray(value.switchPoints)
      ? value.switchPoints.map((switchPoint, index) => ({
          id: `switch-${switchPoint?.id ?? index}`,
          name: `分岐点 ${switchPoint?.id ?? index + 1}`,
          position: switchPoint?.coord,
          kind: "switch",
        }))
      : []),
  ].filter((point) => isValidPosition(point.position));

  return { ways, points };
}

function FitToWays({ ways, points }) {
  const map = useMap();

  useEffect(() => {
    const positions = [
      ...ways.flatMap((way) => way.positions),
      ...points.map((point) => point.position),
    ];
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 23 });
  }, [map, ways, points]);

  return null;
}

function App() {
  const [ways, setWays] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedWayId, setSelectedWayId] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    try {
      const fileNameLowerCase = file.name.toLowerCase();
      const isTrainMap = fileNameLowerCase.endsWith(".trainmap.json");
      const isOsm = fileNameLowerCase.endsWith(".osm.json");
      if (!isTrainMap && !isOsm) {
        throw new Error("対応している拡張子は .osm.json と .trainmap.json です。");
      }

      const json = JSON.parse(await file.text());
      const parsedData = isTrainMap
        ? parseTrainMapJson(json)
        : { ways: parseRailwayJson(json), points: [] };
      setWays(parsedData.ways);
      setPoints(parsedData.points);
      setSelectedWayId(null);
      setRouteName(
        isTrainMap
          ? json.name ??
              json.lineName ??
              file.name.replace(/\.trainmap\.json$/i, "")
          : json.route?.tags?.["name:ja"] ??
              json.route?.tags?.name ??
              json.route?.tags?.["name:en"] ??
              "読み込んだ路線",
      );
      setFileName(file.name);
    } catch (loadError) {
      setError(
        loadError instanceof SyntaxError
          ? "JSONを読み込めませんでした。ファイルの形式を確認してください。"
          : loadError.message || "ファイルの読み込みに失敗しました。",
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="鉄道路線マップ">
          <span className="brand-icon" aria-hidden="true">線</span>
          <span>鉄道路線マップ</span>
        </a>
        <span className="topbar-note">OSM路線データビューア</span>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="intro">
            <p className="eyebrow">RAILWAY MAP VIEWER</p>
            <h1>線路データを<br />地図で見る</h1>
            <p className="description">
              OSM形式とtrainmap形式のJSONファイルを読み込み、線路の形状や駅・分岐点を地図上に表示します。
            </p>
          </div>

          <label className="file-picker">
            <input
              type="file"
              accept=".osm.json,.trainmap.json"
              onChange={handleFileChange}
            />
            <span className="upload-icon" aria-hidden="true">↑</span>
            <span className="picker-title">JSONファイルを選択</span>
            <span className="picker-subtitle">.osm.json / .trainmap.json</span>
          </label>

          {error && <p className="error-message" role="alert">{error}</p>}

          {ways.length > 0 ? (
            <section className="route-card" aria-live="polite">
              <div className="route-card-heading">
                <span className="route-dot" />
                <span>表示中の路線</span>
              </div>
              <h2>{routeName}</h2>
              <p className="file-name">{fileName}</p>
              <div className="route-stats">
                <div><strong>{ways.length.toLocaleString("ja-JP")}</strong><span>線路区間</span></div>
                <div>
                  <strong>
                    {(
                      ways.reduce((sum, way) => sum + way.positions.length, 0) +
                      points.length
                    ).toLocaleString("ja-JP")}
                  </strong>
                  <span>座標点</span>
                </div>
              </div>
            </section>
          ) : (
            <div className="empty-hint">
              <span className="hint-icon" aria-hidden="true">i</span>
              <p><strong>対応するJSON形式</strong><br /><code>.osm.json</code> は <code>ways</code> / <code>nodes</code> 形式、<code>.trainmap.json</code> は <code>sections</code> / <code>coords</code> 形式に対応しています。</p>
            </div>
          )}

          <div className="sidebar-footer">ファイルはブラウザー内で処理されます</div>
        </aside>

        <section className="map-panel" aria-label="路線地図">
          {ways.length > 0 ? (
            <MapContainer
              className="map"
              center={[35.6812, 139.7671]}
              zoom={6}
              maxZoom={23}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={23}
              />
              <FitToWays ways={ways} points={points} />
              {ways.map((way) => (
                <Polyline
                  key={way.id}
                  positions={way.positions}
                  pathOptions={{
                    color: way.id === selectedWayId ? "#e27645" : "#197a71",
                    weight: way.id === selectedWayId ? 5 : 4,
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => setSelectedWayId(way.id),
                  }}
                >
                  <Tooltip sticky>{way.name}</Tooltip>
                  <Popup>路線ID: {way.id}</Popup>
                </Polyline>
              ))}
              {points.map((point) => (
                <CircleMarker
                  key={point.id}
                  center={point.position}
                  radius={6}
                  pathOptions={{
                    color: point.kind === "station" ? "#e27645" : "#526a8a",
                    fillColor: "#fff",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip>{point.name}</Tooltip>
                  <Popup>{point.name}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="map-placeholder">
              <div className="placeholder-mark" aria-hidden="true">
                <span className="placeholder-line" />
                <span className="placeholder-node node-one" />
                <span className="placeholder-node node-two" />
                <span className="placeholder-node node-three" />
              </div>
              <h2>地図を表示する準備ができています</h2>
              <p>左側から路線データのJSONファイルを選択してください</p>
            </div>
          )}
          <div className="map-caption">© OpenStreetMap contributors</div>
        </section>
      </section>
    </main>
  );
}

export default App;
