import Link from "next/link";
import { articles } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar learning center", "Short explanations of azimuth, system size, batteries, and series wiring.", "/learn");

export default function LearnPage() {
  return (
    <div className="wrap section">
      <p className="kicker">Learn</p>
      <h1 className="display">The ideas behind the calculators.</h1>
      <div className="grid-2">
        {articles.map((article) => (
          <Link key={article.slug} href={`/learn/${article.slug}`} className="card" style={{ textDecoration: "none" }}>
            <h2>{article.title}</h2>
            <p className="muted">{article.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
