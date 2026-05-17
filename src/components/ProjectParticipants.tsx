import { cn } from "@/lib/utils";
import type { ProjectMember } from "@/lib/projects-data";

type ProjectParticipantsProps = {
  members: ProjectMember[];
  className?: string;
  align?: "center" | "start";
};

const ProjectParticipants = ({
  members,
  className,
  align = "center",
}: ProjectParticipantsProps) => {
  if (members.length === 0) return null;

  return (
    <div className={cn("mt-6", className)}>
      <p
        className={cn(
          "mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground",
          align === "center" ? "text-center" : "text-center lg:text-left",
        )}
      >
        Participantes
      </p>
      <div
        className={cn(
          "flex flex-wrap gap-5",
          align === "center" ? "justify-center" : "justify-center lg:justify-start",
        )}
      >
        {members.map((member) => (
          <div key={member.name} className="flex w-[4.5rem] flex-col items-center">
            <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-titans-orange/30 bg-muted">
              <img
                src={member.photo}
                alt={`Foto de ${member.name}`}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="mt-2 text-center text-xs font-medium leading-tight text-foreground">
              {member.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectParticipants;
