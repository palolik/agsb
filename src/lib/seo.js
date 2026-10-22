// Search titles and descriptions for detail pages. Plain functions with no
// browser or Vite imports: the pages use them for <PageMeta>, and
// scripts/build-seo.mjs uses the same ones to prerender each page's HTML, so
// what crawlers see before and after JavaScript stays identical.

import { districtName } from "./districtNames.js";

export const BRAND ="আমিঘুরিসারাবাংলাদেশ";
// Titles and descriptions lead with what people search for: "ট্যুর প্ল্যান",
// "ভ্রমণ পরিকল্পনা", "tour plan Bangladesh", "travel planning".
export const HOME_TITLE = "বাংলাদেশ ট্যুর প্ল্যান ও ভ্রমণ গাইড — ৬৪ জেলা | আমি ঘুরি সারা বাংলাদেশ";
export const DEFAULT_DESCRIPTION =
  "বাংলাদেশের ৬৪ জেলার ট্যুর প্ল্যান ও ভ্রমণ পরিকল্পনা: খরচ, যাতায়াত, দর্শনীয় স্থান আর গ্রুপ ট্যুর বুকিং। Bangladesh tour plans and travel planning for all 64 districts — costs, transport, places to visit and tour packages.";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

// Rich-text HTML -> one line of text.
export function plainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

const val = (obj, field, lang) => {
  if (!obj) return "";
  const bn = obj[`${field}_bn`];
  const en = obj[`${field}_en`] ?? obj[field];
  return (lang === "bn" ? bn || en : en || bn) || "";
};

const join = (parts, sep) => parts.filter(Boolean).join(sep);
const listOf = (items, n = 4) => (Array.isArray(items) ? items.filter(Boolean).slice(0, n).join(", ") : "");

export function districtSeo(d, lang = "bn", attractions = []) {
  const en = districtName(d.name_en);
  const name = lang === "bn" ? d.name_bn || en : en || d.name_bn;
  const places = listOf(attractions.map((a) => val(a, "name", lang)));
  if (lang === "bn") {
    return {
      title: `${name} ট্যুর প্ল্যান ও ভ্রমণ গাইড`,
      description: join([
        `${name} ট্যুর প্ল্যান ও ভ্রমণ গাইড${d.tagline ? `: ${d.tagline}` : ""}।`,
        places && `দর্শনীয় স্থান: ${places}।`,
        d.best_time && `ভ্রমণের সেরা সময় ${d.best_time}।`,
        d.budget && `আনুমানিক খরচ ${d.budget}।`,
        d.transport && `যাতায়াত: ${d.transport}।`,
      ], " "),
    };
  }
  return {
    title: `${name} Tour Plan & Travel Guide`,
    description: join([
      `${name} tour plan and travel guide${d.tagline ? ` — ${d.tagline}` : ""}.`,
      places && `Top places: ${places}.`,
      d.best_time && `Best time: ${d.best_time}.`,
      d.budget && `Budget: ${d.budget}.`,
      d.transport && `Getting there: ${d.transport}.`,
    ], " "),
  };
}

export function attractionSeo(a, lang = "bn") {
  const name = val(a, "name", lang);
  const district = lang === "bn" ? a.district_name_bn || a.district_name_en : a.district_name_en || a.district_name_bn;
  return {
    title: district ? `${name}, ${district}` : name,
    description: join([a.desc, district && (lang === "bn" ? `${district} জেলার দর্শনীয় স্থান।` : `A place to visit in ${district}, Bangladesh.`)], " — "),
  };
}

export function planSeo(p, lang = "bn") {
  const title = val(p, "title", lang);
  return {
    title: title && (lang === "bn" ? `${title} — ট্যুর প্ল্যান ও খরচ` : `${title} — Tour Plan & Cost`),
    description: join([p.duration, p.cost, plainText(val(p, "description", lang))], " · "),
  };
}

// ------------------------------------------------------------------- FAQs
// Question/answer lists shown on the page (FaqSection.jsx) and emitted as
// FAQPage JSON-LD by scripts/build-seo.mjs, so both always say the same thing.
// Questions are phrased the way people search ("সিলেট কিভাবে যাবো?").

const taka = (n) => `৳${Number(n).toLocaleString("en-IN")}`;

export function homeFaq(lang = "bn") {
  const bn = lang === "bn";
  return [
    bn
      ? { q: "বাংলাদেশে ট্যুর প্ল্যান কিভাবে করবো?", a: "প্রথমে কোন জেলায় যাবেন ঠিক করুন। আমাদের ৬৪ জেলার ভ্রমণ গাইডে প্রতিটি জেলার দর্শনীয় স্থান, যাতায়াত, আনুমানিক খরচ আর ভ্রমণের সেরা সময় দেওয়া আছে। নিজে প্ল্যান না করতে চাইলে ট্যুর প্ল্যান পেজ থেকে তৈরি গ্রুপ ট্যুর বেছে নিন।" }
      : { q: "How do I plan a tour in Bangladesh?", a: "Start by picking a district. Our guide to all 64 districts lists the places to visit, how to get there, the budget and the best time to go. If you'd rather not plan it yourself, pick a ready-made group tour from the tour plans page." },
    bn
      ? { q: "বাংলাদেশে ঘুরতে কত খরচ হয়?", a: "খরচ জেলা, সময় আর যাতায়াতের মাধ্যমের ওপর নির্ভর করে। প্রতিটি জেলার পেজে আনুমানিক বাজেট আর প্রতিটি ট্যুর প্ল্যানে খরচ বা জনপ্রতি মূল্য দেওয়া আছে, তাই যাওয়ার আগেই হিসাব করে নিতে পারবেন।" }
      : { q: "How much does it cost to travel in Bangladesh?", a: "It depends on the district, the season and how you travel. Every district page shows an estimated budget, and every tour plan shows its cost or price per person, so you can work it out before you go." },
    bn
      ? { q: "গ্রুপ ট্যুর বা ট্যুর প্যাকেজ কি অনলাইনে বুক করা যায়?", a: "হ্যাঁ। ট্যুর প্ল্যান পেজে যে ট্রিপগুলোর বুকিং খোলা আছে সেগুলোর টিকিট অনলাইনে বুক করা যায়: অগ্রিম মূল্য মোবাইল ব্যাংকিংয়ে পাঠিয়ে বাকিটা ট্রিপে দিন। অন্য প্ল্যান নিয়ে জানতে যোগাযোগ পেজ থেকে মেসেজ পাঠান।" }
      : { q: "Can I book a group tour or tour package online?", a: "Yes. Trips on the tour plans page that are open for booking can be booked online: send the advance by mobile banking and pay the rest on the trip. For other plans, send us a message from the contact page." },
    bn
      ? { q: "৬৪ জেলা চ্যালেঞ্জ কী?", a: "বাংলাদেশের ৬৪টি জেলা ঘুরে দেখার চ্যালেঞ্জ। অ্যাকাউন্ট খুলে যে জেলায় গেছেন সেখানে চেক-ইন করুন, জেলা ব্যাজ জিতুন আর নিজের মানচিত্রে দেখুন কতগুলো জেলা ঘোরা হলো।" }
      : { q: "What is the 64-district challenge?", a: "A challenge to visit all 64 districts of Bangladesh. Create an account, check in to each district you visit, earn district badges and watch your own map fill up." },
    bn
      ? { q: "ট্যুরের জন্য তাঁবু বা ক্যাম্পিং গিয়ার কোথায় পাবো?", a: "আমাদের শপ থেকে তাঁবু, ব্যাকপ্যাকসহ ট্রাভেল গিয়ার কিনতে বা ভাড়া নিতে পারবেন।" }
      : { q: "Where can I get a tent or camping gear for a trip?", a: "Our shop sells and rents tents, backpacks and other travel gear." },
  ];
}

// `plans` are the tour plans that include this district.
export function districtFaq(d, attractions = [], plans = [], lang = "bn") {
  const bn = lang === "bn";
  const en = districtName(d.name_en);
  const name = bn ? d.name_bn || en : en || d.name_bn;
  const places = listOf(attractions.map((a) => val(a, "name", lang)), 8);
  const food = listOf(d.food, 8);
  const planList = plans.map((p) => join([val(p, "title", lang), p.duration && `(${p.duration})`], " ")).filter(Boolean).join(", ");
  return [
    d.transport && (bn
      ? { q: `${name} কিভাবে যাবো?`, a: d.transport }
      : { q: `How do I get to ${name}?`, a: d.transport }),
    d.budget && (bn
      ? { q: `${name} ভ্রমণে কত খরচ হয়?`, a: `আনুমানিক বাজেট ${d.budget}। থাকা, খাওয়া আর যাতায়াতের মাধ্যমের ওপর খরচ কমবেশি হয়।` }
      : { q: `How much does a trip to ${name} cost?`, a: `The estimated budget is ${d.budget}. It varies with where you stay, what you eat and how you travel.` }),
    d.best_time && (bn
      ? { q: `${name} যাওয়ার সেরা সময় কখন?`, a: `${name} ভ্রমণের সেরা সময় ${d.best_time}।` }
      : { q: `When is the best time to visit ${name}?`, a: `The best time to visit ${name} is ${d.best_time}.` }),
    places && (bn
      ? { q: `${name}-এ কী কী দেখার আছে?`, a: `${name} জেলার দর্শনীয় স্থান: ${places}।` }
      : { q: `What are the places to visit in ${name}?`, a: `Places to visit in ${name}: ${places}.` }),
    food && (bn
      ? { q: `${name}-এর বিখ্যাত খাবার কী?`, a: `${name} গেলে খেয়ে দেখুন: ${food}।` }
      : { q: `What food is ${name} famous for?`, a: `In ${name}, try: ${food}.` }),
    planList && (bn
      ? { q: `${name} ট্যুর প্ল্যান বা গ্রুপ ট্যুর আছে কি?`, a: `হ্যাঁ, ${name} ঘোরার জন্য আমাদের ট্যুর প্ল্যান: ${planList}।` }
      : { q: `Is there a tour plan or group tour for ${name}?`, a: `Yes, our tour plans that cover ${name}: ${planList}.` }),
  ].filter(Boolean);
}

export function planFaq(p, lang = "bn", { bookable = false } = {}) {
  const bn = lang === "bn";
  const title = val(p, "title", lang);
  const districts = listOf(p.districts, 10);
  const cost = p.price > 0
    ? (bn ? `জনপ্রতি ${taka(p.price)}।` : `${taka(p.price)} per person.`)
    : p.cost && (bn ? `আনুমানিক খরচ ${p.cost}।` : `Estimated cost: ${p.cost}.`);
  return [
    cost && (bn ? { q: `${title} ট্যুরে কত খরচ?`, a: cost } : { q: `How much does the ${title} tour cost?`, a: cost }),
    p.duration && (bn ? { q: `${title} কত দিনের ট্যুর?`, a: `${p.duration}।` } : { q: `How long is the ${title} tour?`, a: `${p.duration}.` }),
    districts && (bn ? { q: `${title} ট্যুরে কোন কোন জেলা ঘোরা হবে?`, a: `${districts}।` } : { q: `Which districts does the ${title} tour cover?`, a: `${districts}.` }),
    bn
      ? { q: `${title} ট্যুর কিভাবে বুক করবো?`, a: bookable && p.price > 0 ? "এই পেজের “টিকিট বুক করুন” বাটনে চাপ দিয়ে অনলাইনে বুক করুন। অগ্রিম মূল্য মোবাইল ব্যাংকিংয়ে পাঠিয়ে বাকিটা ট্রিপে দিন।" : "যোগাযোগ পেজ থেকে আমাদের মেসেজ পাঠান, আমরা বিস্তারিত জানাবো।" }
      : { q: `How do I book the ${title} tour?`, a: bookable && p.price > 0 ? "Use the “Book tickets” button on this page. Send the advance by mobile banking and pay the rest on the trip." : "Send us a message from the contact page and we'll get back to you with the details." },
  ].filter(Boolean);
}

export function faqJsonLd(faq) {
  return faq.length
    ? { "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
    : null;
}

export function postSeo(post, lang = "bn") {
  return { title: val(post, "title", lang), description: plainText(post.excerpt) };
}

export function productSeo(p, lang = "bn") {
  return { title: val(p, "name", lang), description: p.summary || "" };
}
