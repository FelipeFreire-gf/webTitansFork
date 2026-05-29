import capaExtensao from "@/assets/extencaoEscolas/capa.png";
import escolaSantaMaria from "@/assets/extencaoEscolas/escolaSantaMaria.png";
import escolaCasaGrande from "@/assets/extencaoEscolas/escolaCasaGrande.png";
import raulPhoto from "@/assets/fotosSsl/raul.png";
import filipeErnestoPhoto from "@/assets/fotosVsss/filipeErnesto2.png";
import danielLustosaPhoto from "@/assets/fotosSsl/danielLustosa.png";

export const EXTENSAO_ESCOLAS_DETAIL_PATH = "/projetos/extensao-escolas";

export const EXTENSAO_ESCOLAS_TITLE = "Extensão em Escolas";

export const EXTENSAO_ESCOLAS_SUMMARY =
  "Projeto de extensão da TITANS que leva robótica e tecnologia para escolas, com oficinas e atividades práticas para estudantes.";

export const EXTENSAO_ESCOLAS_COVER = capaExtensao.src;

export const EXTENSAO_ESCOLAS_MEMBERS = [
  { name: "Raul Braga", photo: raulPhoto.src },
  { name: "Filipe Ernesto", photo: filipeErnestoPhoto.src },
  { name: "Daniel Lustosa", photo: danielLustosaPhoto.src },
] as const;

export const EXTENSAO_ESCOLAS_HERO_IMAGES = [
  { src: capaExtensao.src, alt: "Extensão em escolas — capa do projeto" },
  { src: escolaSantaMaria.src, alt: "Atividade na Escola Santa Maria" },
  { src: escolaCasaGrande.src, alt: "Atividade na Escola Casa Grande" },
] as const;

export type ExtensaoEscolasSectionId = "sobre" | "atividades" | "galeria";

export type ExtensaoEscolasSection = {
  id: ExtensaoEscolasSectionId;
  label: string;
  paragraphs: string[];
  images?: { src: string; alt: string }[];
};

export const EXTENSAO_ESCOLAS_VISITS = [
  {
    src: escolaSantaMaria.src,
    alt: "Atividade de extensão na Escola Santa Maria",
    name: "Escola Santa Maria",
  },
  {
    src: escolaCasaGrande.src,
    alt: "Atividade de extensão na Escola Casa Grande",
    name: "Escola Casa Grande",
  },
] as const;

export const EXTENSAO_ESCOLAS_SECTIONS: ExtensaoEscolasSection[] = [
  {
    id: "sobre",
    label: "Sobre o projeto",
    paragraphs: [
      "O projeto de extensão em escolas é uma iniciativa da equipe TITANS junto com a RAS voltada à comunidade: membros visitam instituições de ensino para apresentar conceitos de robótica, estimular o interesse e aproximar a universidade do ambiente escolar.",
      "Por meio de encontros presenciais, demonstrações e atividades hands-on, o projeto busca inspirar novas gerações e divulgar o trabalho desenvolvido no Grupo de Robótica Titans.",
    ],
  },
  {
    id: "atividades",
    label: "Atividades",
    paragraphs: [
      "Nas visitas, a equipe leva demonstrações de robôs, conversa com os estudantes sobre engenharia e tecnologia e propõe dinâmicas práticas para aproximar a teoria do dia a dia.",
      "O foco é despertar curiosidade, responder dúvidas sobre o curso e mostrar que a robótica pode ser um caminho acessível para quem se interessa por inovação e resolução de problemas.",
    ],
  },
  {
    id: "galeria",
    label: "Galeria",
    paragraphs: [
      "Registro das visitas realizadas às escolas parceiras, com momentos das apresentações, interação com os alunos e atividades de extensão.",
    ],
    images: EXTENSAO_ESCOLAS_VISITS.map((visit) => ({
      src: visit.src,
      alt: visit.alt,
    })),
  },
];

export const EXTENSAO_ESCOLAS_INTRO = [
  "O projeto de extensão em escolas é uma iniciativa da equipe TITANS voltada à comunidade: membros da equipe visitam instituições de ensino para apresentar conceitos de robótica, estimular o interesse por STEM e aproximar a universidade do ambiente escolar.",
  "Por meio de encontros presenciais, demonstrações e atividades hands-on, o projeto busca inspirar novas gerações e divulgar o trabalho desenvolvido no Grupo de Robótica Titans. Abaixo, o projeto é apresentado por tema: Sobre o projeto, Atividades e Galeria.",
];
