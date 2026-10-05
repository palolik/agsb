// All 64 districts of Bangladesh, for the profile map's check-in tracker.
// Only 16 of these have full guides in `districts` (src/data/index.js) — this list
// exists purely so every district can be marked visited, not just the ones with content.
// `pin` is the district's marker position in the map's viewBox
// (districtMapPositions.js); its name is drawn centred on it
// (src/components/BangladeshMap.jsx), using `map_label` when set.
export const ALL_DISTRICTS = [
  // Dhaka division
  { slug: "dhaka", name_en: "Dhaka", name_bn: "ঢাকা", division_id: 1, pin: [751.27, 1000.93] },
  { slug: "faridpur", name_en: "Faridpur", name_bn: "ফরিদপুর", division_id: 1, pin: [607.20, 1104.06] },
  { slug: "gazipur", name_en: "Gazipur", name_bn: "গাজীপুর", division_id: 1, pin: [802.47, 880.52] },
  { slug: "gopalganj", name_en: "Gopalganj", name_bn: "গোপালগঞ্জ", division_id: 1, pin: [610.00, 1252.97] },
  { slug: "kishoreganj", name_en: "Kishoreganj", name_bn: "কিশোরগঞ্জ", division_id: 1, pin: [973.39, 779.44] },
  { slug: "madaripur", name_en: "Madaripur", name_bn: "মাদারীপুর", division_id: 1, pin: [688.97, 1211.38] },
  { slug: "manikganj", name_en: "Manikganj", name_bn: "মানিকগঞ্জ", division_id: 1, pin: [639.50, 975.84] },
  { slug: "munshiganj", name_en: "Munshiganj", name_bn: "মুন্সীগঞ্জ", division_id: 1, pin: [774.08, 1093.91] },
  { slug: "narayanganj", name_en: "Narayanganj", name_bn: "নারায়ণগঞ্জ", division_id: 1, pin: [870.57, 997.62] },
  { slug: "narsingdi", name_en: "Narsingdi", name_bn: "নরসিংদী", division_id: 1, pin: [914.54, 917.66] },
  { slug: "rajbari", name_en: "Rajbari", name_bn: "রাজবাড়ী", division_id: 1, pin: [500.18, 1017.66] },
  { slug: "shariatpur", name_en: "Shariatpur", name_bn: "শরীয়তপুর", division_id: 1, pin: [778.20, 1191.41] },
  { slug: "tangail", name_en: "Tangail", name_bn: "টাঙ্গাইল", division_id: 1, pin: [651.61, 783.38] },

  // Chattogram division (the "chittagong"/"comilla" slugs are kept: users' saved check-ins use them)
  { slug: "bandarban", name_en: "Bandarban", name_bn: "বান্দরবান", division_id: 2, pin: [1444.74, 1670.87] },
  { slug: "brahmanbaria", name_en: "Brahmanbaria", name_bn: "ব্রাহ্মণবাড়িয়া", division_id: 2, pin: [984.79, 977.03] },
  { slug: "chandpur", name_en: "Chandpur", name_bn: "চাঁদপুর", division_id: 2, pin: [912.51, 1177.66] },
  { slug: "chittagong", name_en: "Chattogram", name_bn: "চট্টগ্রাম", division_id: 2, pin: [1271.14, 1506.27] },
  { slug: "comilla", name_en: "Cumilla", name_bn: "কুমিল্লা", division_id: 2, pin: [1009.67, 1139.63] },
  { slug: "coxs-bazar", name_en: "Cox's Bazar", name_bn: "কক্সবাজার", division_id: 2, pin: [1343.98, 1705.38] },
  { slug: "feni", name_en: "Feni", name_bn: "ফেনী", division_id: 2, pin: [1110.26, 1276.58] },
  { slug: "khagrachari", name_en: "Khagrachari", name_bn: "খাগড়াছড়ি", division_id: 2, pin: [1304.72, 1209.76] },
  { slug: "lakshmipur", name_en: "Lakshmipur", name_bn: "লক্ষ্মীপুর", division_id: 2, pin: [922.79, 1288.01] },
  { slug: "noakhali", name_en: "Noakhali", name_bn: "নোয়াখালী", division_id: 2, pin: [1015.65, 1314.52] },
  { slug: "rangamati", name_en: "Rangamati", name_bn: "রাঙামাটি", division_id: 2, pin: [1393.98, 1377.66] },

  // Khulna division
  { slug: "bagerhat", name_en: "Bagerhat", name_bn: "বাগেরহাট", division_id: 3, pin: [562.75, 1423.27] },
  { slug: "chuadanga", name_en: "Chuadanga", name_bn: "চুয়াডাঙ্গা", division_id: 3, pin: [256.55, 1061.66] },
  { slug: "jashore", name_en: "Jashore", name_bn: "যশোর", division_id: 3, pin: [380.64, 1225.28] },
  { slug: "jhenaidah", name_en: "Jhenaidah", name_bn: "ঝিনাইদহ", division_id: 3, pin: [370.05, 1094.21] },
  { slug: "khulna", name_en: "Khulna", name_bn: "খুলনা", division_id: 3, pin: [457.79, 1461.90] },
  { slug: "kushtia", name_en: "Kushtia", name_bn: "কুষ্টিয়া", division_id: 3, pin: [336.20, 954.56] },
  { slug: "magura", name_en: "Magura", name_bn: "মাগুরা", division_id: 3, pin: [447.59, 1123.26] },
  { slug: "meherpur", name_en: "Meherpur", name_bn: "মেহেরপুর", division_id: 3, pin: [216.05, 1003.27] },
  { slug: "narail", name_en: "Narail", name_bn: "নড়াইল", division_id: 3, pin: [512.99, 1226.24] },
  { slug: "satkhira", name_en: "Satkhira", name_bn: "সাতক্ষীরা", division_id: 3, pin: [355.37, 1369.38] },

  // Rajshahi division
  { slug: "bogura", name_en: "Bogura", name_bn: "বগুড়া", division_id: 4, pin: [452.99, 617.66] },
  { slug: "chapainawabganj", name_en: "Chapainawabganj", name_bn: "চাঁপাইনবাবগঞ্জ", division_id: 4, pin: [63.11, 663.38], map_label: "Nawabganj" },
  { slug: "joypurhat", name_en: "Joypurhat", name_bn: "জয়পুরহাট", division_id: 4, pin: [355.41, 530.81] },
  { slug: "naogaon", name_en: "Naogaon", name_bn: "নওগাঁ", division_id: 4, pin: [218.95, 602.30] },
  { slug: "natore", name_en: "Natore", name_bn: "নাটোর", division_id: 4, pin: [346.74, 779.04] },
  { slug: "pabna", name_en: "Pabna", name_bn: "পাবনা", division_id: 4, pin: [445.25, 903.38] },
  { slug: "rajshahi", name_en: "Rajshahi", name_bn: "রাজশাহী", division_id: 4, pin: [189.65, 741.66] },
  { slug: "sirajganj", name_en: "Sirajganj", name_bn: "সিরাজগঞ্জ", division_id: 4, pin: [501.89, 779.44] },

  // Rangpur division
  { slug: "dinajpur", name_en: "Dinajpur", name_bn: "দিনাজপুর", division_id: 5, pin: [224.50, 329.09] },
  { slug: "gaibandha", name_en: "Gaibandha", name_bn: "গাইবান্ধা", division_id: 5, pin: [481.98, 463.38] },
  { slug: "kurigram", name_en: "Kurigram", name_bn: "কুড়িগ্রাম", division_id: 5, pin: [535.93, 303.38] },
  { slug: "lalmonirhat", name_en: "Lalmonirhat", name_bn: "লালমনিরহাট", division_id: 5, pin: [440.63, 215.09] },
  { slug: "nilphamari", name_en: "Nilphamari", name_bn: "নীলফামারী", division_id: 5, pin: [302.55, 220.52] },
  { slug: "panchagarh", name_en: "Panchagarh", name_bn: "পঞ্চগড়", division_id: 5, pin: [170.30, 100.80] },
  { slug: "rangpur", name_en: "Rangpur", name_bn: "রংপুর", division_id: 5, pin: [385.24, 328.01] },
  { slug: "thakurgaon", name_en: "Thakurgaon", name_bn: "ঠাকুরগাঁও", division_id: 5, pin: [89.74, 217.66] },

  // Barishal division
  { slug: "barguna", name_en: "Barguna", name_bn: "বরগুনা", division_id: 6, pin: [682.47, 1580.52] },
  { slug: "barishal", name_en: "Barishal", name_bn: "বরিশাল", division_id: 6, pin: [795.93, 1329.09] },
  { slug: "bhola", name_en: "Bhola", name_bn: "ভোলা", division_id: 6, pin: [895.27, 1469.25] },
  { slug: "jhalokati", name_en: "Jhalokati", name_bn: "ঝালকাঠি", division_id: 6, pin: [733.31, 1402.30] },
  { slug: "patuakhali", name_en: "Patuakhali", name_bn: "পটুয়াখালী", division_id: 6, pin: [798.31, 1497.66] },
  { slug: "pirojpur", name_en: "Pirojpur", name_bn: "পিরোজপুর", division_id: 6, pin: [664.43, 1368.97] },

  // Sylhet division
  { slug: "habiganj", name_en: "Habiganj", name_bn: "হবিগঞ্জ", division_id: 7, pin: [1126.79, 790.52] },
  { slug: "moulvibazar", name_en: "Moulvibazar", name_bn: "মৌলভীবাজার", division_id: 7, pin: [1276.25, 745.16] },
  { slug: "sunamganj", name_en: "Sunamganj", name_bn: "সুনামগঞ্জ", division_id: 7, pin: [1125.41, 597.66] },
  { slug: "sylhet", name_en: "Sylhet", name_bn: "সিলেট", division_id: 7, pin: [1309.29, 604.21] },

  // Mymensingh division
  { slug: "jamalpur", name_en: "Jamalpur", name_bn: "জামালপুর", division_id: 8, pin: [601.08, 614.81] },
  { slug: "mymensingh", name_en: "Mymensingh", name_bn: "ময়মনসিংহ", division_id: 8, pin: [797.23, 694.70] },
  { slug: "netrokona", name_en: "Netrokona", name_bn: "নেত্রকোণা", division_id: 8, pin: [923.12, 609.09] },
  { slug: "sherpur", name_en: "Sherpur", name_bn: "শেরপুর", division_id: 8, pin: [676.09, 528.01] },
];
