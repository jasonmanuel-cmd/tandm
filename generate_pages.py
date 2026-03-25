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
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../index.css">
</head>
<body style="padding-top: 8rem; background: #050505; color: white;">
    <header id="main-header">
        <div class="container nav-content">
            <a href="/" class="logo">
                <img src="https://tandmbak.com/wp-content/uploads/2024/10/TM-L-2-scaled.png" alt="T&M Hauling" style="height: 40px;">
            </a>
            <nav class="desktop-nav">
                <a href="/#services">SERVICES</a>
                <a href="/#schedule">SCHEDULE</a>
            </nav>
            <div class="header-actions">
                <a href="tel:+16619966950" class="btn btn-red" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">CALL NOW</a>
            </div>
        </div>
    </header>
    <main>
        <section style="padding: var(--section-padding) 0;">
            <div class="container">
                <nav style="margin-bottom: 3rem; font-size: 0.8rem; letter-spacing: 1px; opacity: 0.5;">
                    <a href="/" style="color: white; text-decoration: none;">HOME</a> / <span style="color: var(--primary);">{name}</span>
                </nav>
                <div class="reveal active">
                    <p style="color:var(--primary); font-weight: 700; letter-spacing: 5px; margin-bottom: 1rem;">SPECIALIZED SERVICE</p>
                    <h1 class="hero-title" style="font-size: clamp(2.5rem, 8vw, 5rem);">{name} in <span style="color:var(--primary)">Bakersfield, CA</span></h1>
                </div>
                <div class="glass" style="margin: 4rem 0; padding: 3rem;">
                    <p style="font-size: clamp(1.1rem, 2vw, 1.4rem); font-weight: 400; line-height: 1.6; color: #dfdfdf;">{lead_para}</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 5rem; align-items: start;">
                    <div class="aeo-content">
                        <h2 class="section-title" style="font-size: 2.2rem; margin-bottom: 3rem;">THE T&M PROTOCOL</h2>
                        <div style="display: flex; flex-direction: column; gap: 3rem;">
                            {qa_blocks}
                        </div>
                    </div>
                    <aside>
                        <div class="glass" style="position: sticky; top: 10rem; padding: 3rem; text-align: center; border-bottom: 5px solid var(--primary);">
                            <p style="color:var(--primary); font-weight: 700; letter-spacing: 2px; font-size: 0.75rem; margin-bottom: 1rem;">FAST RESPONSE</p>
                            <h3 style="margin-bottom: 1.5rem; font-family:var(--font-header); font-size: 1.8rem;">INSTANT ESTIMATE</h3>
                            <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 2.5rem;">Text a photo of your {name_lower} project for a guaranteed quote range.</p>
                            <a href="sms:+16619966950" class="btn btn-red" style="width: 100%;"><i class="fa-solid fa-camera"></i> TEXT FOR QUOTE</a>
                            <div style="margin-top: 2rem; font-size: 0.8rem; color: #555; font-weight: 600;">
                                <i class="fa-solid fa-bolt" style="color: var(--primary);"></i> TYPICAL RESPONSE: 10 MINS
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
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../index.css">
</head>
<body style="padding-top: 8rem; background: #050505; color: white;">
    <header id="main-header">
        <div class="container nav-content">
            <a href="/" class="logo">
                <img src="https://tandmbak.com/wp-content/uploads/2024/10/TM-L-2-scaled.png" alt="T&M Hauling" style="height: 40px;">
            </a>
            <div class="header-actions">
                <a href="tel:+16619966950" class="btn btn-red" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">CALL TEAM</a>
            </div>
        </div>
    </header>
    <main>
        <section style="padding: var(--section-padding) 0;">
            <div class="container">
                <p style="color:var(--primary); font-weight: 700; letter-spacing: 5px; margin-bottom: 1rem;">KERN COUNTY OPS</p>
                <h1 class="hero-title" style="font-size: clamp(2.5rem, 8vw, 5rem);">Junk Removal in <span style="color:var(--primary)">{neighborhood}</span></h1>
                <p style="font-size: 1.25rem; color: var(--text-muted); margin-bottom: 5rem; max-width: 700px;">Providing {neighborhood} residents near {landmark} with the fastest property clearing and junk recovery service in Kern County.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem;">
                    <div class="glass" style="padding: 3rem; text-align: center;">
                        <i class="fa-solid fa-truck-fast" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 2rem;"></i>
                        <h4 style="font-size: 1.5rem; margin-bottom: 1rem; color: white;">SQUAD ON STANDBY</h4>
                        <p style="color: var(--text-muted);">We are frequently operational near {landmark} and can arrive at your {neighborhood} location in under 2 hours.</p>
                    </div>
                    <div class="glass" style="padding: 3rem; text-align: center;">
                        <i class="fa-solid fa-user-group" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 2rem;"></i>
                        <h4 style="font-size: 1.5rem; margin-bottom: 1rem; color: white;">ELITE COHESION</h4>
                        <p style="color: var(--text-muted);">T&M is a highly-coordinated father-son team serving {neighborhood} with professional precision.</p>
                    </div>
                </div>
                
                <div class="text-center" style="margin-top: 6rem;">
                    <a href="tel:+16619966950" class="btn btn-red btn-large">INITIATE {neighborhood} PICKUP</a>
                </div>
            </div>
        </section>
    </main>
</body>
</html>"""

services = [
    {
        "name": "Hot Tub Removal",
        "name_lower": "hot tub",
        "title": "Hot Tub Removal",
        "description": "Professional hot tub removal in Bakersfield. We dismantle, haul, and dispose of old spas.",
        "lead_para": "Got an old hot tub taking up space? T&M Hauling specializes in spa dismantling and removal. We handle the wiring, the heavy shell, and the structural haul-away.",
        "qa_blocks": """<div class="qa-block"><h3 style="color:var(--primary)">Do you disconnect electricity?</h3><p>We require the power to be disconnected by a licensed electrician first, then we handle the full demolition and haul.</p></div>"""
    },
    {
        "name": "Mattress Disposal",
        "name_lower": "mattress",
        "title": "Mattress Disposal",
        "description": "Same-day mattress disposal and pickup in Bakersfield.",
        "lead_para": "Don't let old mattresses sit in your garage. T&M Hauling offers rapid mattress and box spring pickup with responsible disposal.",
        "qa_blocks": """<div class="qa-block"><h3 style="color:var(--primary)">How much for one mattress?</h3><p>Typical pickups start at $85, or less if bundled with other items.</p></div>"""
    },
    {
        "name": "Hoarder House Cleanouts",
        "name_lower": "hoarder house",
        "title": "Hoarder house Cleanouts",
        "description": "Compassionate and discreet hoarder house cleanout services in Kern County.",
        "lead_para": "Massive property clearing requires a patient and professional team. T&M Hauling handles large-scale hoarder house cleanouts with discretion and speed.",
        "qa_blocks": """<div class="qa-block"><h3 style="color:var(--primary)">How long does it take?</h3><p>Most full-property cleanouts are finished in 1-2 days using our 16ft high-capacity trailers.</p></div>"""
    },
    {
        "name": "Yard Waste Removal",
        "name_lower": "yard waste",
        "title": "Yard Waste Removal",
        "description": "Debris removal for lawns and backyards in Bakersfield.",
        "lead_para": "From brush piles to fallen trees, T&M Hauling clears your backyard landscape debris fast.",
        "qa_blocks": """<div class="qa-block"><h3 style="color:var(--primary)">Do you take dirt?</h3><p>We handle green waste and brush. Soil and gravel may require specialized heavy loads—call for a quote.</p></div>"""
    },
    {
        "name": "Appliance Hauling",
        "name_lower": "appliance",
        "title": "Appliance Hauling",
        "description": "Fast refrigerator, stove, and washer removal in Bakersfield.",
        "lead_para": "Old appliances are heavy and hard to move. T&M Hauling clears out fridges, stoves, washers, and dryers instantly.",
        "qa_blocks": """<div class="qa-block"><h3 style="color:var(--primary)">Do you recycle old appliances?</h3><p>Yes! We follow all California e-waste and metal recycling guidelines.</p></div>"""
    }
]

neighborhoods = [
    {"name": "Seven Oaks", "landmark": "Seven Oaks Country Club"},
    {"name": "Rosedale", "landmark": "Northwest Promenade"},
    {"name": "Stockdale", "landmark": "CSU Bakersfield"},
    {"name": "Downtown", "landmark": "The Fox Theater"},
    {"name": "Oildale", "landmark": "Standard Park"},
    {"name": "East Bakersfield", "landmark": "Bakersfield College"},
    {"name": "Southwest Bakersfield", "landmark": "The Marketplace"},
    {"name": "Northwest Bakersfield", "landmark": "Riverlakes Golf Course"},
    {"name": "Northeast Bakersfield", "landmark": "Bakersfield College Area"},
    {"name": "Silver Creek", "landmark": "Silver Creek Park"},
    {"name": "Westchester", "landmark": "Bakersfield High"},
    {"name": "City Hills", "landmark": "City Hills Drive"},
    {"name": "Quailwood", "landmark": "Quailwood Elementary"},
    {"name": "Tevis Ranch", "landmark": "Tevis Ranch Park"},
    {"name": "Laurelglen", "landmark": "Laurelglen Elementary"},
    {"name": "Haggin Oaks", "landmark": "Haggin Oaks Market"},
    {"name": "Riverlakes", "landmark": "Lake Ming"},
    {"name": "Brimhall", "landmark": "Brimhall Road"},
    {"name": "Oleander", "landmark": "Oleander Park"}
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
