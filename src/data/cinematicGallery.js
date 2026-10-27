// Exact paper corners in the 1672 × 941 gallery plate; artwork remains replaceable.
// The current exhibition uses existing portfolio work until the newest work arrives.
export const galleryPosterSlots = [
  { id: "spring-motion", points: [[274, 315], [390, 320], [388, 500], [272, 499]] },
  { id: "tech-motion", points: [[496, 306], [574, 309], [574, 408], [495, 407]] },
  { id: "moxo", points: [[446, 425], [622, 428], [622, 528], [446, 528]] },
  { id: "x3-motion", points: [[675, 294], [779, 299], [779, 508], [675, 508]] },
  { id: "botanical", points: [[839, 254], [987, 263], [987, 532], [839, 533]], featured: true },
  { id: "momo", points: [[1060, 307], [1131, 311], [1131, 423], [1060, 421]] },
  { id: "orbital", points: [[1037, 437], [1207, 441], [1206, 531], [1037, 531]] },
  { id: "take-your-time", points: [[1279, 352], [1366, 357], [1366, 517], [1279, 517]] },
];

export const galleryFeaturedId = galleryPosterSlots.find((slot) => slot.featured).id;
