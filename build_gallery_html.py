"""Generate before/after gallery HTML from before-after-pairs.json."""
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "before-after-pairs.json"


def enc(name: str) -> str:
    """URL path segment for static file (space-safe)."""
    return quote(name, safe="")


JOB_TITLES = {
    "chris": "Chris",
    "house1": "House 1",
    "marcus": "Marcus",
    "thenest": "The Nest",
}


def img_url(filename: str) -> str:
    return f"before-after/{enc(filename)}"


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    jobs = data["jobs"]
    order = ["chris", "house1", "marcus", "thenest"]

    lines = []
    for job in order:
        pairs = jobs.get(job, [])
        if not pairs:
            continue
        jid = f"job-{job}"
        title = JOB_TITLES[job]
        lines.append(f'                <article class="job-showcase reveal" id="{jid}">')
        lines.append('                    <header class="job-showcase-header">')
        lines.append(f'                        <p class="job-showcase-eyebrow">PROJECT</p>')
        lines.append(f'                        <h3 class="job-showcase-title">{title}</h3>')
        lines.append(
            f'                        <p class="job-showcase-desc">{len(pairs)} before &amp; after comparisons — drag the slider on each photo.</p>'
        )
        lines.append("                    </header>")
        lines.append('                    <div class="ba-slider-grid">')
        for p in pairs:
            before_f = p["before"]
            after_f = p["after"]
            num = p["num"]
            label = f"{before_f} → {after_f}"
            safe_label = (
                label.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
            )
            lines.append('                        <div class="ba-slider-card">')
            lines.append(
                f'                            <p class="ba-filename-label" title="{safe_label}">{before_f} ↔ {after_f}</p>'
            )
            lines.append('                            <div class="ba-container" role="img" aria-label="Before and after comparison">')
            lines.append(
                f'                                <div class="ba-after" style="background-image: url(\'{img_url(after_f)}\');"></div>'
            )
            lines.append(
                f'                                <div class="ba-before" style="background-image: url(\'{img_url(before_f)}\'); width: 50%;"></div>'
            )
            lines.append('                                <button type="button" class="ba-handle" aria-label="Drag to compare before and after">')
            lines.append('                                    <i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i>')
            lines.append("                                </button>")
            lines.append('                                <span class="ba-tag ba-tag-before">Before</span>')
            lines.append('                                <span class="ba-tag ba-tag-after">After</span>')
            lines.append("                            </div>")
            lines.append("                        </div>")
        lines.append("                    </div>")
        lines.append("                </article>")

    out = "\n".join(lines)
    (ROOT / "gallery-generated.html").write_text(out, encoding="utf-8")
    print("Wrote gallery-generated.html", len(out), "chars")

    # Featured pair for #projects (first chris pair)
    chris = jobs.get("chris", [{}])[0]
    if chris:
        print("FEATURED", img_url(chris["before"]), img_url(chris["after"]))

    # Hero picks: one after from each of 3 jobs
    hero_afters = []
    for j in ["house1", "marcus", "thenest"]:
        lst = jobs.get(j, [])
        if lst:
            hero_afters.append(img_url(lst[0]["after"]))
    if len(hero_afters) < 3 and jobs.get("chris"):
        hero_afters.insert(0, img_url(jobs["chris"][0]["after"]))
    hero_afters = hero_afters[:3]
    print("HERO", hero_afters)


if __name__ == "__main__":
    main()
