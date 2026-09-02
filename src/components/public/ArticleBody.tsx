import { cn } from "@/lib/utils";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "paragraph"; text: string };

/**
 * Parses the small block syntax used by `content/journal.ts`:
 *
 *   `## `  heading
 *   `> `   pulled quote
 *   otherwise, a paragraph
 *
 * Deliberately not `dangerouslySetInnerHTML`. Once article bodies come from
 * the CMS in Fase 7 they are user input, and injecting them as raw HTML would
 * hand any editor an XSS vector on the public site. Parsing a fixed set of
 * blocks and rendering real React elements means nothing in the string can
 * become markup.
 */
function parse(content: string): Block[] {
  return content
    .split(/\n{2,}/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw): Block => {
      if (raw.startsWith("## ")) {
        return { kind: "heading", text: raw.slice(3).trim() };
      }
      if (raw.startsWith("> ")) {
        return {
          kind: "quote",
          // A quote may wrap across lines, each prefixed with ">".
          text: raw
            .split("\n")
            .map((line) => line.replace(/^>\s?/, ""))
            .join(" ")
            .trim(),
        };
      }
      return { kind: "paragraph", text: raw.replace(/\n/g, " ") };
    });
}

export interface ArticleBodyProps {
  content: string;
  className?: string;
}

export function ArticleBody({ content, className }: ArticleBodyProps) {
  const blocks = parse(content);

  return (
    <div className={cn("flex flex-col", className)}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2
              key={i}
              className="measure mt-14 text-h3 text-graphite first:mt-0"
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === "quote") {
          return (
            <blockquote
              key={i}
              className="measure my-10 border-l-2 border-navy pl-6 lg:-ml-6"
            >
              {/* font-display-italic, not font-display: the italic face is a
                  separate un-preloaded font so the rest of the site does not
                  download it. See lib/fonts.ts. */}
              <p className="font-display-italic text-h3 leading-[1.35] text-graphite italic">
                {block.text}
              </p>
            </blockquote>
          );
        }
        return (
          <p key={i} className="measure mt-6 text-body text-slate first:mt-0">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export default ArticleBody;
