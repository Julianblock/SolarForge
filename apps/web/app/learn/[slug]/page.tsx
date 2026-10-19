import Link from "next/link";
import { notFound } from "next/navigation";
import { articleBySlug, articles } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  return pageMetadata(article.title, article.description, `/learn/${article.slug}`);
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();
  return (
    <article className="wrap section">
      <p className="kicker">Learn</p>
      <nav aria-label="Breadcrumb"><Link href="/learn">Learn</Link> / {article.title}</nav>
      <h1 className="display">{article.title}</h1>
      {article.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
    </article>
  );
}
