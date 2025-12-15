import re

INPUT_TXT = "urls.txt"
OUTPUT_TXT = "urls_fixed.txt"

def fix_9gag_url(url: str) -> str:
    return re.sub(
        r"img-9gag-fun\.[^/]+",
        "img-9gag-fun.9cache.com/photo",
        url.strip()
    )

with open(INPUT_TXT, encoding="utf-8") as f:
    urls = f.readlines()

fixed_urls = [fix_9gag_url(url) for url in urls if url.strip()]

with open(OUTPUT_TXT, "w", encoding="utf-8") as f:
    f.write("\n".join(fixed_urls))

print("Listo:", OUTPUT_TXT)
