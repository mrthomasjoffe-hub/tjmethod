"""Maze money tube generator. Outputs binary STL files. Needs only numpy.

Core  : hollow tube with raised maze walls on the outside, flange cap, keyring tab.
Sleeve: plain tube with one inward guide pin that rides the maze path.
All units are millimetres.
"""
import math, random, struct, sys, os
import numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))

# ---------------- parameters ----------------
SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 7
C, R = 12, 11            # maze cells around, maze cells along
BLOCK_Z = 3.0            # axial size of one block
R_BORE = 8.75            # bore radius (17.5 mm bore for the rolled note)
R_FLOOR = 10.3           # maze path floor radius
R_WALL = 12.0            # maze wall top radius
R_FLANGE = 17.0
NS = 96                  # angular samples (4 per block)
Z_MAZE = (2 * R + 1) * BLOCK_Z          # 69
Z_NECK = Z_MAZE + 1.0                   # 70, flange face
Z_TOP = Z_NECK + 6.0                    # 76
Z_BORE = Z_TOP - 3.0                    # 73, closed floor of bore
CLEAR = 0.35             # sleeve clearance over wall tops
SLEEVE_WALL = 2.0
PIN = 2.2                # pin cross section
PIN_TIP = R_FLOOR + 0.4  # pin tip radius
PIN_FROM_MOUTH = 5.0     # pin centre distance from sleeve mouth
SLEEVE_LEN = 74.0
SLEEVE_FLOOR = 2.0
A = 2 * C
ZB = 2 * R + 1


class Mesh:
    def __init__(self):
        self.t = []

    def tri(self, a, b, c, n=None):
        a, b, c = map(np.array, (a, b, c))
        if n is not None:
            if np.dot(np.cross(b - a, c - a), n) < 0:
                b, c = c, b
        if np.linalg.norm(np.cross(b - a, c - a)) < 1e-12:
            return
        self.t.append((a, b, c))

    def quad(self, a, b, c, d, n):
        self.tri(a, b, c, n)
        self.tri(a, c, d, n)

    def arr(self):
        return np.array(self.t, dtype=np.float64)


def cyl(r, th, z):
    return np.array([r * math.cos(th), r * math.sin(th), z])


def radial(th):
    return np.array([math.cos(th), math.sin(th), 0.0])


def tang(th):
    return np.array([-math.sin(th), math.cos(th), 0.0])


def make_maze(seed):
    rnd = random.Random(seed)
    wall = np.ones((A, ZB), bool)
    for c in range(C):
        for r in range(R):
            wall[2 * c, 2 * r + 1] = False
    adj = {(c, r): [] for c in range(C) for r in range(R)}
    seen = {(0, 0)}
    stack = [(0, 0)]
    while stack:
        c, r = stack[-1]
        opts = []
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = ((c + dc) % C, r + dr)
            if 0 <= n[1] < R and n not in seen:
                opts.append((dc, dr, n))
        if not opts:
            stack.pop()
            continue
        dc, dr, n = rnd.choice(opts)
        if dc == 1:
            wall[(2 * c + 1) % A, 2 * r + 1] = False
        elif dc == -1:
            wall[(2 * c - 1) % A, 2 * r + 1] = False
        elif dr == 1:
            wall[2 * c, 2 * r + 2] = False
        else:
            wall[2 * c, 2 * r] = False
        adj[(c, r)].append(n)
        adj[n].append((c, r))
        seen.add(n)
        stack.append(n)
    wall[0, 0] = False  # entrance at cell (0,0)
    # distance from entrance
    dist = {(0, 0): 0}
    q = [(0, 0)]
    for u in q:
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    goal = max((c for c in range(C)), key=lambda c: dist[(c, R - 1)])
    return wall, dist[(goal, R - 1)], goal


def build_core(wall):
    m = Mesh()
    th = [2 * math.pi * k / NS for k in range(NS + 1)]
    rows = []
    for j in range(ZB):
        rows.append((j * BLOCK_Z, (j + 1) * BLOCK_Z,
                     [R_WALL if wall[(s // 4) % A, j] else R_FLOOR for s in range(NS)]))
    rows.append((Z_MAZE, Z_NECK, [R_WALL] * NS))
    rows.append((Z_NECK, Z_TOP, [R_FLANGE] * NS))
    for ri, (z0, z1, rad) in enumerate(rows):
        for s in range(NS):
            r = rad[s]
            mid = 0.5 * (th[s] + th[s + 1])
            m.quad(cyl(r, th[s], z0), cyl(r, th[s + 1], z0), cyl(r, th[s + 1], z1), cyl(r, th[s], z1), radial(mid))
            ra = rad[s - 1]
            if abs(ra - r) > 1e-9:  # radial side wall at th[s]
                lo, hi = min(ra, r), max(ra, r)
                n = -tang(th[s]) if r > ra else tang(th[s])
                m.quad(cyl(lo, th[s], z0), cyl(hi, th[s], z0), cyl(hi, th[s], z1), cyl(lo, th[s], z1), n)
        if ri + 1 < len(rows):  # ring face to row above
            up = rows[ri + 1][2]
            for s in range(NS):
                a, b = rad[s], up[s]
                if abs(a - b) > 1e-9:
                    lo, hi = min(a, b), max(a, b)
                    n = np.array([0, 0, 1.0 if a > b else -1.0])
                    m.quad(cyl(lo, th[s], z1), cyl(hi, th[s], z1), cyl(hi, th[s + 1], z1), cyl(lo, th[s + 1], z1), n)
    for s in range(NS):
        r = rows[0][2][s]
        cuts = [R_BORE] + [x for x in (R_FLOOR, R_WALL) if R_BORE < x < r] + [r]
        for lo, hi in zip(cuts[:-1], cuts[1:]):
            m.quad(cyl(lo, th[s], 0), cyl(hi, th[s], 0), cyl(hi, th[s + 1], 0), cyl(lo, th[s + 1], 0), np.array([0, 0, -1.0]))
        m.tri(cyl(0, 0, Z_TOP), cyl(R_FLANGE, th[s], Z_TOP), cyl(R_FLANGE, th[s + 1], Z_TOP), np.array([0, 0, 1.0]))
        mid = 0.5 * (th[s] + th[s + 1])
        m.quad(cyl(R_BORE, th[s], 0), cyl(R_BORE, th[s + 1], 0), cyl(R_BORE, th[s + 1], Z_BORE), cyl(R_BORE, th[s], Z_BORE), -radial(mid))
        m.tri(cyl(0, 0, Z_BORE), cyl(R_BORE, th[s], Z_BORE), cyl(R_BORE, th[s + 1], Z_BORE), np.array([0, 0, -1.0]))
    return m


def annulus_prism(cx, cy, ro, ri, z0, z1, n=64, hollow_floor=False):
    m = Mesh()
    off = np.array([cx, cy, 0.0])
    for k in range(n):
        a, b = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        mid = 0.5 * (a + b)
        m.quad(off + cyl(ro, a, z0), off + cyl(ro, b, z0), off + cyl(ro, b, z1), off + cyl(ro, a, z1), radial(mid))
        if ri > 0:
            m.quad(off + cyl(ri, a, z0), off + cyl(ri, b, z0), off + cyl(ri, b, z1), off + cyl(ri, a, z1), -radial(mid))
            m.quad(off + cyl(ri, a, z1), off + cyl(ro, a, z1), off + cyl(ro, b, z1), off + cyl(ri, b, z1), np.array([0, 0, 1.0]))
            m.quad(off + cyl(ri, a, z0), off + cyl(ro, a, z0), off + cyl(ro, b, z0), off + cyl(ri, b, z0), np.array([0, 0, -1.0]))
        else:
            m.tri(off + cyl(0, 0, z1), off + cyl(ro, a, z1), off + cyl(ro, b, z1), np.array([0, 0, 1.0]))
            m.tri(off + cyl(0, 0, z0), off + cyl(ro, a, z0), off + cyl(ro, b, z0), np.array([0, 0, -1.0]))
    return m


def box(x0, x1, y0, y1, z0, z1, rot=0.0):
    m = Mesh()
    c, s = math.cos(rot), math.sin(rot)
    def P(x, y, z):
        return np.array([c * x - s * y, s * x + c * y, z])
    v = {(i, j, k): P((x0, x1)[i], (y0, y1)[j], (z0, z1)[k]) for i in (0, 1) for j in (0, 1) for k in (0, 1)}
    faces = [((0, 0, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1), (-c, -s, 0)),
             ((1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1), (c, s, 0)),
             ((0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1), (s, -c, 0)),
             ((0, 1, 0), (1, 1, 0), (1, 1, 1), (0, 1, 1), (-s, c, 0)),
             ((0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0), (0, 0, -1)),
             ((0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1), (0, 0, 1))]
    for a, b, c_, d, n in faces:
        m.quad(v[a], v[b], v[c_], v[d], np.array(n, float))
    return m


def build_sleeve(closed):
    ri = R_WALL + CLEAR
    ro = ri + SLEEVE_WALL
    L = SLEEVE_LEN
    fl = SLEEVE_FLOOR if closed else 0.0
    m = Mesh()
    n = 96
    for k in range(n):
        a, b = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        mid = 0.5 * (a + b)
        m.quad(cyl(ro, a, 0), cyl(ro, b, 0), cyl(ro, b, L), cyl(ro, a, L), radial(mid))
        m.quad(cyl(ri, a, fl), cyl(ri, b, fl), cyl(ri, b, L), cyl(ri, a, L), -radial(mid))
        m.quad(cyl(ri, a, L), cyl(ro, a, L), cyl(ro, b, L), cyl(ri, b, L), np.array([0, 0, 1.0]))
        if closed:
            m.tri(cyl(0, 0, fl), cyl(ri, a, fl), cyl(ri, b, fl), np.array([0, 0, 1.0]))
            m.tri(cyl(0, 0, 0), cyl(ro, a, 0), cyl(ro, b, 0), np.array([0, 0, -1.0]))
        else:
            m.quad(cyl(ri, a, 0), cyl(ro, a, 0), cyl(ro, b, 0), cyl(ri, b, 0), np.array([0, 0, -1.0]))
    ang = math.radians(360.0 / A / 2)  # centre of entrance block
    zp = L - PIN_FROM_MOUTH
    pin = box(PIN_TIP, ro - 0.8, -PIN / 2, PIN / 2, zp - PIN / 2, zp + PIN / 2, rot=ang)
    return [m, pin]


def validate(name, m):
    t = m.arr()
    v = np.round(t.reshape(-1, 3), 5)
    idx = {}
    ids = np.array([idx.setdefault(tuple(p), len(idx)) for p in v]).reshape(-1, 3)
    edges = {}
    for a, b, c in ids:
        for e in ((a, b), (b, c), (c, a)):
            edges[e] = edges.get(e, 0) + 1
    bad = sum(1 for (a, b), k in edges.items() if k != 1 or edges.get((b, a), 0) != 1)
    vol = np.sum(np.einsum('ij,ij->i', t[:, 0], np.cross(t[:, 1], t[:, 2]))) / 6
    print(f"{name}: {len(t)} tris, bad edges {bad}, volume {vol:.0f} mm3")
    return bad == 0 and vol > 0


def write_stl(path, meshes, xf):
    tris = np.concatenate([mm.arr() for mm in meshes])
    tris = np.array([[xf(p) for p in tri] for tri in tris])
    with open(path, 'wb') as f:
        f.write(b'maze money tube'.ljust(80, b' '))
        f.write(struct.pack('<I', len(tris)))
        for a, b, c in tris:
            n = np.cross(b - a, c - a)
            ln = np.linalg.norm(n)
            n = n / ln if ln > 0 else n
            f.write(struct.pack('<12fH', *n, *a, *b, *c, 0))


if __name__ == '__main__':
    wall, steps, goal = make_maze(SEED)
    print('maze seed', SEED, 'solution length', steps, 'cells, goal column', goal)
    core = [build_core(wall)]
    zt = Z_TOP - 3.0
    ring = annulus_prism(22.0, 0.0, 4.5, 2.0, zt, Z_TOP)
    bar = box(15.5, 19.0, -2.5, 2.5, zt, Z_TOP)
    ok = all(validate(n, mm) for n, mm in (('core', core[0]), ('tab ring', ring), ('tab bar', bar)))
    sl_closed = build_sleeve(True)
    sl_open = build_sleeve(False)
    ok &= validate('sleeve closed', sl_closed[0]) and validate('sleeve open', sl_open[0]) and validate('pin', sl_closed[1])
    # print orientation: core flange face on the bed
    flip = lambda p: np.array([p[0], -p[1], Z_TOP - p[2]])
    ident = lambda p: p
    write_stl(os.path.join(OUT, 'maze_core.stl'), core + [ring, bar], flip)
    write_stl(os.path.join(OUT, 'sleeve_closed_end.stl'), sl_closed, ident)
    write_stl(os.path.join(OUT, 'sleeve_open_tube.stl'), sl_open, ident)
    print('all shells watertight:', ok)
