// Current official English spellings for districts whose older names still
// appear in some data (src/data/allDistricts.js, older API records).
// Slugs are left untouched — they are stored in users' visitedDistricts.
const MODERN_NAMES = {
  Bogra: "Bogura",
  Chittagong: "Chattogram",
  Barisal: "Barishal",
  Shatkhira: "Satkhira",
  Maulvibazar: "Moulvibazar",
  Jessore: "Jashore",
  Comilla: "Cumilla",
};

export function districtName(nameEn) {
  const name = nameEn === null || nameEn === undefined ? "" : String(nameEn);
  return MODERN_NAMES[name] || name;
}
