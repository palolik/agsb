import { useLang } from "../context/LanguageContext";

// Common questions as an accordion. The lists come from src/lib/seo.js
// (homeFaq / districtFaq / planFaq); scripts/build-seo.mjs emits the same ones
// as FAQPage JSON-LD, so this component renders no structured data itself.
export default function FaqSection({ faq, title, className = "" }) {
  const { t } = useLang();
  if (!faq?.length) return null;
  return (
    <section className={className} aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-xl md:text-2xl font-bold text-base-content mb-4">
        {title || t("সাধারণ জিজ্ঞাসা", "Frequently asked questions")}
      </h2>
      <div className="space-y-2">
        {faq.map(({ q, a }, i) => (
          <details key={q} className="collapse collapse-arrow bg-base-200 border border-base-300" open={i === 0}>
            <summary className="collapse-title font-medium text-base-content">{q}</summary>
            <div className="collapse-content text-sm text-base-content/70 leading-relaxed">
              <p>{a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
