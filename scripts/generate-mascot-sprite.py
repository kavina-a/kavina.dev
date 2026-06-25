#!/usr/bin/env python3
"""Generate the voice-agent pixel bat sprite sheet (6×4 grid, 32px frames)."""

from pathlib import Path
from PIL import Image

FRAME = 32
COLS = 6
ROWS = 4
SHEET_W, SHEET_H = COLS * FRAME, ROWS * FRAME

# Palette
_ = (0, 0, 0, 0)
B = (12, 10, 18, 255)       # outline
P = (36, 28, 52, 255)       # body
W = (22, 16, 34, 255)       # wing
G = (106, 255, 180, 255)    # accent / eyes / sonar
E = (255, 120, 120, 255)    # squeak mouth
Y = (255, 230, 120, 255)    # eye shine


def canvas():
    return [[_ for _ in range(FRAME)] for _ in range(FRAME)]


def px(grid, x, y, color):
    if 0 <= x < FRAME and 0 <= y < FRAME:
        grid[y][x] = color


def rect(grid, x, y, w, h, color):
    for dy in range(h):
        for dx in range(w):
            px(grid, x + dx, y + dy, color)


def draw_head(grid, cx, cy, ear_tilt=0):
    """Pointy-eared bat head."""
    for dy, row in enumerate([
        "..ee..ee..",
        ".eeeeeeee.",
        ".epppeppp.",
        "eppppppppe",
        "epgypyygpe",
        "eppppppppe",
        ".eppppppe.",
        "..eppppe..",
    ]):
        for dx, ch in enumerate(row):
            x = cx - 5 + dx
            y = cy + dy
            if ch == "e":
                px(grid, x, y, B)
            elif ch == "p":
                px(grid, x, y, P)
            elif ch == "g":
                px(grid, x, y, G)
            elif ch == "y":
                px(grid, x, y, Y)
            elif ch == ".":
                pass
    # ear tips
    px(grid, cx - 4 + ear_tilt, cy - 1, B)
    px(grid, cx + 3 - ear_tilt, cy - 1, B)


def draw_body(grid, cx, cy):
    rect(grid, cx - 2, cy + 7, 5, 4, P)
    rect(grid, cx - 1, cy + 7, 3, 4, B)
    px(grid, cx, cy + 10, P)
    px(grid, cx, cy + 11, B)


def draw_wing_left(grid, cx, cy, flap):
    """flap: 0=folded, 1=mid, 2=up"""
    if flap == 0:
        pts = [
            (cx - 3, cy + 8), (cx - 8, cy + 9), (cx - 11, cy + 12),
            (cx - 10, cy + 14), (cx - 6, cy + 13), (cx - 3, cy + 11),
        ]
    elif flap == 1:
        pts = [
            (cx - 3, cy + 8), (cx - 9, cy + 6), (cx - 13, cy + 9),
            (cx - 12, cy + 12), (cx - 7, cy + 11), (cx - 3, cy + 10),
        ]
    else:
        pts = [
            (cx - 3, cy + 8), (cx - 10, cy + 4), (cx - 14, cy + 7),
            (cx - 13, cy + 10), (cx - 8, cy + 9), (cx - 3, cy + 9),
        ]
    for x, y in pts:
        px(grid, x, y, W)
    # wing membrane accent
    px(grid, pts[2][0], pts[2][1], G)
    px(grid, pts[1][0], pts[1][1], B)


def draw_wing_right(grid, cx, cy, flap):
    if flap == 0:
        pts = [
            (cx + 3, cy + 8), (cx + 8, cy + 9), (cx + 11, cy + 12),
            (cx + 10, cy + 14), (cx + 6, cy + 13), (cx + 3, cy + 11),
        ]
    elif flap == 1:
        pts = [
            (cx + 3, cy + 8), (cx + 9, cy + 6), (cx + 13, cy + 9),
            (cx + 12, cy + 12), (cx + 7, cy + 11), (cx + 3, cy + 10),
        ]
    else:
        pts = [
            (cx + 3, cy + 8), (cx + 10, cy + 4), (cx + 14, cy + 7),
            (cx + 13, cy + 10), (cx + 8, cy + 9), (cx + 3, cy + 9),
        ]
    for x, y in pts:
        px(grid, x, y, W)
    px(grid, pts[2][0], pts[2][1], G)
    px(grid, pts[1][0], pts[1][1], B)


def draw_feet(grid, cx, cy, spread=0):
    px(grid, cx - 1 - spread, cy + 12, B)
    px(grid, cx + 1 + spread, cy + 12, B)


def frame_idle(i):
    g = canvas()
    bob = i % 2
    cx, cy = 16, 8 + bob
    draw_wing_left(g, cx, cy, 0)
    draw_wing_right(g, cx, cy, 0)
    draw_body(g, cx, cy)
    draw_head(g, cx, cy, ear_tilt=i % 2)
    draw_feet(g, cx, cy)
    return g


def frame_fly(i):
    g = canvas()
    bob = [0, -1, 0, 1, 0, -1][i % 6]
    flap = [2, 1, 0, 1, 2, 1][i % 6]
    cx, cy = 16, 9 + bob
    draw_wing_left(g, cx, cy, flap)
    draw_wing_right(g, cx, cy, flap)
    draw_body(g, cx, cy)
    draw_head(g, cx, cy)
    return g


def frame_talk(i):
    g = canvas()
    bob = i % 2
    cx, cy = 16, 8 + bob
    flap = 1 if i % 2 else 2
    draw_wing_left(g, cx, cy, flap)
    draw_wing_right(g, cx, cy, flap)
    draw_body(g, cx, cy)
    draw_head(g, cx, cy)
    # open squeak mouth
    px(g, cx, cy + 5, E if i % 2 == 0 else B)
    px(g, cx - 1, cy + 5, E if i % 2 == 0 else P)
    px(g, cx + 1, cy + 5, E if i % 2 == 0 else P)
    return g


def frame_listen(i):
    g = canvas()
    bob = i % 2
    cx, cy = 16, 8 + bob
    draw_wing_left(g, cx, cy, 0)
    draw_wing_right(g, cx, cy, 0)
    draw_body(g, cx, cy)
    draw_head(g, cx, cy, ear_tilt=1)
    draw_feet(g, cx, cy)
    # sonar rings
    ring = i % 4
    for r in range(ring + 1):
        y = cy + 2 - r
        for x in range(cx - 3 - r, cx + 4 + r):
            if abs(x - cx) == 3 + r:
                px(g, x, y, G)
    return g


def build_sheet():
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), _)
    builders = [
        [frame_idle] * 4 + [frame_idle] * 2,
        [frame_fly] * 6,
        [frame_talk] * 4 + [frame_talk] * 2,
        [frame_listen] * 4 + [frame_listen] * 2,
    ]
    for row in range(ROWS):
        for col in range(COLS):
            fn = builders[row][col]
            img = to_image(fn(col if row == 1 else col % 4))
            sheet.paste(img, (col * FRAME, row * FRAME))
    return sheet


def to_image(grid):
    img = Image.new("RGBA", (FRAME, FRAME), _)
    px_data = img.load()
    for y in range(FRAME):
        for x in range(FRAME):
            px_data[x, y] = grid[y][x]
    return img


out = Path(__file__).resolve().parent.parent / "public" / "voice-agent" / "mascot.png"
out.parent.mkdir(parents=True, exist_ok=True)
build_sheet().save(out, optimize=True)
print(f"Wrote {out} ({SHEET_W}x{SHEET_H})")
