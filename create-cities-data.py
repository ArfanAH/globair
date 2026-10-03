import json
import shapefile
from pathlib import Path


INPUT = Path(
    "data/ne_10m_populated_places/ne_10m_populated_places.shp"
)

OUTPUT = Path(
    "public/data/cities.json"
)

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True
)


sf = shapefile.Reader(str(INPUT))

fields = [
    field[0]
    for field in sf.fields[1:]
]


all_places = []


for shape_record in sf.iterShapeRecords():

    record = dict(
        zip(fields, shape_record.record)
    )

    name = (
        record.get("NAME_EN")
        or record.get("NAME")
        or ""
    )

    name = str(name).strip()

    if not name:
        continue

    country = (
        record.get("ADM0NAME")
        or record.get("SOV0NAME")
        or ""
    )

    country = str(country).strip()

    country_code = str(
        record.get("ISO_A2")
        or ""
    ).strip().upper()

    latitude = record.get("LATITUDE")
    longitude = record.get("LONGITUDE")

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        continue

    if not (-90 <= latitude <= 90):
        continue

    if not (-180 <= longitude <= 180):
        continue

    population = record.get("POP_MAX") or 0

    try:
        population = int(population)
    except (TypeError, ValueError):
        population = 0

    scale_rank = record.get("SCALERANK") or 999

    try:
        scale_rank = int(scale_rank)
    except (TypeError, ValueError):
        scale_rank = 999

    all_places.append({
        "name": name,
        "country": country,
        "countryCode": country_code,
        "lat": latitude,
        "lng": longitude,
        "population": population,
        "scaleRank": scale_rank,
        "capital": bool(record.get("ADM0CAP")),
        "worldCity": bool(record.get("WORLDCITY")),
        "megaCity": bool(record.get("MEGACITY")),
        "featureClass": str(
            record.get("FEATURECLA") or ""
        ),
        "wikidataId": str(
            record.get("WIKIDATAID") or ""
        ),
    })


# ---------------------------------------------------------
# CLEAN / FILTER
# ---------------------------------------------------------

cities = []


for city in all_places:

    country_code = city["countryCode"]

    # Remove Antarctica research stations
    if country_code == "ATA":
        continue

    # Remove obviously tiny places unless they are capitals
    if (
        city["population"] < 50000
        and not city["capital"]
        and not city["worldCity"]
        and not city["megaCity"]
    ):
        continue

    # Keep important cities based on Natural Earth metadata
    important = (
        city["capital"]
        or city["worldCity"]
        or city["megaCity"]
        or city["scaleRank"] <= 6
        or city["population"] >= 500000
    )

    if not important:
        continue

    cities.append(city)


# ---------------------------------------------------------
# REMOVE DUPLICATES
# ---------------------------------------------------------

unique = {}


for city in cities:

    key = (
        city["name"].lower(),
        city["countryCode"].lower()
    )

    existing = unique.get(key)

    if existing is None:

        unique[key] = city

    else:

        current_score = (
            0 if city["capital"] else 1,
            0 if city["megaCity"] else 1,
            0 if city["worldCity"] else 1,
            city["scaleRank"],
            -city["population"],
        )

        existing_score = (
            0 if existing["capital"] else 1,
            0 if existing["megaCity"] else 1,
            0 if existing["worldCity"] else 1,
            existing["scaleRank"],
            -existing["population"],
        )

        if current_score < existing_score:
            unique[key] = city


cities = list(unique.values())


# ---------------------------------------------------------
# SORT
# ---------------------------------------------------------

cities.sort(
    key=lambda city: (
        not city["capital"],
        not city["megaCity"],
        not city["worldCity"],
        city["scaleRank"],
        -city["population"],
        city["name"].lower(),
    )
)


# ---------------------------------------------------------
# WRITE JSON
# ---------------------------------------------------------

with OUTPUT.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        cities,
        file,
        ensure_ascii=False,
        indent=2
    )


# ---------------------------------------------------------
# REPORT
# ---------------------------------------------------------

print("=" * 60)
print("CLEAN NATURAL EARTH CITY DATA")
print("=" * 60)

print(f"Original places: {len(all_places)}")
print(f"Clean cities:    {len(cities)}")


dhaka = next(
    (
        city
        for city in cities
        if (
            city["name"].lower() == "dhaka"
            and city["countryCode"] == "BD"
        )
    ),
    None
)


if dhaka:

    print("\nDhaka:")
    print(
        json.dumps(
            dhaka,
            indent=2,
            ensure_ascii=False
        )
    )

else:

    print("\nERROR: Dhaka was not found.")


print("\nOutput:")
print(OUTPUT)

print("\nFirst 20 cities:")

for index, city in enumerate(cities[:20], start=1):

    print(
        f"{index:>2}. "
        f"{city['name']} - "
        f"{city['countryCode']} - "
        f"{city['lat']}, "
        f"{city['lng']}"
    )