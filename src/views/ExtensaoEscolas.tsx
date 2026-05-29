import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectHeroCarousel from "@/components/ProjectHeroCarousel";
import ProjectParticipants from "@/components/ProjectParticipants";
import ScrollingImageGallery from "@/components/ScrollingImageGallery";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  EXTENSAO_ESCOLAS_HERO_IMAGES,
  EXTENSAO_ESCOLAS_INTRO,
  EXTENSAO_ESCOLAS_MEMBERS,
  EXTENSAO_ESCOLAS_SECTIONS,
  EXTENSAO_ESCOLAS_TITLE,
  type ExtensaoEscolasSectionId,
} from "@/lib/extensao-escolas-content";

const ExtensaoEscolas = () => {
  const [activeSection, setActiveSection] = useState<ExtensaoEscolasSectionId>("sobre");

  useEffect(() => {
    const sectionIds = EXTENSAO_ESCOLAS_SECTIONS.map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as ExtensaoEscolasSectionId);
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

  const scrollToSection = (id: ExtensaoEscolasSectionId) => {
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
                  {EXTENSAO_ESCOLAS_TITLE}
                </span>
              </h1>
              {EXTENSAO_ESCOLAS_INTRO.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="text-muted-foreground leading-relaxed mb-4 text-justify"
                >
                  {paragraph}
                </p>
              ))}
              <ProjectParticipants members={[...EXTENSAO_ESCOLAS_MEMBERS]} align="start" />
            </div>

            <ProjectHeroCarousel
              images={EXTENSAO_ESCOLAS_HERO_IMAGES}
              ariaLabel="Imagens da extensÃ£o em escolas"
            />
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 max-w-6xl mx-auto">
            <aside className="lg:w-56 shrink-0">
              <nav
                className="lg:sticky lg:top-24 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0"
                aria-label="TÃ³picos do projeto"
              >
                {EXTENSAO_ESCOLAS_SECTIONS.map((section) => (
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
              {EXTENSAO_ESCOLAS_SECTIONS.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 pb-2 border-b border-border">
                    {section.label}
                  </h2>
                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="text-muted-foreground leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
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

export default ExtensaoEscolas;
