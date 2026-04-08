"""Generate gallery/ hub + per-job pages from before-after-pairs.json; trim index.html gallery blob."""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "before-after-pairs.json"
GALLERY_DIR = ROOT / "gallery"

JOB_META = [
    ("chris", "Chris", "Residential and mixed cleanouts — drag each slider to compare before and after."),
    ("house1", "House 1", "Full property and yard haul-offs — real results from one job series."),
    ("marcus", "Marcus", "Garage, pile, and load-out projects — see the space come back."),
    ("thenest", "The Nest", "Heavy volume clears — before and after in one place."),
]


def enc(name: str) -> str:
    return quote(name, safe="")


def img_url(filename: str) -> str:
    return f"../before-after/{enc(filename)}"


def pairs_html(pairs: list, job_title: str) -> str:
    lines = []
    for i, p in enumerate(pairs, start=1):
        before_f, after_f = p["before"], p["after"]
        cap = f"{job_title} — comparison {i} of {len(pairs)}"
        lines.append('                        <div class="ba-slider-card">')
        lines.append(
            f'                            <div class="ba-container" role="img" aria-label="{cap}">'
        )
        lines.append(
            f'                                <div class="ba-after" style="background-image: url(\'{img_url(after_f)}\');"></div>'
        )
        lines.append(
            f'                                <div class="ba-before" style="background-image: url(\'{img_url(before_f)}\'); width: 50%;"></div>'
        )
        lines.append(
            '                                <button type="button" class="ba-handle" aria-label="Drag to compare before and after">'
        )
        lines.append(
            '                                    <i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i>'
        )
        lines.append("                                </button>")
        lines.append('                                <span class="ba-tag ba-tag-before">Before</span>')
        lines.append('                                <span class="ba-tag ba-tag-after">After</span>')
        lines.append("                            </div>")
        lines.append("                        </div>")
    return "\n".join(lines)


def shell(
    title: str,
    description: str,
    canonical_path: str,
    main_inner: str,
    og_title: str | None = None,
) -> str:
    og_title = og_title or title
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://tandmbak.com/{canonical_path}">
    <link rel="icon" type="image/png" href="../TM-L-Round-150x150.png">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tandmbak.com/{canonical_path}">
    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../index.css">
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "{og_title}",
      "description": "{description}",
      "url": "https://tandmbak.com/{canonical_path}",
      "isPartOf": {{ "@type": "WebSite", "name": "T&M Hauling", "url": "https://tandmbak.com" }}
    }}
    </script>
</head>
<body class="subpage-body" style="padding-top: 0;">
    <div class="haul-bg-layer" aria-hidden="true"></div>
    <header id="main-header" class="gallery-sub-header">
        <div class="top-bar">
            <div class="container top-bar-inner">
                <div class="contact-info">
                    <a href="tel:+16619966950" style="color:white;"><i class="fa-solid fa-phone" style="color:var(--primary);"></i> (661) 996-6950</a>
                    <a href="mailto:tandmhaulingbak@gmail.com" style="color:white;"><i class="fa-solid fa-envelope" style="color:var(--primary);"></i> Email</a>
                </div>
                <div class="social-links" style="display:flex; gap:1.5rem; color:white;">
                    <a href="https://www.instagram.com/tm_hauling/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://share.google/05y5uX2DmmRPEeol2" target="_blank" rel="noopener noreferrer" aria-label="Google Business"><i class="fa-brands fa-google"></i></a>
                </div>
            </div>
        </div>
        <div class="main-nav">
            <div class="container nav-content">
                <a href="../index.html" class="logo" aria-label="T&amp;M Hauling Home">
                    <img src="../TM-L-2-scaled.png" alt="T&amp;M Hauling" width="120" height="40" style="height: 40px; width: auto;">
                </a>
                <nav class="desktop-nav">
                    <a href="../index.html">HOME</a>
                    <a href="../index.html#services">SERVICES</a>
                    <a href="index.html">GALLERY</a>
                    <a href="../index.html#schedule">BOOK</a>
                    <a href="../contact.html">CONTACT</a>
                </nav>
                <button type="button" class="mobile-toggle" aria-label="Open menu" onclick="document.getElementById('mobile-nav-g').classList.toggle('active')">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>
        </div>
        <div class="mobile-nav-overlay" id="mobile-nav-g">
            <button type="button" class="mobile-close" aria-label="Close" onclick="document.getElementById('mobile-nav-g').classList.remove('active')">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="mobile-nav-links">
                <a href="../index.html" onclick="document.getElementById('mobile-nav-g').classList.remove('active')">HOME</a>
                <a href="index.html" onclick="document.getElementById('mobile-nav-g').classList.remove('active')">GALLERY</a>
                <a href="../index.html#schedule" onclick="document.getElementById('mobile-nav-g').classList.remove('active')">BOOK</a>
                <a href="../contact.html" onclick="document.getElementById('mobile-nav-g').classList.remove('active')">CONTACT</a>
            </div>
        </div>
    </header>
    <main class="gallery-sub-main">
{main_inner}
    </main>
    <footer class="footer-main">
        <div class="container" style="text-align: center;">
            <p style="color: var(--text-muted); font-size: 0.85rem;"><a href="../index.html" style="color: var(--primary);">← Back to home</a> · <a href="index.html" style="color: var(--primary);">Gallery hub</a></p>
        </div>
    </footer>
    <div id="thumb-bar">
        <a href="tel:+16619966950"><i class="fa-solid fa-phone"></i> CALL</a>
        <a href="../contact.html" class="thumb-bar-book"><i class="fa-solid fa-calendar-check"></i> CONTACT</a>
        <div onclick="toggleBot()" role="button" tabindex="0"><i class="fa-solid fa-robot"></i> CHAT AI</div>
    </div>
    <div id="bot-container">
        <div class="bot-header">
            <span>T&amp;M AI ASSISTANT</span>
            <button type="button" id="bot-toggle" style="background:none; border:none; color:white; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="bot-messages"></div>
        <form id="bot-form" class="bot-input-area">
            <input type="text" id="bot-input" placeholder="How can we help?">
            <button type="submit" style="background:var(--primary); color:white; border:none; border-radius:50%; width:35px; height:35px;"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
    </div>
    <script src="../bot.js"></script>
    <script>
        function toggleBot() {{
            const bot = document.getElementById('bot-container');
            if (bot) bot.classList.toggle('active');
        }}
        document.getElementById('bot-toggle').onclick = toggleBot;
        window.toggleBot = function() {{ document.getElementById('bot-container')?.classList.toggle('active'); }};
        const observer = new IntersectionObserver((entries) => {{
            entries.forEach(e => {{ if (e.isIntersecting) e.target.classList.add('active'); }});
        }}, {{ threshold: 0.05, rootMargin: '0px 0px 12% 0px' }});
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        (function () {{
            let activeMove = null;
            function endDrag() {{
                if (!activeMove) return;
                document.removeEventListener('mousemove', activeMove.mouse);
                document.removeEventListener('touchmove', activeMove.touch);
                activeMove = null;
            }}
            document.querySelectorAll('.ba-container').forEach((container) => {{
                const beforeLayer = container.querySelector('.ba-before');
                const handle = container.querySelector('.ba-handle');
                if (!beforeLayer || !handle) return;
                const moveSlider = (clientX) => {{
                    const rect = container.getBoundingClientRect();
                    if (rect.width <= 0) return;
                    let p = ((clientX - rect.left) / rect.width) * 100;
                    p = Math.max(0, Math.min(100, p));
                    beforeLayer.style.width = p + '%';
                    handle.style.left = p + '%';
                }};
                const onMouseMove = (e) => moveSlider(e.clientX);
                const onTouchMove = (e) => {{
                    if (e.touches[0]) {{ e.preventDefault(); moveSlider(e.touches[0].clientX); }}
                }};
                const startDrag = (e) => {{
                    endDrag();
                    if (e.type === 'mousedown') e.preventDefault();
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('touchmove', onTouchMove, {{ passive: false }});
                    const end = () => endDrag();
                    document.addEventListener('mouseup', end, {{ once: true }});
                    document.addEventListener('touchend', end, {{ once: true }});
                    document.addEventListener('touchcancel', end, {{ once: true }});
                    activeMove = {{ mouse: onMouseMove, touch: onTouchMove }};
                }};
                handle.addEventListener('mousedown', startDrag);
                handle.addEventListener('touchstart', startDrag, {{ passive: true }});
                handle.addEventListener('click', (e) => e.stopPropagation());
                container.addEventListener('click', (e) => {{
                    if (e.target === handle || handle.contains(e.target)) return;
                    moveSlider(e.clientX);
                }});
            }});
        }})();
    </script>
</body>
</html>
"""


def main():
    raw = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    jobs = raw["jobs"]
    GALLERY_DIR.mkdir(exist_ok=True)

    # Hub
    cards = []
    for slug, title, desc in JOB_META:
        pairs = jobs.get(slug, [])
        if not pairs:
            continue
        cards.append(
            f"""            <a href="{slug}.html" class="gallery-hub-card reveal">
                <div class="gallery-hub-card-inner">
                    <h3 class="gallery-hub-card-title">{title}</h3>
                    <p class="gallery-hub-card-desc">{desc}</p>
                    <span class="gallery-hub-card-meta">{len(pairs)} comparisons</span>
                </div>
            </a>"""
        )
    hub_main = f"""
        <section class="gallery-page-hero reveal" style="padding: clamp(6rem, 12vw, 9rem) 0 3rem;">
            <div class="container text-center">
                <p class="label-eyebrow" style="justify-content:center;">BEFORE &amp; AFTER</p>
                <h1 class="section-title" style="font-size: clamp(2rem, 5vw, 3.5rem);">Real jobs · Bakersfield &amp; Kern County</h1>
                <p style="color: var(--text-muted); max-width: 640px; margin: 1rem auto 0; font-size: 1.05rem; line-height: 1.6;">
                    Every slider is a real haul. Categories are grouped for easier browsing — <span class="text-accent-red">no file names on the page</span>; just drag to compare.
                </p>
            </div>
        </section>
        <section style="padding-bottom: var(--section-padding);">
            <div class="container gallery-hub-grid">
{chr(10).join(cards)}
            </div>
        </section>
"""
    hub_html = shell(
        "Before & After Gallery | T&M Hauling Bakersfield",
        "Real before-and-after junk removal jobs in Bakersfield and Kern County. Drag sliders to compare.",
        "gallery/index.html",
        hub_main,
        "T&M Hauling — Before & After Gallery",
    )
    (GALLERY_DIR / "index.html").write_text(hub_html, encoding="utf-8")

    for slug, title, desc in JOB_META:
        pairs = jobs.get(slug, [])
        if not pairs:
            continue
        inner = f"""
        <section style="padding: clamp(5rem, 10vw, 7rem) 0 2rem;">
            <div class="container">
                <nav class="breadcrumb-nav reveal" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a>
                    <span aria-hidden="true"> / </span>
                    <a href="index.html">Gallery</a>
                    <span aria-hidden="true"> / </span>
                    <span>{title}</span>
                </nav>
                <h1 class="section-title reveal" style="font-size: clamp(1.75rem, 4vw, 2.75rem); margin-top: 1rem;">{title}</h1>
                <p class="reveal" style="color: var(--text-muted); max-width: 640px; margin-bottom: 2.5rem;">{desc}</p>
                <div class="ba-slider-grid reveal">
{pairs_html(pairs, title)}
                </div>
                <p class="reveal" style="margin-top: 3rem; color: var(--text-muted); font-size: 0.9rem;">
                    Pairs are curated by project series. When you send an updated photo list, we can remap comparisons to match what you actually shot — filenames alone are not enough to guarantee a perfect before/after match.
                </p>
            </div>
        </section>
"""
        page = shell(
            f"{title} — Before & After | T&M Hauling",
            f"See {len(pairs)} real before-and-after junk removal comparisons for {title} in Bakersfield, CA.",
            f"gallery/{slug}.html",
            inner,
        )
        (GALLERY_DIR / f"{slug}.html").write_text(page, encoding="utf-8")

    # Patch index.html — remove embedded gallery, insert teaser
    index_path = ROOT / "index.html"
    text = index_path.read_text(encoding="utf-8")
    start = text.find("        <!-- PROJECT GALLERY:")
    end = text.find("        <!-- LEAD TRAP -->")
    if start != -1 and end != -1:
        teaser = """        <!-- Gallery: full before/after on dedicated pages -->
        <section id="gallery-teaser" class="gallery-teaser-section reveal" style="padding: var(--section-padding) 0; background: rgba(8, 16, 28, 0.75); border-top: 1px solid var(--glass-border);">
            <div class="container text-center">
                <p style="color:var(--primary); font-weight: 700; letter-spacing: 5px; margin-bottom: 1rem;">VISUAL PROOF</p>
                <h2 class="section-title">REAL JOBS · BEFORE &amp; AFTER</h2>
                <p style="color: var(--text-muted); max-width: 640px; margin: 0 auto 2.5rem; font-size: 1.05rem; line-height: 1.65;">
                    We moved the full gallery to its own section of the site — <span class="text-accent-red">faster home page</span>, easier browsing on phones and tablets. Pick a job category and drag each slider.
                </p>
                <a href="gallery/index.html" class="btn btn-red">OPEN PROJECT GALLERY</a>
                <p style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted);">Chris · House 1 · Marcus · The Nest</p>
            </div>
        </section>

"""
        index_path.write_text(text[:start] + teaser + text[end:], encoding="utf-8")
        print("Patched index.html gallery -> teaser")

    # Root-relative fragment (optional tooling) — paths for site root, no filenames shown
    titles_map = {s: t for s, t, _ in JOB_META}
    jo = raw["jobs"]
    order = ["chris", "house1", "marcus", "thenest"]
    lines = []

    def iu_root(fn: str) -> str:
        return f"before-after/{quote(fn, safe='')}"

    for job in order:
        prs = jo.get(job, [])
        if not prs:
            continue
        title = titles_map[job]
        lines.append(f'                <article class="job-showcase reveal" id="job-{job}">')
        lines.append('                    <header class="job-showcase-header">')
        lines.append('                        <p class="job-showcase-eyebrow">PROJECT</p>')
        lines.append(f'                        <h3 class="job-showcase-title">{title}</h3>')
        lines.append(
            f'                        <p class="job-showcase-desc">{len(prs)} comparisons — drag the slider on each photo.</p>'
        )
        lines.append("                    </header>")
        lines.append('                    <div class="ba-slider-grid">')
        for i, p in enumerate(prs, 1):
            lines.append('                        <div class="ba-slider-card">')
            lines.append(
                f'                            <div class="ba-container" role="img" aria-label="{title} comparison {i} of {len(prs)}">'
            )
            lines.append(
                f'                                <div class="ba-after" style="background-image: url(\'{iu_root(p["after"])}\');"></div>'
            )
            lines.append(
                f'                                <div class="ba-before" style="background-image: url(\'{iu_root(p["before"])}\'); width: 50%;"></div>'
            )
            lines.append(
                '                                <button type="button" class="ba-handle" aria-label="Drag to compare before and after">'
            )
            lines.append(
                '                                    <i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i>'
            )
            lines.append("                                </button>")
            lines.append('                                <span class="ba-tag ba-tag-before">Before</span>')
            lines.append('                                <span class="ba-tag ba-tag-after">After</span>')
            lines.append("                            </div>")
            lines.append("                        </div>")
        lines.append("                    </div>")
        lines.append("                </article>")
    (ROOT / "gallery-generated.html").write_text("\n".join(lines), encoding="utf-8")
    print("Wrote gallery-generated.html (no filenames)")


if __name__ == "__main__":
    main()
