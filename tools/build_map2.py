#!/usr/bin/env python3
"""海岸線から島の輪郭を、行政境界から島内の町境線を生成する(v2)。
出力: proj.json(投影パラメータ) / paths.json(島輪郭+町境のSVGパス) / island-ring.json"""
import json
import math

TOL = 0.15


def assemble(segs):
    """折れ線の端点を突き合わせてリング/チェーンに組み立てる"""
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


def dp(points, tol):
    if len(points) < 3:
        return points
    x1, y1 = points[0]
    x2, y2 = points[-1]
    dmax, idx = 0.0, 0
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy)
    for i in range(1, len(points) - 1):
        px, py = points[i]
        if norm == 0:
            d = math.hypot(px - x1, py - y1)
        else:
            d = abs(dx * (y1 - py) - dy * (x1 - px)) / norm
        if d > dmax:
            dmax, idx = d, i
    if dmax > tol:
        left = dp(points[: idx + 1], tol)
        right = dp(points[idx:], tol)
        return left[:-1] + right
    return [points[0], points[-1]]


def pip(x, y, ring):
    inside = False
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y):
            xint = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
            if x < xint:
                inside = not inside
    return inside


# ---- 1. 海岸線 → 島リング（最大リング=徳之島本島）
cd = json.load(open("coastline.json"))
coast_segs = [[(p["lon"], p["lat"]) for p in w["geometry"]] for w in cd["elements"] if "geometry" in w]
chains = assemble(coast_segs)
closed = [c for c in chains if c[0] == c[-1] and len(c) > 3]
island = max(closed, key=ring_area)
print(f"coast chains={len(chains)} closed={len(closed)} island_points={len(island)}")

# ---- 2. 投影（島リングのbboxでフィット）
lat0 = sum(p[1] for p in island) / len(island)
coslat = math.cos(math.radians(lat0))
lonmin = min(p[0] for p in island); lonmax = max(p[0] for p in island)
latmin = min(p[1] for p in island); latmax = max(p[1] for p in island)
k = 88.0 / ((lonmax - lonmin) * coslat)
ox, oy = 6.0, 6.0
height = round((latmax - latmin) * k + 2 * oy, 1)
print(f"island lon {lonmin:.3f}-{lonmax:.3f} lat {latmin:.3f}-{latmax:.3f} viewBox 0 0 100 {height}")


def proj(lon, lat):
    return (ox + (lon - lonmin) * coslat * k, oy + (latmax - lat) * k)


json.dump({"lonmin": lonmin, "latmax": latmax, "coslat": coslat, "k": k, "ox": ox, "oy": oy,
           "viewBox": f"0 0 100 {height:g}",
           "bbox_lonlat": [lonmin, latmin, lonmax, latmax]}, open("proj.json", "w"), indent=1)

island_xy = [proj(lon, lat) for lon, lat in island]
island_simp = dp(island_xy, TOL)
island_path = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in island_simp[:-1]) + " Z"
print(f"island simplified {len(island_xy)} -> {len(island_simp)}, path {len(island_path)} bytes")
json.dump(island_simp, open("island-ring.json", "w"))

# ---- 3. 町境: 行政境界の構成ウェイのうち、中点が島内に落ちるもの（海上境界・海岸沿いを除外）
td = json.load(open("towns-geom.json"))
seen = set()
border_chains_input = []
for e in td["elements"]:
    for m in e["members"]:
        if m["type"] != "way" or "geometry" not in m:
            continue
        if m["ref"] in seen:
            continue
        seen.add(m["ref"])
        pts = [(p["lon"], p["lat"]) for p in m["geometry"]]
        mid = pts[len(pts) // 2]
        mx, my = proj(*mid)
        # 中点が島内 かつ 海岸線そのものでない（海岸ウェイは coastline.json のweyと同じref）
        if pip(mx, my, island_xy):
            border_chains_input.append(pts)

coast_refs = {w["id"] for w in cd["elements"]}
# 海岸線と同一のwayを除外して再収集
seen = set()
border_chains_input = []
for e in td["elements"]:
    for m in e["members"]:
        if m["type"] != "way" or "geometry" not in m or m["ref"] in seen or m["ref"] in coast_refs:
            continue
        seen.add(m["ref"])
        pts = [(p["lon"], p["lat"]) for p in m["geometry"]]
        mid = pts[len(pts) // 2]
        mx, my = proj(*mid)
        if pip(mx, my, island_xy):
            border_chains_input.append(pts)

borders = assemble(border_chains_input)
border_paths = []
for b in borders:
    xy = [proj(lon, lat) for lon, lat in b]
    simp = dp(xy, TOL)
    if len(simp) < 2:
        continue
    border_paths.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in simp))
print(f"border chains: {len(borders)}, paths: {len(border_paths)}")

json.dump({"island": island_path, "borders": border_paths}, open("paths.json", "w"), ensure_ascii=False, indent=1)
