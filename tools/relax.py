#!/usr/bin/env python3
"""スロット同士の最小間隔を確保する斥力調整。
実位置を起点に、近すぎるペアだけを押し広げる（ゲームの操作性のためのデフォルメ）。
島外に出た点は元位置方向へ戻す。出力: villages-block.txt を上書き。"""
import json
import math

MIN_D = 4.0     # 最小間隔(viewBox単位)。表示幅400pxなら約16px
ITER = 60
STEP = 0.5

vil = json.load(open("villages-final.json"))
island = json.load(open("island-ring.json"))


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


pos = {v["name"]: [v["x"], v["y"]] for v in vil}
orig = {v["name"]: (v["x"], v["y"]) for v in vil}
names = list(pos)

for it in range(ITER):
    moved = False
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            dx = pos[b][0] - pos[a][0]
            dy = pos[b][1] - pos[a][1]
            d = math.hypot(dx, dy)
            if d < MIN_D:
                moved = True
                if d < 0.01:
                    dx, dy, d = 1.0, 0.0, 1.0
                push = (MIN_D - d) / 2 * STEP
                ux, uy = dx / d, dy / d
                pos[a][0] -= ux * push
                pos[a][1] -= uy * push
                pos[b][0] += ux * push
                pos[b][1] += uy * push
    # 島外に出た点は元位置へ半分戻す
    for n in names:
        if not pip(pos[n][0], pos[n][1], island):
            pos[n][0] = (pos[n][0] + orig[n][0] * 3) / 4
            pos[n][1] = (pos[n][1] + orig[n][1] * 3) / 4
    if not moved:
        break

print(f"iterations: {it + 1}")
worst = []
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        a, b = names[i], names[j]
        d = math.hypot(pos[b][0] - pos[a][0], pos[b][1] - pos[a][1])
        if d < MIN_D - 0.3:
            worst.append((round(d, 1), a, b))
print("残る近接ペア:", sorted(worst)[:8])
big = [(n, round(math.hypot(pos[n][0] - orig[n][0], pos[n][1] - orig[n][1]), 1)) for n in names]
big = [x for x in sorted(big, key=lambda t: -t[1]) if x[1] > 2.0]
print("移動量2.0超:", big[:10])
outside = [n for n in names if not pip(pos[n][0], pos[n][1], island)]
print("島外:", outside)

# villages-block.txt を再生成
TOWN_HEAD = {"tokunoshima": "徳之島町", "amagi": "天城町", "isen": "伊仙町"}
out_lines = []
cur_town = None
# 元のid/kana等を保持するため villages-final.json だけでは不足 → data.jsから読む
import re
pat = re.compile(r'id: "([^"]+)", name: "([^"]+)", kana: "([^"]+)", town: "([^"]+)".*?(approx: true)?\s*}')
recs = []
for line in open("/home/gui/work-log/projects/tokunoshima-puzzle/data.js", encoding="utf-8"):
    m = pat.search(line)
    if m:
        recs.append({"id": m.group(1), "name": m.group(2), "kana": m.group(3),
                     "town": m.group(4), "approx": bool(m.group(5))})
assert len(recs) == len(vil), f"data.js件数不一致: {len(recs)}"
for r in recs:
    x, y = round(pos[r["name"]][0], 1), round(pos[r["name"]][1], 1)
    if r["town"] != cur_town:
        cur_town = r["town"]
        out_lines.append(f"\n  // ===== {TOWN_HEAD[r['town']]} =====")
    approx = ", approx: true" if r["approx"] else ""
    out_lines.append(
        f'  {{ id: "{r["id"]}", name: "{r["name"]}", kana: "{r["kana"]}", town: "{r["town"]}", x: {x}, y: {y}{approx} }},'
    )
with open("villages-block.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
json.dump({r["name"]: pos[r["name"]] for r in recs}, open("relaxed-pos.json", "w"), ensure_ascii=False)
print("villages-block.txt updated")
