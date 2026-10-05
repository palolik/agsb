// Divisions, districts, blog posts, travel plans, partners, and membership plans
// are served live by agsb-backend (see src/hooks/useFetch.js). Site statistics
// are computed from that data rather than hard-coded, so they always match
// what the site actually shows.
import { asArray } from "../lib/safe";

// { [division_id]: number of districts the API returned for that division }
export function districtCountsByDivision(districts) {
  const counts = {};
  for (const d of asArray(districts)) {
    if (d && d.division_id != null) counts[d.division_id] = (counts[d.division_id] || 0) + 1;
  }
  return counts;
}

// Total number of attractions in the /attractions list.
export function countAttractions(attractions) {
  return asArray(attractions).length;
}

// { [district_slug]: attractions of that district, in API order }
export function attractionsByDistrict(attractions) {
  const groups = {};
  for (const a of asArray(attractions)) {
    if (a && a.district_slug) (groups[a.district_slug] ||= []).push(a);
  }
  return groups;
}
