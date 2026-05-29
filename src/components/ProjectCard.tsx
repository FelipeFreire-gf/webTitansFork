import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ProjectParticipants from "@/components/ProjectParticipants";
import type { Project } from "@/lib/projects-data";

type ProjectCardProps = {
  project: Project;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/50 transition-all duration-300 hover:border-titans-orange/50 hover:shadow-lg">
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-contain object-center"
        />
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-center text-lg font-semibold">{project.title}</h3>
        <p className="mb-4 flex-1 text-center text-sm leading-relaxed text-muted-foreground">
          {project.summary}
        </p>

        <ProjectParticipants members={project.members} className="mb-6" />

        <Button variant="hero" size="lg" className="w-full" asChild>
          <Link href={project.detailHref}>
            Conheça mais o projeto
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
