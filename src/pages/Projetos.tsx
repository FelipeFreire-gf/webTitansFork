import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { PROJECTS } from "@/lib/projects-data";

const Projetos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-20 pb-12 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-titans-red to-titans-orange bg-clip-text text-transparent">
                Projetos Destaques
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Conheça os projetos avulsos de membros da TITANS que, por iniciativa própria, propuseram
              pesquisas em PIBIC, projetos envolvendo disciplinas da graduação e atividades de extensão.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.detailHref} project={project} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Projetos;
