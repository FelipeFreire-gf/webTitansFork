import { useEffect, useState, type ReactNode } from "react";
import type { RoboBioInlineLink } from "@/lib/robo-bio-content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectHeroCarousel from "@/components/ProjectHeroCarousel";
import ProjectParticipants from "@/components/ProjectParticipants";
import ScrollingImageGallery from "@/components/ScrollingImageGallery";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  ROBO_BIO_HERO_IMAGES,
  ROBO_BIO_INTRO,
  ROBO_BIO_MEMBERS,
  ROBO_BIO_SECTIONS,
  ROBO_BIO_TITLE,
  type RoboBioSectionId,
} from "@/lib/robo-bio-content";

function renderParagraphText(text: string, links?: RoboBioInlineLink[]): ReactNode {
  if (!links?.length) return text;

  const parts: ReactNode[] = [];
  let remaining = text;

  for (const link of links) {
    const index = remaining.indexOf(link.label);
    if (index === -1) continue;

    if (index > 0) parts.push(remaining.slice(0, index));
    parts.push(
      <a
        key={link.href}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-titans-orange underline-offset-2 hover:underline"
      >
        {link.label}
      </a>,
    );
    remaining = remaining.slice(index + link.label.length);
  }

  if (remaining) parts.push(remaining);
  return parts.length > 0 ? parts : text;
}

const RoboBio = () => {
  const [activeSection, setActiveSection] = useState<RoboBioSectionId>("robo-bio-v1");

  useEffect(() => {
    const sectionIds = ROBO_BIO_SECTIONS.map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as RoboBioSectionId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: RoboBioSectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-20 pb-10 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/projetos"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Projetos Destaques
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start max-w-6xl mx-auto">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-titans-red to-titans-orange bg-clip-text text-transparent">
                  {ROBO_BIO_TITLE}
                </span>
              </h1>
              {ROBO_BIO_INTRO.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="text-muted-foreground leading-relaxed mb-4 text-justify"
                >
                  {paragraph}
                </p>
              ))}
              <ProjectParticipants members={[...ROBO_BIO_MEMBERS]} align="start" />
            </div>

            <ProjectHeroCarousel images={ROBO_BIO_HERO_IMAGES} ariaLabel="Imagens do Robô Bio" />
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 max-w-6xl mx-auto">
            <aside className="lg:w-56 shrink-0">
              <nav
                className="lg:sticky lg:top-24 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0"
                aria-label="Tópicos do projeto"
              >
                {ROBO_BIO_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors border",
                      activeSection === section.id
                        ? "border-titans-orange/50 bg-titans-orange/10 text-titans-orange"
                        : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-20">
              {ROBO_BIO_SECTIONS.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 pb-2 border-b border-border">
                    {section.label}
                  </h2>
                  <div className="space-y-10">
                    {section.paragraphs.map((paragraph) =>
                      paragraph.image ? (
                        <div
                          key={paragraph.text.slice(0, 48)}
                          className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6 lg:gap-8"
                        >
                          <p className="min-w-0 flex-1 text-muted-foreground leading-relaxed text-justify">
                            {renderParagraphText(paragraph.text, paragraph.links)}
                          </p>
                          <figure className="mx-auto w-full max-w-xs shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2 sm:mx-0 sm:w-44 md:w-52 lg:w-56">
                            <img
                              src={paragraph.image.src}
                              alt={paragraph.image.alt}
                              className="h-auto w-full max-h-56 object-contain sm:max-h-64"
                              loading="lazy"
                            />
                          </figure>
                        </div>
                      ) : (
                        <p
                          key={paragraph.text.slice(0, 48)}
                          className="text-muted-foreground leading-relaxed text-justify"
                        >
                          {renderParagraphText(paragraph.text, paragraph.links)}
                        </p>
                      ),
                    )}
                  </div>

                  {section.images && section.images.length > 0 && (
                    <ScrollingImageGallery images={section.images} />
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoboBio;
