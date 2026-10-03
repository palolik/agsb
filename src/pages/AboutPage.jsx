import { Link } from "react-router-dom";
import { HiMap, HiTranslate } from "react-icons/hi";
import { FaFlag, FaMedal } from "react-icons/fa";
import PageMeta from "../components/PageMeta";

export default function AboutPage() {
  const meta = <PageMeta title="আমাদের সম্পর্কে · About" description="Why we are building the definitive Bangla-first travel companion for all 64 districts of Bangladesh." />;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-6">আমাদের সম্পর্কে</h1>

      <div className="card bg-base-200 p-6 md:p-8 border border-base-300 mb-8">
        <FaFlag className="w-9 h-9 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-3">৬৪ জেলা, এক দেশ, অসংখ্য গল্প।</h2>
        <p className="text-base-content/70 leading-relaxed mb-4">
          AmiGhuriSaraBangladesh (আমিঘুরিসারাবাংলাদেশ) was born from a simple frustration: Bangladesh has incredible places to visit, but the information is scattered across random Facebook posts, outdated blogs, and word-of-mouth tips that expire by next season.
        </p>
        <p className="text-base-content/70 leading-relaxed mb-4">
          We're building the definitive 64-district travel companion — structured, practical, Bangla-first district guides with real costs, real routes, real food recommendations, and real transport options. Not generic tourism marketing. Real information that helps you plan and go.
        </p>
        <p className="text-base-content/70 leading-relaxed">
          Beyond information, we're building an identity: the "আমি ঘুরেছি" (I've been there) experience. Photo frames for every district, badges you collect, and the ultimate 64-district completion certificate for those who explore their entire country.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: HiMap, title: "District-first", desc: "Every district gets the same structured treatment: attractions, food, transport, costs, plans." },
          { icon: HiTranslate, title: "Bangla-first", desc: "Our content is written in Bangla for Bangladeshi travellers, with English support." },
          { icon: FaMedal, title: "Gamified", desc: "Collect district badges, earn frames, and complete the 64-district challenge." },
        ].map(v => (
          <div key={v.title} className="card bg-base-200 p-5 border border-base-300">
            <v.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-base-content mb-1">{v.title}</h3>
            <p className="text-sm text-base-content/60">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="card bg-primary/10 border border-primary/20 p-6 text-center">
        <h2 className="text-xl font-bold text-base-content mb-2">Join the journey</h2>
        <p className="text-base-content/60 mb-4">Whether you've visited 5 districts or 50, there's always a new story waiting.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/districts" className="btn btn-primary">Explore Districts</Link>
          <Link to="/contact" className="btn btn-ghost">Get in Touch</Link>
        </div>
      </div>
    </div>
  );
}
