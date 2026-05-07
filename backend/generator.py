import argparse
import json
import random
import sys
from pathlib import Path

NOISE_MIN = 40   # dB
NOISE_MAX = 90   # dB

def assign_noise(obj: dict, rng: random.Random) -> dict:
    """Return a copy of *obj* with a noise_level key added / overwritten."""
    obj["noise_level"] = round(rng.uniform(NOISE_MIN, NOISE_MAX), 1)
    return obj

def process_geojson(data: dict, rng: random.Random) -> dict:
    """Handle a GeoJSON FeatureCollection."""
    for feature in data.get("features", []):
        if "properties" not in feature or feature["properties"] is None:
            feature["properties"] = {}
        feature["properties"]["noise_level"] = round(
            rng.uniform(NOISE_MIN, NOISE_MAX), 1
        )
    return data

def process_list(items: list, rng: random.Random) -> list:
    """Handle a plain list of segment objects."""
    return [assign_noise(item, rng) if isinstance(item, dict) else item
            for item in items]

def process(data, rng: random.Random):
    """Dispatch to the right handler based on detected shape."""
    if isinstance(data, list):
        print(f"  Detected: plain JSON array ({len(data)} segments)")
        return process_list(data, rng)

    if isinstance(data, dict):
        # GeoJSON FeatureCollection
        if data.get("type") == "FeatureCollection":
            n = len(data.get("features", []))
            print(f"  Detected: GeoJSON FeatureCollection ({n} features)")
            return process_geojson(data, rng)

        # Dict with a single top-level list (e.g. {"segments": [...]})
        list_keys = [k for k, v in data.items() if isinstance(v, list)]
        if list_keys:
            key = list_keys[0]
            print(f"  Detected: JSON object – using list field '{key}' "
                f"({len(data[key])} segments)")
            data[key] = process_list(data[key], rng)
            return data

    sys.exit("ERROR: Unrecognised JSON structure. "
            "Expected a FeatureCollection, a list, or an object with a list field.")


def main():
    parser = argparse.ArgumentParser(
        description="Assign random noise levels (40–90 dB) to road segments."
    )
    parser.add_argument("input",  help="Path to input JSON / GeoJSON file")
    parser.add_argument("output", help="Path for enriched output file")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducibility (optional)")
    args = parser.parse_args()

    input_path  = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        sys.exit(f"ERROR: Input file not found: {input_path}")

    rng = random.Random(args.seed)

    print(f"\n{'='*50}")
    print(f"  Input  : {input_path}")
    print(f"  Output : {output_path}")
    print(f"  Seed   : {args.seed if args.seed is not None else 'random'}")
    print(f"{'='*50}")

    with input_path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    enriched = process(data, rng)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(enriched, fh, indent=2, ensure_ascii=False)

    print(f"\n  ✓ Done! Enriched data written to: {output_path}\n")


if __name__ == "__main__":
    main()