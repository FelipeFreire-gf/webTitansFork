import {
  EXTENSAO_ESCOLAS_COVER,
  EXTENSAO_ESCOLAS_DETAIL_PATH,
  EXTENSAO_ESCOLAS_MEMBERS,
  EXTENSAO_ESCOLAS_SUMMARY,
  EXTENSAO_ESCOLAS_TITLE,
} from "@/lib/extensao-escolas-content";
import {
  ROBO_BIO_COVER,
  ROBO_BIO_DETAIL_PATH,
  ROBO_BIO_MEMBERS,
  ROBO_BIO_SUMMARY,
  ROBO_BIO_TITLE,
} from "@/lib/robo-bio-content";

export type ProjectMember = {
  name: string;
  photo: string;
};

export type ProjectLinkType = "github" | "instagram" | "external" | "mail";

export type ProjectLink = {
  type: ProjectLinkType;
  href: string;
  label: string;
};

export type Project = {
  title: string;
  summary: string;
  image: string;
  detailHref: string;
  members: ProjectMember[];
  links: ProjectLink[];
};

export const PROJECTS: Project[] = [
  {
    title: ROBO_BIO_TITLE,
    summary: ROBO_BIO_SUMMARY,
    image: ROBO_BIO_COVER,
    detailHref: ROBO_BIO_DETAIL_PATH,
    members: [...ROBO_BIO_MEMBERS],
    links: [],
  },
  {
    title: EXTENSAO_ESCOLAS_TITLE,
    summary: EXTENSAO_ESCOLAS_SUMMARY,
    image: EXTENSAO_ESCOLAS_COVER,
    detailHref: EXTENSAO_ESCOLAS_DETAIL_PATH,
    members: [...EXTENSAO_ESCOLAS_MEMBERS],
    links: [],
  },
];
