import os

# Base Template for Service Pages
service_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} Bakersfield | Same-Day Junk Removal | T&M Hauling</title>
    <meta name="description" content="{description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../index.css">
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "{name}",
      "provider": {{ "@type": "LocalBusiness", "name": "T&M Hauling" }},
      "areaServed": {{"@type": "City", "name": "Bakersfield"}},
      "offers": {{ "@type": "Offer", "priceRange": "$$", "description": "Dynamic pricing based on load volume." }}
    }}
    </script>
</head>
<body style="padding-top: 5rem;">
    <header class="scrolled">
        <div class="container nav-content">
            <a href="/" class="logo">T&M <span>HAULING</span></a>
            <div class="header-actions">
                <a href="tel:+16619966950" class="btn btn-primary"><i class="fa-solid fa-phone"></i> Quote</a>
            </div>
        </div>
    </header>
    <main>
        <section class="section-padding">
            <div class="container">
                <nav style="margin-bottom: 2rem; font-size: 0.9rem;">
                    <a href="/" style="color: var(--text-muted); text-decoration: none;">Home</a> / <span style="color: var(--primary);">{name}</span>
                </nav>
                <h1 class="hero-title" style="font-size: 3rem;">{name} in <span style="color:var(--primary)">Bakersfield, CA</span></h1>
                <div class="glass" style="padding: 2rem; margin-bottom: 3rem;">
                    <p style="font-size: 1.25rem; font-weight: 500;">{lead_para}</p>
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4rem;">
                    <div class="aeo-content">
                        <h2>{name} Professional Q&A</h2>
                        <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 2rem;">
                            {qa_blocks}
                        </div>
                    </div>
                    <aside>
                        <div class="glass" style="padding: 2rem; position: sticky; top: 7rem;">
                            <h3 style="margin-bottom: 1rem;">Instant Quote</h3>
                            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">Text a photo of your {name_lower} for a guaranteed price range.</p>
                            <a href="sms:+16619966950" class="btn btn-primary" style="width: 100%;"><i class="fa-solid fa-camera"></i> Text Photos</a>
                            <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); text-align: center;">
                                <i class="fa-solid fa-bolt" style="color: var(--primary);"></i> 10-Min Response Avg.
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    </main>
</body>
</html>"""

# Base Template for Neighborhood Pages
geo_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Junk Removal {neighborhood} Bakersfield | Same-Day Service | T&M Hauling</title>
    <meta name="description" content="Local junk removal in {neighborhood}, Bakersfield. T&M Hauling offers same-day hauling near {landmark}. Reliable, affordable, and 5-star rated.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../index.css">
</head>
<body style="padding-top: 5rem;">
    <header class="scrolled">
        <div class="container nav-content">
            <a href="/" class="logo">T&M <span>HAULING</span></a>
        </div>
    </header>
    <main>
        <section class="section-padding">
            <div class="container">
                <h1 class="hero-title" style="font-size: 3rem;">Junk Removal in <span style="color:var(--primary)">{neighborhood}</span></h1>
                <p class="sub-title">Providing {neighborhood} residents with the fastest hauling service, often within 2 hours of booking.</p>
                <div class="glass" style="padding: 2rem; margin: 3rem 0;">
                    <h3>Recent {neighborhood} Jobs</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem;">
                        <div class="work-card">
                            <i class="fa-solid fa-truck" style="color: var(--primary); font-size: 1.5rem;"></i>
                            <h4 style="margin-top: 1rem;">Full Property Restoration</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">Our 16ft heavy trailer cleared a multi-year debris pile in just one morning. Neighborhood pride restored.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
</body>
</html>"""

services = [
    {
        "name": "Storage Unit Cleanouts",
        "name_lower": "storage unit",
        "title": "Storage Unit Cleanouts",
        "description": "How much for a storage unit cleanout in Bakersfield? T&M Hauling offers rapid unit clearing and item sorting. We handle all local storage facilities.",
        "lead_para": "Are you paying rent on a storage unit full of things you don't need? Our father-and-son team provides end-to-end storage unit cleanouts. With our high-capacity 16ft trailer, we can often clear an entire unit in a single trip.",
        "qa_blocks": """<div class="qa-block"><h3>Do you coordinate with the storage facility?</h3><p>Yes. Providing we have your permission, we meet the facility manager and clear the unit without you being present.</p></div>"""
    },
    {
        "name": "Estate Clean Up",
        "name_lower": "estate",
        "title": "Estate Clean Up",
        "description": "Professional estate clean up services in Bakersfield.",
        "lead_para": "Handling an estate is overwhelming. T&M Hauling provides compassionate, professional estate clean up services. As a local father-son operation, we treat your property with family respect.",
        "qa_blocks": """<div class="qa-block"><h3>Do you help sort items?</h3><p>Yes, we help set aside items that look like family heirlooms or important documents.</p></div>"""
    },
    {
        "name": "Garage Clean Up",
        "name_lower": "garage",
        "title": "Garage Clean Up",
        "description": "Same-day garage clean up in Bakersfield.",
        "lead_para": "Looking for same-day garage clean up in Bakersfield? T&M Hauling provides instant-quote garage junk removal. Our team handles the heavy lifting so you get your space back by dinner.",
        "qa_blocks": """<div class="qa-block"><h3>Do you sweep up after?</h3><p>Yes, we broom-sweep the area after every cleanout.</p></div>"""
    },
    {
        "name": "Apartment Clean Out",
        "name_lower": "apartment",
        "title": "Apartment Clean Out",
        "description": "Apartment junk removal for tenants and landlords in Bakersfield.",
        "lead_para": "Need an apartment cleared fast? T&M Hauling offers specialized apartment clean out services, navigating stairs and tight spaces with professional ease.",
        "qa_blocks": """<div class="qa-block"><h3>Do you handle stairs?</h3><p>Absolutely. Our crews are trained for multi-story buildings and elevators.</p></div>"""
    },
    {
        "name": "Scrap Metal Removal",
        "name_lower": "scrap metal",
        "title": "Scrap Metal Removal",
        "description": "Bakersfield scrap metal hauling and appliance recycling.",
        "lead_para": "Got old metal taking up space? T&M Hauling offers specialized scrap metal removal in Bakersfield. We handle everything from old copper pipes to large appliances.",
        "qa_blocks": """<div class="qa-block"><h3>Do you take appliances?</h3><p>Yes! Refrigerators, ovens, and washers are all eligible for our metal recycling flow.</p></div>"""
    },
    {
        "name": "General Junk Removal",
        "name_lower": "junk",
        "title": "General Junk Removal",
        "description": "The best general junk removal in Bakersfield.",
        "lead_para": "If you have more than two items to move, it's a T&M job. Our general junk removal covers everything from old furniture to backyard clutter.",
        "qa_blocks": """<div class="qa-block"><h3>What is your minimum fee?</h3><p>Our minimum fee starts at $85 for single items in the central Bakersfield area.</p></div>"""
    },
    {
        "name": "Construction Debris Removal",
        "name_lower": "construction debris",
        "title": "Construction Debris Removal",
        "description": "Construction debris hauling for Bakersfield contractors.",
        "lead_para": "Keep your job site clean and safe. T&M Hauling provides professional construction debris removal, using our heavy-duty trailers to handle shingles, drywall, and rubble.",
        "qa_blocks": """<div class="qa-block"><h3>Do you take concrete?</h3><p>Yes, we haul concrete, wood, and drywall. Note that concrete loads may have weight limits.</p></div>"""
    }
]

neighborhoods = [
    {"name": "Seven Oaks", "landmark": "Seven Oaks Country Club"},
    {"name": "Rosedale", "landmark": "Northwest Promenade"},
    {"name": "Stockdale", "landmark": "CSU Bakersfield"},
    {"name": "Downtown", "landmark": "The Fox Theater"},
    {"name": "Oildale", "landmark": "Standard Park"},
    {"name": "East Bakersfield", "landmark": "Bakersfield College"}
]

os.makedirs("services", exist_ok=True)
os.makedirs("neighborhoods", exist_ok=True)

for s in services:
    filename = s['name'].lower().replace(" ", "-") + ".html"
    with open(os.path.join("services", filename), "w") as f:
        f.write(service_template.format(**s))

for n in neighborhoods:
    filename = n['name'].lower().replace(" ", "-") + ".html"
    with open(os.path.join("neighborhoods", filename), "w") as f:
        f.write(geo_template.format(neighborhood=n['name'], landmark=n['landmark']))
