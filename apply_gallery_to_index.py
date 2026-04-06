"""Apply gallery, hero, services, meta, and slider script to index.html."""
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent

index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
gallery = (ROOT / "gallery-generated.html").read_text(encoding="utf-8")

# --- Meta: preload + og image (first hero) ---
hero1 = f"before-after/{quote('house1after (1).jpg', safe='')}"
index = re.sub(
    r'<link rel="preload" as="image" href="[^"]*">',
    f'<link rel="preload" as="image" href="{hero1}">',
    index,
    count=1,
)
index = re.sub(
    r'<meta property="og:image" content="[^"]*">',
    '<meta property="og:image" content="https://tandmbak.com/before-after/house1after%20%281%29.jpg">',
    index,
    count=1,
)

# --- Hero slides ---
hero_block = f"""            <div class="hero-slider">
                <div class="hero-slide active" style="background-image: url('before-after/{quote('house1after (1).jpg', safe='')}');"></div>
                <div class="hero-slide" style="background-image: url('before-after/{quote('marcusafter (1).jpg', safe='')}');"></div>
                <div class="hero-slide" style="background-image: url('before-after/{quote('thenestafter (1).JPG', safe='')}');"></div>
            </div>"""
index = re.sub(
    r"<div class=\"hero-slider\">.*?</div>\s*</div>\s*<div class=\"hero-overlay\">",
    hero_block + "\n            \n            <div class=\"hero-overlay\">",
    index,
    count=1,
    flags=re.DOTALL,
)

# --- Projects spotlight section ---
projects_block = f"""        <section class="projects-section" id="projects" style="padding: var(--section-padding) 0; background:#000;">
            <div class="container">
                <div class="text-center reveal" style="margin-bottom: 5rem;">
                    <p style="color:var(--primary); font-weight: 700; letter-spacing: 5px; margin-bottom: 1rem;">SPOTLIGHT</p>
                    <h2 class="section-title">THE TRANSFORMATION</h2>
                    <p style="color:var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto;">Drag the slider to compare before and after — below, every job is organized by project with the original photo file names.</p>
                </div>
                
                <div class="reveal" style="max-width: 1000px; margin: 0 auto;">
                    <div class="ba-slider-card">
                        <p class="ba-filename-label" title="chrisbefore (1).jpg → chrisafter (1).jpg">chrisbefore (1).jpg ↔ chrisafter (1).jpg</p>
                        <div class="ba-container featured-ba" role="img" aria-label="Before and after comparison">
                            <div class="ba-after" style="background-image: url('before-after/{quote('chrisafter (1).jpg', safe='')}');"></div>
                            <div class="ba-before" style="background-image: url('before-after/{quote('chrisbefore (1).jpg', safe='')}'); width: 50%;"></div>
                            <button type="button" class="ba-handle" aria-label="Drag to compare before and after">
                                <i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i>
                            </button>
                            <span class="ba-tag ba-tag-before">Before</span>
                            <span class="ba-tag ba-tag-after">After</span>
                        </div>
                    </div>
                </div>
                <div class="text-center reveal" style="margin-top: 3rem;">
                    <a href="#gallery" class="btn btn-white">SEE ALL BEFORE &amp; AFTER</a>
                </div>
            </div>
        </section>"""

index = re.sub(
    r"<!-- \[GOD MODE\] Before/After Transformation -->.*?</section>\s*<!-- REVIEWS",
    projects_block + "\n\n        <!-- REVIEWS",
    index,
    count=1,
    flags=re.DOTALL,
)

# --- Gallery section ---
start = index.find("        <!-- [GOD MODE] PROOF OF PERFORMANCE GALLERY -->")
end = index.find("        <!-- LEAD TRAP -->")
if start == -1 or end == -1:
    raise SystemExit("gallery markers not found")

new_gallery = f'''        <!-- PROJECT GALLERY: REAL BEFORE & AFTER BY JOB -->
        <section class="gallery-section reveal" id="gallery">
            <div class="container">
                <div class="text-center reveal" style="margin-bottom: 5rem;">
                    <p style="color:var(--primary); font-weight: 700; letter-spacing: 5px; margin-bottom: 1rem;">VISUAL PROOF</p>
                    <h2 class="section-title">REAL JOBS · BEFORE &amp; AFTER</h2>
                    <p style="color: var(--text-muted); max-width: 640px; margin: 0 auto;">Each area is a real project. Labels use your original photo file names. Drag any slider to compare.</p>
                </div>

                <div class="gallery-jobs-wrap">
{gallery}
                </div>
            </div>
        </section>

'''

index = index[:start] + new_gallery + index[end:]

# --- Service cards ---
index = index.replace(
    '<img src="https://tandmbak.com/wp-content/uploads/2024/10/tm-hauling-bakersfield-8-1024x683.webp" alt="Storage Cleanout">',
    f'<img src="before-after/{quote("house1after (1).jpg", safe="")}" alt="Storage facility clearing">',
)
index = index.replace(
    '<img src="https://tandmbak.com/wp-content/uploads/2024/10/tm-hauling-bakersfield-3-1024x683.webp" alt="Estate Cleanout">',
    f'<img src="before-after/{quote("chrisafter (1).jpg", safe="")}" alt="Estate cleanout">',
)
index = index.replace(
    '<img src="https://tandmbak.com/wp-content/uploads/2024/10/tm-hauling-bakersfield-9-1024x683.webp" alt="Garage Cleanout">',
    f'<img src="before-after/{quote("marcusafter (1).jpg", safe="")}" alt="Garage and backyard cleanup">',
)

# --- Slider script ---
old_js = r"""        // Before/After Slider — fixed touch handling with preventDefault to stop page scroll
        \(function \(\) \{
            const baHandle = document\.getElementById\('ba-handle'\);
            const baBefore = document\.getElementById\('ba-before'\);
            if \(!baHandle \|\| !baBefore\) return;

            let isDragging = false;

            const moveSlider = \(x\) => \{
                const rect = baBefore\.parentElement\.getBoundingClientRect\(\);
                let p = \(\(x - rect\.left\) / rect\.width\) \* 100;
                p = Math\.max\(0, Math\.min\(100, p\)\);
                baBefore\.style\.width = `\$\{p\}%`;
                baHandle\.style\.left = `\$\{p\}%`;
            \};

            baHandle\.addEventListener\('mousedown', \(\) => \{ isDragging = true; \}\);
            window\.addEventListener\('mouseup', \(\) => \{ isDragging = false; \}\);
            window\.addEventListener\('mousemove', \(e\) => \{ if \(isDragging\) moveSlider\(e\.pageX\); \}\);

            baHandle\.addEventListener\('touchstart', \(e\) => \{ isDragging = true; \}, \{ passive: true \}\);
            window\.addEventListener\('touchend', \(\) => \{ isDragging = false; \}, \{ passive: true \}\);
            // passive: false required to allow preventDefault \(stops page scroll while dragging\)
            window\.addEventListener\('touchmove', \(e\) => \{
                if \(isDragging\) \{
                    e\.preventDefault\(\);
                    moveSlider\(e\.touches\[0\]\.pageX\);
                \}
            \}, \{ passive: false \}\);
        \}\)\(\);"""

new_js = """        // Before/After sliders — all instances (clientX for correct position when scrolled)
        (function () {
            function initBaSliders() {
                document.querySelectorAll('.ba-container').forEach((container) => {
                    const beforeLayer = container.querySelector('.ba-before');
                    const handle = container.querySelector('.ba-handle');
                    if (!beforeLayer || !handle) return;

                    const moveSlider = (clientX) => {
                        const rect = container.getBoundingClientRect();
                        if (rect.width <= 0) return;
                        let p = ((clientX - rect.left) / rect.width) * 100;
                        p = Math.max(0, Math.min(100, p));
                        beforeLayer.style.width = p + '%';
                        handle.style.left = p + '%';
                    };

                    let dragging = false;

                    const onDown = (e) => {
                        dragging = true;
                        if (e.type === 'mousedown') e.preventDefault();
                    };
                    const onUp = () => { dragging = false; };

                    handle.addEventListener('mousedown', onDown);
                    window.addEventListener('mouseup', onUp);
                    window.addEventListener('mousemove', (e) => {
                        if (dragging) moveSlider(e.clientX);
                    });

                    handle.addEventListener('touchstart', onDown, { passive: true });
                    window.addEventListener('touchend', onUp, { passive: true });
                    window.addEventListener('touchcancel', onUp, { passive: true });
                    window.addEventListener('touchmove', (e) => {
                        if (dragging && e.touches[0]) {
                            e.preventDefault();
                            moveSlider(e.touches[0].clientX);
                        }
                    }, { passive: false });

                    container.addEventListener('click', (e) => {
                        if (e.target === handle || handle.contains(e.target)) return;
                        moveSlider(e.clientX);
                    });
                });
            }
            initBaSliders();
        })();"""

index = re.sub(old_js, new_js, index, count=1)

index_path.write_text(index, encoding="utf-8")
print("OK:", index_path)
