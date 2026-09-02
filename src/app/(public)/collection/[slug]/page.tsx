import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TimepieceGallery } from "@/components/public/TimepieceGallery";
import { Reveal } from "@/components/ui/Reveal";
import {
  eraOf,
  getTimepieceBySlug,
  getTimepieceNeighbours,
  getTimepieces,
} from "@/lib/queries";
import type { Timepiece } from "@/types";

export async function generateStaticParams() {
  const timepieces = await getTimepieces();
  return timepieces.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collection/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const timepiece = await getTimepieceBySlug(slug);
  if (!timepiece) return { title: "Not found" };
  return {
    title: `${timepiece.brand} ${timepiece.model}`,
    description: timepiece.description,
  };
}

function specifications(timepiece: Timepiece) {
  return [
    { label: "Reference", value: timepiece.referenceNumber },
    { label: "Year", value: timepiece.year?.toString() },
    { label: "Movement", value: timepiece.movement },
    { label: "Case size", value: timepiece.caseSize },
    { label: "Case material", value: timepiece.caseMaterial },
    { label: "Dial", value: timepiece.dialColor },
    { label: "Type", value: timepiece.category },
    { label: "Era", value: eraOf(timepiece) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
}

export default async function TimepieceDetailPage({
  params,
}: PageProps<"/collection/[slug]">) {
  const { slug } = await params;
  const timepiece = await getTimepieceBySlug(slug);
  if (!timepiece) notFound();

  const { previous, next } = await getTimepieceNeighbours(slug);
  const name = `${timepiece.brand} ${timepiece.model}`;
  const specs = specifications(timepiece);
  const paragraphs = timepiece.story?.split("\n\n").filter(Boolean) ?? [];

  return (
    <>
      <div className="shell pt-section-sm md:pt-section">
        <Link
          href="/collection"
          className="group inline-flex min-h-11 items-center gap-2 text-small font-medium text-slate transition-colors duration-fast hover:text-graphite"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform duration-base ease-out-museum group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
          Back to the collection
        </Link>
      </div>

      <article className="shell pt-8 pb-section-sm md:pb-section lg:pb-section-lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <TimepieceGallery images={timepiece.images} name={name} />
          </Reveal>

          <div>
            <Reveal>
              <p className="eyebrow">{timepiece.category ?? "Timepiece"}</p>
              <h1 className="mt-5 text-h1 text-graphite uppercase">
                {timepiece.brand}
              </h1>
              <p className="mt-3 font-display text-h2 text-slate">
                {timepiece.model}
              </p>
              <p className="mt-5 text-caption tracking-caption text-slate uppercase">
                {timepiece.referenceNumber && `Ref. ${timepiece.referenceNumber}`}
                {timepiece.referenceNumber && timepiece.year && " · "}
                {timepiece.year}
              </p>

              {timepiece.description && (
                <p className="measure mt-8 text-body text-graphite">
                  {timepiece.description}
                </p>
              )}
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="eyebrow mt-14 border-t border-border-grey pt-8">
                Specifications
              </h2>
              <dl className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="border-b border-border-grey py-4"
                  >
                    <dt className="text-caption tracking-caption text-slate uppercase">
                      {spec.label}
                    </dt>
                    <dd
                      data-numeric
                      className="mt-2 text-small text-graphite"
                    >
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>

        {paragraphs.length > 0 && (
          <Reveal className="mt-section-sm md:mt-section">
            <h2 className="eyebrow">Notes</h2>
            <div className="measure mt-6 flex flex-col gap-6">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-body text-slate">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        )}
      </article>

      {/* ---- Prev / next --------------------------------------------- */}
      {(previous || next) && (
        <nav
          aria-label="Other timepieces"
          className="border-t border-border-grey"
        >
          <div className="shell grid gap-px sm:grid-cols-2">
            {previous && (
              <Link
                href={`/collection/${previous.slug}`}
                rel="prev"
                className="group flex flex-col gap-2 py-10 transition-colors duration-base hover:bg-pure-white sm:pr-8"
              >
                <span className="inline-flex items-center gap-2 text-caption tracking-label text-slate uppercase">
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  Previous
                </span>
                <span className="font-display text-h3 text-graphite transition-colors duration-base group-hover:text-navy">
                  {previous.brand.toUpperCase()} {previous.model}
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/collection/${next.slug}`}
                rel="next"
                className="group flex flex-col items-start gap-2 border-t border-border-grey py-10 transition-colors duration-base hover:bg-pure-white sm:items-end sm:border-t-0 sm:border-l sm:pl-8 sm:text-right"
              >
                <span className="inline-flex items-center gap-2 text-caption tracking-label text-slate uppercase">
                  Next
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </span>
                <span className="font-display text-h3 text-graphite transition-colors duration-base group-hover:text-navy">
                  {next.brand.toUpperCase()} {next.model}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
