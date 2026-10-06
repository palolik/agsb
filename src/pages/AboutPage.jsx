import { Link } from "react-router-dom";
import { HiMap, HiTranslate } from "react-icons/hi";
import { FaFlag, FaMedal } from "react-icons/fa";
import PageMeta from "../components/PageMeta";
import { useLang } from "../context/LanguageContext";

export default function AboutPage() {
  const { t } = useLang();
  const meta = <PageMeta title={t("আমাদের সম্পর্কে", "About")} description={t("বাংলাদেশের ৬৪টি জেলার জন্য বাংলা-প্রথম একটি পূর্ণাঙ্গ ভ্রমণসঙ্গী কেন আমরা তৈরি করছি।", "Why we are building the definitive Bangla-first travel companion for all 64 districts of Bangladesh.")} />;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-6">{t("আমাদের সম্পর্কে", "About Us")}</h1>

      <div className="card bg-base-200 p-6 md:p-8 border border-base-300 mb-8">
        <FaFlag className="w-9 h-9 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-3">{t("৬৪ জেলা, এক দেশ, অসংখ্য গল্প।", "64 districts, one country, countless stories.")}</h2>
        <p className="text-base-content/70 leading-relaxed mb-4">
          {t(
            "আমিঘুরিসারাবাংলাদেশ (AmiGhuriSaraBangladesh)-এর জন্ম একটা সাধারণ হতাশা থেকে: বাংলাদেশে ঘোরার মতো অসাধারণ সব জায়গা আছে, কিন্তু সেগুলোর তথ্য ছড়িয়ে আছে এলোমেলো ফেসবুক পোস্ট, পুরোনো ব্লগ আর মুখে মুখে শোনা টিপসে, যা পরের মৌসুমেই অচল হয়ে যায়।",
            "AmiGhuriSaraBangladesh (আমিঘুরিসারাবাংলাদেশ) was born from a simple frustration: Bangladesh has incredible places to visit, but the information is scattered across random Facebook posts, outdated blogs, and word-of-mouth tips that expire by next season."
          )}
        </p>
        <p className="text-base-content/70 leading-relaxed mb-4">
          {t(
            "আমরা তৈরি করছি ৬৪ জেলার পূর্ণাঙ্গ ভ্রমণসঙ্গী — গোছানো, কাজের, বাংলা-প্রথম জেলা গাইড, যেখানে থাকবে আসল খরচ, আসল রুট, আসল খাবারের খোঁজ আর আসল যাতায়াতের উপায়। গতানুগতিক পর্যটন বিজ্ঞাপন নয়, বরং এমন সত্যিকারের তথ্য যা আপনাকে পরিকল্পনা করে বেরিয়ে পড়তে সাহায্য করবে।",
            "We're building the definitive 64-district travel companion — structured, practical, Bangla-first district guides with real costs, real routes, real food recommendations, and real transport options. Not generic tourism marketing. Real information that helps you plan and go."
          )}
        </p>
        <p className="text-base-content/70 leading-relaxed">
          {t(
            "শুধু তথ্য নয়, আমরা গড়ে তুলছি একটা পরিচয়: \"আমি ঘুরেছি\" অভিজ্ঞতা। প্রতিটি জেলার জন্য ফটো ফ্রেম, সংগ্রহ করার মতো ব্যাজ, আর যাঁরা পুরো দেশ ঘুরে দেখবেন তাঁদের জন্য ৬৪ জেলা ভ্রমণ সম্পন্নের চূড়ান্ত সার্টিফিকেট।",
            "Beyond information, we're building an identity: the \"আমি ঘুরেছি\" (I've been there) experience. Photo frames for every district, badges you collect, and the ultimate 64-district completion certificate for those who explore their entire country."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { key: "district", icon: HiMap, title: t("জেলাভিত্তিক", "District-first"), desc: t("প্রতিটি জেলা পায় একই গোছানো উপস্থাপন: দর্শনীয় স্থান, খাবার, যাতায়াত, খরচ, প্ল্যান।", "Every district gets the same structured treatment: attractions, food, transport, costs, plans.") },
          { key: "bangla", icon: HiTranslate, title: t("বাংলা-প্রথম", "Bangla-first"), desc: t("আমাদের কনটেন্ট বাংলাদেশি ভ্রমণকারীদের জন্য বাংলায় লেখা, সঙ্গে আছে ইংরেজি সাপোর্ট।", "Our content is written in Bangla for Bangladeshi travellers, with English support.") },
          { key: "gamified", icon: FaMedal, title: t("খেলার মতো মজা", "Gamified"), desc: t("জেলা ব্যাজ সংগ্রহ করুন, ফ্রেম অর্জন করুন আর সম্পন্ন করুন ৬৪ জেলা চ্যালেঞ্জ।", "Collect district badges, earn frames, and complete the 64-district challenge.") },
        ].map(v => (
          <div key={v.key} className="card bg-base-200 p-5 border border-base-300">
            <v.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-base-content mb-1">{v.title}</h3>
            <p className="text-sm text-base-content/60">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="card bg-primary/10 border border-primary/20 p-6 text-center">
        <h2 className="text-xl font-bold text-base-content mb-2">{t("যাত্রায় যোগ দিন", "Join the journey")}</h2>
        <p className="text-base-content/60 mb-4">{t("৫টি জেলা ঘুরেছেন বা ৫০টি — নতুন গল্প সবসময় অপেক্ষা করছে।", "Whether you've visited 5 districts or 50, there's always a new story waiting.")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/districts" className="btn btn-primary">{t("জেলা ঘুরে দেখুন", "Explore Districts")}</Link>
          <Link to="/contact" className="btn btn-ghost">{t("যোগাযোগ করুন", "Get in Touch")}</Link>
        </div>
      </div>
    </div>
  );
}
