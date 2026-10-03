import shapefile
from PIL import Image, ImageDraw

INPUT = "ne_10m_land/ne_10m_land.shp"
OUTPUT = "public/textures/earth-land-mask.png"

WIDTH = 2048
HEIGHT = 1024

# Create black ocean background
image = Image.new("L", (WIDTH, HEIGHT), 0)
draw = ImageDraw.Draw(image)

sf = shapefile.Reader(INPUT)

def project(lon, lat):
    x = (lon + 180.0) / 360.0 * WIDTH
    y = (90.0 - lat) / 180.0 * HEIGHT
    return (int(x), int(y))

for shape in sf.shapes():
    points = shape.points
    parts = list(shape.parts) + [len(points)]

    for i in range(len(parts) - 1):
        start = parts[i]
        end = parts[i + 1]

        polygon = [
            project(lon, lat)
            for lon, lat in points[start:end]
        ]

        if len(polygon) >= 3:
            draw.polygon(polygon, fill=255)

# Save white land / black ocean mask
image.save(OUTPUT)

print(f"Created: {OUTPUT}")
print(f"Size: {WIDTH}x{HEIGHT}")