export const SITE = {
  name: 'T&M Hauling',
  url: 'https://tandmbak.com',
  phone: '(661) 996-6950',
  phoneTel: '+16619966950',
  phone2: '(661) 996-6951',
  phone2Tel: '+16619966951',
  email: 'tandmhaulingbak@gmail.com',
  city: 'Bakersfield',
  region: 'CA',
  postalCode: '93301',
  geo: { latitude: 35.3733, longitude: -119.0187 },
  hours: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
  googleShare: 'https://share.google/05y5uX2DmmRPEeol2',
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/tm_hauling/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@TMHaul' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@tandm_h' },
    { label: 'X', href: 'https://x.com/TandMbak' },
    { label: 'Rumble', href: 'https://rumble.com/user/TandMHauling' },
    { label: 'GoFundMe', href: 'https://www.gofundme.com/f/help-us-keep-and-grow-our-business' },
  ],
  // Fill these in with real Google numbers to emit aggregateRating schema.
  rating: null as null | { value: number; count: number },
};

export const NAV = [
  { href: '/services.html', label: 'Services' },
  { href: '/service-areas.html', label: 'Areas' },
  { href: '/gallery/index.html', label: 'Gallery' },
  { href: '/reviews.html', label: 'Reviews' },
  { href: '/about.html', label: 'About' },
  { href: '/faq.html', label: 'FAQ' },
];
