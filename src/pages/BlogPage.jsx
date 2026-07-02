import { Link } from "react-router-dom";
import { blogPosts } from "../data";
import { HiClock, HiArrowRight } from "react-icons/hi";

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">ট্রাভেল ব্লগ</h1>
        <p className="text-base-content/50 mt-1">Guides, tips, food stories, and local insights from across Bangladesh</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {blogPosts.map(b => (
          <Link key={b.id} to={`/blog/${b.slug}`} className="card bg-base-200 card-hover overflow-hidden group border border-base-300">
            <figure className="h-44 overflow-hidden">
              <img src={b.image} alt={b.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </figure>
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-sm badge-primary badge-outline">{b.category}</span>
                <span className="text-xs text-base-content/40 flex items-center gap-1"><HiClock /> {b.readTime}</span>
                <span className="text-xs text-base-content/40">{b.date}</span>
              </div>
              <h3 className="text-lg font-bold text-base-content">{b.title_bn}</h3>
              <p className="text-sm text-base-content/60">{b.title_en}</p>
              <p className="text-sm text-base-content/50 mt-2 line-clamp-2">{b.excerpt}</p>
              <div className="mt-3">
                <span className="text-sm text-primary font-medium flex items-center gap-1">Read more <HiArrowRight /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
