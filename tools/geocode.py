#!/usr/bin/env python3
"""集落58件を国土地理院AddressSearchでジオコーディングし、viewBox座標に投影する。
失敗分はOverpassのplaceノードで補完。結果は villages-geo.json に出力。"""
import json
import time
import urllib.parse
import urllib.request

proj = json.load(open("proj.json"))
LONMIN, LATMAX = proj["lonmin"], proj["latmax"]
COSLAT, K, OX, OY = proj["coslat"], proj["k"], proj["ox"], proj["oy"]
BBOX = proj["bbox_lonlat"]  # [lonmin, latmin, lonmax, latmax]

TOWN_JA = {"isen": "伊仙町", "amagi": "天城町", "tokunoshima": "徳之島町"}

# data.jsから id/name/town を抽出
villages = []
for line in open("/home/gui/work-log/projects/tokunoshima-puzzle/data.js", encoding="utf-8"):
    line = line.strip()
    if line.startswith("{ id:"):
        rec = {}
        for part in line.strip("{}, ").split(","):
            if ":" not in part:
                continue
            k, v = part.split(":", 1)
            rec[k.strip()] = v.strip().strip('"')
        villages.append({"id": rec["id"], "name": rec["name"], "town": rec["town"]})

print("villages:", len(villages))

# ジオコーディングのクエリ名補正（正式大字名・別表記）
QUERY_OVERRIDE = {
    "asan-shikaura": ["阿三", "鹿浦"],  # 2集落合併カード → 平均
    "asahigaoka": ["旭ヶ丘", "旭ケ丘"],
    "kedokina": ["花時名"],
}


def in_bbox(lon, lat):
    return BBOX[0] - 0.02 <= lon <= BBOX[2] + 0.02 and BBOX[1] - 0.02 <= lat <= BBOX[3] + 0.02


def gsi_search(q):
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={"User-Agent": "tokunoshima-puzzle-dev"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def geocode_one(town_ja, name):
    """GSIで検索し、島bbox内かつタイトルに町名を含む最初の結果を返す"""
    for q in (f"鹿児島県大島郡{town_ja}{name}", f"{town_ja}{name}"):
        try:
            results = gsi_search(q)
        except Exception as ex:
            print("  ERR", q, ex)
            continue
        for res in results:
            lon, lat = res["geometry"]["coordinates"]
            title = res["properties"]["title"]
            if in_bbox(lon, lat) and town_ja in title and name in title:
                return lon, lat, title
        time.sleep(0.3)
    return None


out = {}
misses = []
for v in villages:
    town_ja = TOWN_JA[v["town"]]
    names = QUERY_OVERRIDE.get(v["id"], [v["name"]])
    hits = []
    for nm in names:
        r = geocode_one(town_ja, nm)
        if r:
            hits.append(r)
    if hits:
        lon = sum(h[0] for h in hits) / len(hits)
        lat = sum(h[1] for h in hits) / len(hits)
        out[v["id"]] = {"lon": lon, "lat": lat, "src": "gsi", "title": hits[0][2]}
        print(f"OK  {v['name']}: {hits[0][2]} ({lon:.4f},{lat:.4f})")
    else:
        misses.append(v)
        print(f"MISS {v['name']} ({town_ja})")
    time.sleep(0.3)

print("\nmiss:", [m["name"] for m in misses])
json.dump({"found": out, "miss": [m["id"] for m in misses]},
          open("villages-geo.json", "w"), ensure_ascii=False, indent=1)
