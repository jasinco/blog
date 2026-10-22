"""Bake an OpenStreetMap street network into the compact graph behind the landing page animation.

1. Download streets for the area (Overpass API; the main server is often busy, mirrors work too):

   curl -A "blog.jasinco.work map build" -o taipei.json https://overpass.kumi.systems/api/interpreter \
     --data-urlencode 'data=[out:json][timeout:120];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](25.010,121.495,25.075,121.580);out tags geom qt;'

2. python3 scripts/build-street-graph.py taipei.json public/data/streets.json

Output: nodes are intersections as flat [x, y, ...] in metres from CENTRE (y down), rotated so the
GRID_ANGLE direction runs along +x; edges are [a, b, length in metres, ...bend points]; span is the
kept area. Data © OpenStreetMap contributors, ODbL.
"""
import json, math, sys
from collections import defaultdict

# Downtown Taipei: Ximending to Taipei 101, centred on Zhongxiao Xinsheng
CENTRE = (25.0423, 121.5330)
GRID_ANGLE = 90  # bearing (degrees from north) that runs along +x: east
HALF_ALONG, HALF_ACROSS = 3000, 1800  # metres kept around the centre
# Walkable street classes; elevated expressways and their ramps are left out
KEEP = {'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'living_street',
        'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'}
if '--with-residential' in sys.argv:
    KEEP.add('residential')
src, out = [a for a in sys.argv[1:] if not a.startswith('--')]

data = json.load(open(src))
lat0, lon0 = CENTRE
kx = math.cos(math.radians(lat0)) * 111320
ky = 110540
angle = math.radians(GRID_ANGLE)

def xy(p):
    e, north = (p[1] - lon0) * kx, (p[0] - lat0) * ky
    return (e * math.sin(angle) + north * math.cos(angle), e * math.cos(angle) - north * math.sin(angle))

def inside(p):
    return abs(p[0]) <= HALF_ALONG + 150 and abs(p[1]) <= HALF_ACROSS + 150

# Ways as lists of (lat, lon); `out geom` has no node ids, so shared points are matched by coordinate
ways = []
for e in data['elements']:
    if e['type'] != 'way' or e.get('tags', {}).get('highway') not in KEEP:
        continue
    ways.append([(round(g['lat'], 7), round(g['lon'], 7)) for g in e['geometry']])

use = defaultdict(int)
for w in ways:
    for i, n in enumerate(w):
        use[n] += 1 if 0 < i < len(w) - 1 else 2  # endpoints always count as junctions
junction = {n for n, c in use.items() if c > 1}

ids = {}
pts = []
def nid(n):
    if n not in ids:
        ids[n] = len(pts) // 2
        x, y = xy(n)
        pts.extend([round(x), round(y)])
    return ids[n]

# Contract each way into edges between junctions; keep bends for drawing
edges = []
seen = set()
for w in ways:
    if not any(inside(xy(n)) for n in w):
        continue
    start = 0
    for i in range(1, len(w)):
        if w[i] in junction or i == len(w) - 1:
            seg = w[start:i + 1]
            a, b = nid(seg[0]), nid(seg[-1])
            key = (min(a, b), max(a, b), len(seg))
            if a != b and key not in seen and (inside(xy(seg[0])) or inside(xy(seg[-1]))):
                seen.add(key)
                line = [xy(n) for n in seg]
                length = sum(math.dist(line[k], line[k + 1]) for k in range(len(line) - 1))
                # Drop near-collinear interior points
                simple = [line[0]]
                for k in range(1, len(line) - 1):
                    p, q, r = simple[-1], line[k], line[k + 1]
                    off = abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) / max(1e-9, math.dist(p, r))
                    if off > 3:
                        simple.append(q)
                simple.append(line[-1])
                edges.append([a, b, round(length)] + [round(v) for pt in simple[1:-1] for v in pt])
            start = i

# Drop nodes no kept edge uses, then renumber
used = sorted({e[0] for e in edges} | {e[1] for e in edges})
remap = {old: new for new, old in enumerate(used)}
pts = [v for old in used for v in pts[old * 2:old * 2 + 2]]
edges = [[remap[e[0]], remap[e[1]]] + e[2:] for e in edges]
print('nodes', len(pts) // 2, 'edges', len(edges))
json.dump({'source': '© OpenStreetMap contributors (ODbL)', 'span': [HALF_ALONG * 2, HALF_ACROSS * 2], 'nodes': pts, 'edges': edges},
          open(out, 'w'), separators=(',', ':'))
