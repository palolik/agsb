import { useParams, Link } from "react-router-dom";
import { blogPosts, districts } from "../data";
import { HiArrowLeft, HiClock, HiCalendar } from "react-icons/hi";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const post = blogPosts.find(b => b.slug === slug);
  if (!post) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Post not found</h1><Link to="/blog" className="btn btn-primary mt-4">Back to Blog</Link></div>;

  const district = districts.find(d => d.slug === post.districtSlug);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/blog" className="btn btn-ghost btn-sm mb-6"><HiArrowLeft className="mr-1" /> Back to Blog</Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="badge badge-primary badge-outline">{post.category}</span>
          <span className="text-sm text-base-content/40 flex items-center gap-1"><HiClock /> {post.readTime}</span>
          <span className="text-sm text-base-content/40 flex items-center gap-1"><HiCalendar /> {post.date}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">{post.title_bn}</h1>
        <p className="text-lg text-base-content/60">{post.title_en}</p>
      </div>

      <img src={post.image} alt={post.title_en} className="w-full h-64 md:h-96 object-cover rounded-xl mb-8" />

      <div className="prose prose-invert max-w-none">
        <p className="text-lg text-base-content/70 leading-relaxed">{post.excerpt}</p>
        <div className="bg-base-200 rounded-xl p-6 my-8 border border-base-300">
          <p className="text-base-content/60 text-sm">This is a preview of the full article. In the live version, the complete guide with detailed itineraries, cost breakdowns, and local tips will be loaded from the backend CMS.</p>
        </div>
        {district && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-base-content mb-3">Related District</h3>
            <Link to={`/districts/${district.slug}`} className="card bg-base-200 p-4 border border-base-300 card-hover flex flex-row items-center gap-4">
              <img src={district.image} alt={district.name_en} className="w-20 h-20 rounded-lg object-cover" />
              <div>
                <h4 className="font-bold text-base-content">{district.name_bn}</h4>
                <p className="text-sm text-base-content/50">{district.name_en} — {district.tagline}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
