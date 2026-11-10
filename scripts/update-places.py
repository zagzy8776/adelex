"""Build the dispatch location picker from GeoNames, licensed CC BY 4.0."""
import json, pathlib, urllib.request, zipfile
from collections import defaultdict

root = pathlib.Path(__file__).resolve().parents[1]
cache = root / "work/geodata"
cache.mkdir(parents=True, exist_ok=True)
dest = root / "public/places"
dest.mkdir(exist_ok=True)
for name in ("countryInfo.txt", "admin1CodesASCII.txt", "cities5000.zip"):
    if not (cache/name).exists():
        urllib.request.urlretrieve("https://download.geonames.org/export/dump/"+name, cache/name)

countries = {}
for line in (cache/"countryInfo.txt").read_text().splitlines():
    if not line or line.startswith("#"): continue
    row = line.split("\t")
    if row[0] not in ("AN","CS"): countries[row[0]] = row[4]
data = {code: {"regions": {}, "cities": []} for code in countries}
for line in (cache/"admin1CodesASCII.txt").read_text().splitlines():
    key, name, _, _ = line.split("\t")
    country, region = key.split(".",1)
    if country in data: data[country]["regions"][region] = name
with zipfile.ZipFile(cache/"cities5000.zip") as archive:
    for line in archive.read("cities5000.txt").decode().splitlines():
        r = line.split("\t")
        if r[8] in data:
            data[r[8]]["cities"].append([r[0], r[1], r[10], round(float(r[4]),5), round(float(r[5]),5)])
for item in data.values(): item["cities"].sort(key=lambda c:(c[1].casefold(),c[0]))
def save(name, value): (dest/name).write_text(json.dumps(value,ensure_ascii=False,separators=(",",":"))+"\n")
save("countries.json",sorted(countries.items(),key=lambda c:c[1].casefold()))
for letter in sorted({code[0] for code in data}):
    save(letter+".json",{code:val for code,val in data.items() if code.startswith(letter)})
print(len(countries), "countries/territories;", sum(len(d["regions"]) for d in data.values()),"regions;",sum(len(d["cities"]) for d in data.values()),"cities")
