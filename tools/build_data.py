#!/usr/bin/env python3
"""集落座標を統合(OSM place > GSI > POI由来 > 手動推定)し、
町ポリゴンとの内外判定を行った上で新しい data.js を生成する。"""
import json
import re

proj = json.load(open("proj.json"))
LONMIN, LATMAX = proj["lonmin"], proj["latmax"]
COSLAT, K, OX, OY = proj["coslat"], proj["k"], proj["ox"], proj["oy"]


def to_xy(lon, lat):
    return (round(OX + (lon - LONMIN) * COSLAT * K, 1), round(OY + (LATMAX - lat) * K, 1))


# --- OSM place(quarter)ノード: name -> 平均(lon,lat)
osm = {}
d = json.load(open("places.json"))
for e in d["elements"]:
    t = e["tags"]
    if t.get("place") not in ("quarter", "village", "hamlet", "neighbourhood"):
        continue
    osm.setdefault(t["name"], []).append((e["lon"], e["lat"]))
osm = {k: (sum(p[0] for p in v) / len(v), sum(p[1] for p in v) / len(v)) for k, v in osm.items()}

# --- GSI結果
gsi = json.load(open("villages-geo.json"))["found"]

# --- POI・ランドマーク由来（OSMの施設位置から確定）
poi = {
    "kawachi":  (128.9228, 27.7341),  # 河地簡易郵便局・保健福祉館
    "aze":      (128.9690, 27.8455),  # 畦プリンスビーチ・キャンプ場の内陸側
    "kedokina": (128.9745, 27.8140),  # 花時名川河口部・展望台
    "tankawa":  (128.9760, 27.8035),  # 反川(母間川支流沿い)
    "ikema":    (128.9925, 27.8035),  # 池間へき地保健福祉館
    "ohara":    (128.9775, 27.7400),  # 大原カントリークラブ周辺
}

# --- Codexクロスチェック検証済み座標（2026-07-28）
# 出典: e-Stat国勢調査町丁・字等別境界の図形中心点(Geoshape)・町公式施設情報。最優先
codex = {
    "sansato":    (128.9432, 27.8671),  # 山山里 境界中心
    "uchikawa":   (128.9606, 27.8692),  # 山内千川 境界中心
    "uekedoku":   (128.9445, 27.8239),  # 花徳上花徳 境界中心
    "shinmura":   (128.9651, 27.8261),  # 花徳新村 境界中心
    "oatari":     (128.9811, 27.8099),  # 母間大当 境界中心
    "asahigaoka": (129.0076, 27.7826),  # 井之川旭ケ丘 境界中心
    "gozendo":    (128.9425, 27.6885),  # 義名山総合運動公園(伊仙町公式で御前堂の主要施設)
    "aze":        (128.9640, 27.8458),  # 山畦 境界中心
    "kedokina":   (128.9749, 27.7987),  # 母間花時名 境界中心
    "tankawa":    (128.9850, 27.8041),  # 母間反川 境界中心
    "maekawa":    (128.9499, 27.8132),  # 花徳前川 境界中心
    "minatogawa": (128.9554, 27.8643),  # 山港川 境界中心
}

# --- 手動推定（公的座標なし。approxフラグ付き）
guess = {
    "uebaru": (128.9140, 27.7245),  # 上晴営農センター住所「伊仙町崎原126」から崎原の東隣に推定
}

def assemble(segs):
    segs = [list(s) for s in segs]
    chains = []
    while segs:
        cur = segs.pop(0)
        progress = True
        while progress and cur[0] != cur[-1]:
            progress = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]; segs.pop(i); progress = True; break
                if s[-1] == cur[-1]:
                    cur += list(reversed(s))[1:]; segs.pop(i); progress = True; break
                if s[-1] == cur[0]:
                    cur = s[:-1] + cur; segs.pop(i); progress = True; break
                if s[0] == cur[0]:
                    cur = list(reversed(s))[:-1] + cur; segs.pop(i); progress = True; break
        chains.append(cur)
    return chains


def ring_area(ring):
    a = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


# 町ポリゴン(海域含む)を新投影で構築 — 町所属判定用
td = json.load(open("towns-geom.json"))
TOWN_RING = {}
NAME2KEY = {"徳之島町": "tokunoshima", "天城町": "amagi", "伊仙町": "isen"}
for e in td["elements"]:
    key = NAME2KEY[e["tags"]["name"]]
    ways = [[(p["lon"], p["lat"]) for p in m["geometry"]]
            for m in e["members"] if m["type"] == "way" and m.get("role") == "outer"]
    ring = max([c for c in assemble(ways) if c[0] == c[-1]], key=ring_area)
    TOWN_RING[key] = [to_xy(lon, lat) for lon, lat in ring]

ISLAND = json.load(open("island-ring.json"))


def pip(x, y, ring):
    inside = False
    n = len(ring)
    for i in range(n - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y):
            xint = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
            if x < xint:
                inside = not inside
    return inside


# --- data.jsの既存定義から id/name/kana/town を読み取り
villages = []
pat = re.compile(r'id: "([^"]+)",\s+name: "([^"]+)",\s+kana: "([^"]+)",\s+town: "([^"]+)"')
for line in open("/home/gui/work-log/projects/tokunoshima-puzzle/data.js", encoding="utf-8"):
    m = pat.search(line)
    if m:
        villages.append(dict(zip(["id", "name", "kana", "town"], m.groups())))

report = []
out_lines = []
cur_town = None
TOWN_HEAD = {"tokunoshima": "徳之島町", "amagi": "天城町", "isen": "伊仙町"}
for v in villages:
    vid, name, town = v["id"], v["name"], v["town"]
    lookup_name = "阿三" if vid == "asan-shikaura" else name
    if vid in codex:
        lon, lat = codex[vid]
        src = "codex"
    elif lookup_name in osm:
        lon, lat = osm[lookup_name]
        src = "osm"
    elif vid in gsi:
        lon, lat = gsi[vid]["lon"], gsi[vid]["lat"]
        src = "gsi"
    elif vid in poi:
        lon, lat = poi[vid]
        src = "poi"
    elif vid in guess:
        lon, lat = guess[vid]
        src = "guess"
    else:
        raise SystemExit(f"座標なし: {vid}")
    x, y = to_xy(lon, lat)
    ok = pip(x, y, TOWN_RING[town]) and pip(x, y, ISLAND)
    report.append((name, town, src, lon, lat, x, y, ok))
    if town != cur_town:
        cur_town = town
        out_lines.append(f"\n  // ===== {TOWN_HEAD[town]} =====")
    approx = ", approx: true" if src == "guess" else ""
    out_lines.append(
        f'  {{ id: "{vid}", name: "{name}", kana: "{v["kana"]}", town: "{town}", x: {x}, y: {y}{approx} }},'
    )

print(f"{'集落':<8}{'town':<12}{'src':<6}{'x':>6}{'y':>6}  町内?")
ng = 0
for name, town, src, lon, lat, x, y, ok in report:
    mark = "OK" if ok else "★範囲外"
    if not ok:
        ng += 1
    print(f"{name:<8}{town:<12}{src:<6}{x:>6}{y:>6}  {mark}")
print(f"\n範囲外: {ng}件")

with open("villages-block.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
json.dump([dict(name=r[0], town=r[1], src=r[2], lon=r[3], lat=r[4], x=r[5], y=r[6], inside=r[7]) for r in report],
          open("villages-final.json", "w"), ensure_ascii=False, indent=1)
