#!/usr/bin/env python3
import json
import os
import urllib.request
import io
from PIL import Image

CHAR_MAP = {
    # Attack on Titan
    "aot_eren": "https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg",
    "aot_levi": "https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png",
    "aot_mikasa": "https://s4.anilist.co/file/anilistcdn/character/large/b40881-F3gr1PkreDvj.png",
    # Cavaleiros do Zodíaco
    "cdz_seiya": "https://s4.anilist.co/file/anilistcdn/character/large/2285.jpg",
    "cdz_shiryu": "https://s4.anilist.co/file/anilistcdn/character/large/b5922-DzYFLk6qzQif.png",
    "cdz_hyoga": "https://s4.anilist.co/file/anilistcdn/character/large/b5921-6gn83rnXxLrL.png",
    "cdz_shun": "https://s4.anilist.co/file/anilistcdn/character/large/b2440-cRlQXhwEl6Zb.png",
    "cdz_ikki": "https://s4.anilist.co/file/anilistcdn/character/large/5923.jpg",
    # Death Note
    "death_l": "https://s4.anilist.co/file/anilistcdn/character/large/b71-1W4panC53vfs.png",
    "death_light": "https://s4.anilist.co/file/anilistcdn/character/large/b80-26EhwSsSqQ50.png",
    # Demon Slayer
    "ds_tanjiro": "https://s4.anilist.co/file/anilistcdn/character/large/b126071-BTNEc1nRIv68.png",
    "ds_nezuko": "https://s4.anilist.co/file/anilistcdn/character/large/b127518-NRlq1CQ1v1ro.png",
    "ds_zenitsu": "https://s4.anilist.co/file/anilistcdn/character/large/b129131-FZrQ7lSlxmEr.png",
    "ds_inosuke": "https://s4.anilist.co/file/anilistcdn/character/large/n129130-SJC0Kn1DU39E.jpg",
    # Dragon Ball
    "dbz_goku": "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png",
    "dbz_vegeta": "https://s4.anilist.co/file/anilistcdn/character/large/b913-NIFkKazWM8VO.png",
    "dbz_gohan": "https://s4.anilist.co/file/anilistcdn/character/large/b2093-kdFZhqcNSsqW.png",
    "dbz_piccolo": "https://s4.anilist.co/file/anilistcdn/character/large/b914-KuS8AWjqBrqa.jpg",
    "dbz_trunks": "https://s4.anilist.co/file/anilistcdn/character/large/b2707-YKWmn4q87oF8.png",
    # Jujutsu Kaisen
    "jjk_gojo": "https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png",
    "jjk_itadori": "https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png",
    "jjk_megumi": "https://s4.anilist.co/file/anilistcdn/character/large/b126635-L0y3I92JSUkN.png",
    "jjk_sukuna": "https://s4.anilist.co/file/anilistcdn/character/large/b133701-rCQuDpHr3UZL.png",
    # Naruto
    "naruto_naruto": "https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png",
    "naruto_sasuke": "https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png",
    "naruto_kakashi": "https://s4.anilist.co/file/anilistcdn/character/large/b85-mkVBh2yjxjmx.png",
    "naruto_itachi": "https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png",
    # Solo Leveling
    "solo_jinwoo": "https://s4.anilist.co/file/anilistcdn/character/large/b129928-BCEjVaP0AQSw.png"
}

AVATARS_DIR = os.path.abspath("frontend/avatars")
CATALOG_PATH = os.path.join(AVATARS_DIR, "catalog.json")

def process_and_save_avatar(cid, url):
    print(f"Downloading {cid} from {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        img_bytes = resp.read()
    
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    w, h = img.size
    
    # Square crop focusing on upper center (character face)
    side = min(w, h)
    left = (w - side) // 2
    # For portraits, prioritize the top 20% to capture face
    top = max(0, min(int(h * 0.05), h - side)) if h > w else (h - side) // 2
    right = left + side
    bottom = top + side
    
    cropped = img.crop((left, top, right, bottom))
    resized = cropped.resize((240, 240), Image.Resampling.LANCZOS)
    
    out_path = os.path.join(AVATARS_DIR, f"{cid}.png")
    resized.save(out_path, format="PNG", optimize=True)
    print(f"Saved {out_path} ({w}x{h} -> 240x240)")

def main():
    os.makedirs(AVATARS_DIR, exist_ok=True)
    for cid, url in CHAR_MAP.items():
        try:
            process_and_save_avatar(cid, url)
        except Exception as e:
            print(f"Error processing {cid}: {e}")

    # Now update catalog.json
    print("Updating catalog.json...")
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    updated_count = 0
    # Update categories
    for cat in catalog.get("categories", []):
        for item in cat.get("items", []):
            cid = item.get("id")
            if cid in CHAR_MAP:
                item["img"] = f"/static/avatars/{cid}.png"
                updated_count += 1

    # Update all_items if present
    if "all_items" in catalog:
        for item in catalog["all_items"]:
            cid = item.get("id")
            if cid in CHAR_MAP:
                item["img"] = f"/static/avatars/{cid}.png"

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"Done! Updated {updated_count} avatar entries in catalog.json.")

if __name__ == "__main__":
    main()
