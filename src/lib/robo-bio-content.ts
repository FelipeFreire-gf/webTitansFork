import capaRoboBio from "@/assets/roboBio/capa.jpeg";
import felipeDasNevesPhoto from "@/assets/fotosSeguidor/imgLipeTitans2.jpg";
import renderV2 from "@/assets/roboBio/renderV2.png";
import desmontado from "@/assets/roboBio/desmontado.jpeg";
import roboBioV1 from "@/assets/roboBio/roboBioV1.png";
import chanfroMotor from "@/assets/roboBio/chanfroMotor.jpeg";
import chanfroRemovidoMotor from "@/assets/roboBio/chanfroRemovidoMotor.jpeg";
import engrenagemMotor from "@/assets/roboBio/engrenagemMotor.jpeg";
import inicioMontagem from "@/assets/roboBio/inicioMontagem.jpeg";
import remontagemMotor from "@/assets/roboBio/remontagemMotor.jpeg";
import remontagemMotor2 from "@/assets/roboBio/remontagemMotor2.jpeg";
import thingsboardDashboard from "@/assets/roboBio/thingsboard.png";

export const ROBO_BIO_DETAIL_PATH = "/projetos/robo-bio";

export const ROBO_BIO_TITLE = "Robô Bio — Seguidor de Linha";

export const ROBO_BIO_SUMMARY =
  "Seguidor de linha (FSE/FCTE-UnB): da V1 com PID e telemetria à calibração bioinspirada e visão computacional do trajeto.";

export const ROBO_BIO_COVER = capaRoboBio;

export const ROBO_BIO_MEMBERS = [
  { name: "Felipe das Neves", photo: felipeDasNevesPhoto },
] as const;

export const ROBO_BIO_HERO_IMAGES = [
  { src: capaRoboBio, alt: "Robô Bio — foto do projeto" },
  { src: renderV2, alt: "Robô Bio — render 3D" },
  { src: desmontado, alt: "Robô Bio — visão desmontada" },
  { src: roboBioV1, alt: "Robô Bio — primeira versão" },
] as const;

export type RoboBioSectionId =
  | "mecanica"
  | "eletronica"
  | "software"
  | "robo-bio-v1"
  | "robo-bio-v2"
  | "galeria";

export type RoboBioInlineLink = {
  label: string;
  href: string;
};

export type RoboBioParagraph = {
  text: string;
  image?: { src: string; alt: string };
  links?: RoboBioInlineLink[];
};

export type RoboBioSection = {
  id: RoboBioSectionId;
  label: string;
  paragraphs: RoboBioParagraph[];
  images?: { src: string; alt: string }[];
};

export const ROBO_BIO_SECTIONS: RoboBioSection[] = [
  {
    id: "robo-bio-v1",
    label: "Robô Bio V1",
    paragraphs: [
      {
        text: "Na primeira versão, o firmware foi desenvolvido em ESP-IDF para o ESP32. O robô lia a pista com sensores de refletância e corrigia a trajetória com controle PID sobre a velocidade dos motores, buscando um seguimento estável na faixa. Ainda não foi possível adotar algoritmos bioinspirados para o ajuste automático das constantes de PID: problemas mecânicos recorrentes — o chassi prendia na manta emborrachada — exigiram remodelagem estrutural antes de avançar no controle inteligente.",
        image: {
          src: roboBioV1,
          alt: "Robô Bio V1 — primeira versão do seguidor de linha",
        },
      },
      {
        text: "O V1 também contava com Wi-Fi e MQTT, enviando telemetria em tempo real ao ThingsBoard. Esse fluxo de dados facilitou monitorar o comportamento na pista, calibrar o PID manualmente e depurar o sistema à distância — experiência que orienta as versões seguintes do projeto.",
        image: {
          src: thingsboardDashboard,
          alt: "Dashboard ThingsBoard — telemetria em tempo real do Robô Bio V1",
        },
      },
    ],
  },
  {
    id: "robo-bio-v2",
    label: "Robô Bio V2",
    paragraphs: [
      {
        text: "Visto que os principais problemas do modelo anterior estavam no design mecânico, a ideia do Robô Bio V2 é um chassi grande o suficiente para abrigar as mais variadas ideias possíveis: microcontroladores de diferentes tipos, eletrônica em nível de prototipagem e espaço físico para evoluir sem as limitações de tamanho da V1.",
        image: {
          src: renderV2,
          alt: "Robô Bio V2 — render 3D do chassi inspirado no ExoMy",
        },
      },
      {
        text: "Partindo desse princípio, encontrei o projeto ExoMy, um projeto open source de mini rover acessível, no qual as peças podem ser impressas em impressora 3D convencional com filamentos acessíveis como PLA e PETG — suprindo o maior gap do projeto até então, que era a mecânica. Não segui o projeto fielmente: adaptei o design aos objetivos do Robô Bio e aos componentes eletrônicos que tinha disponíveis, mas a referência open source evitou partir do absoluto zero.",
        links: [{ label: "ExoMy", href: "https://esa-prl.github.io/ExoMy/" }],
      },
      {
        text: "Na sequência seguem os detalhes do estado atual do projeto:",
      },
    ],
  },
  {
    id: "mecanica",
    label: "Mecânica",
    paragraphs: [
      {
        text: "Na V2, a mecânica deixa de ser o gargalo que travou a V1 na manta emborrachada. O chassi segue a linha do ExoMy — rover de seis rodas com suspensão articulada —, com peças impressas em PLA e PETG e adaptações para caber a Raspberry Pi, a fiação de prototipagem, as placas solares e o volume necessário para testar novas ideias sem refazer a estrutura a cada iteração.",
      },
      {
        text: "A locomoção reutiliza a experiência da primeira versão: os seis servos MG996R adaptados à locomoção com a remoção do potenciômetro e lixamento do chanfro na engrenagem, convertendo o servo em motor de rotação contínua e permitindo acoplar as rodas do rover com mais folga e repetibilidade.",
      },
      {
        text: "Os outros seis servos MG996R permanecem no modo padrão de 180°, atuando nos articuladores do modelo. A galeria ao final desta página registra a evolução desse trabalho manual do chanfro nos motores à montagem e remontagem dos conjuntos que hoje sustentam a V2.",
      },
    ],
  },
  {
    id: "eletronica",
    label: "Eletrônica",
    paragraphs: [
      {
        text: "Na V2, o microcontrolador principal é uma Raspberry Pi 3, responsável pela lógica de alto nível, comunicação e futuros módulos de visão. O acionamento dos servos fica a cargo de um módulo Estardyn PCA9685PW — driver PWM de 16 canais e 12 bits — capaz de comandar os 12 servo motores do robô de forma independente.",
      },
      {
        text: "O conjunto totaliza 12 servos: seis MG996R de 180° nos graus de liberdade do rover e seis unidades do mesmo modelo adaptadas à locomoção — com o potenciômetro removido e o chanfro da engrenagem lixado, passando a atuar como motores de rotação contínua.",
      },
      {
        text: "Como apoio ao projeto de extensão em escolas, foram integradas quatro placas solares ao robô, voltadas à recarga da bateria. A documentação elétrica desse subsistema — dimensionamento, proteção e gestão de carga — será detalhada em uma atualização futura.",
      },
    ],
  },
  {
    id: "software",
    label: "Software",
    paragraphs: [
      {
        text: "O software do Robô Bio segue a abordagem de sistemas embarcados da FSE: requisitos, arquitetura modular, leitura de sensores, cálculo do erro em relação à linha e controle PID para correção da trajetória.",
      },
      {
        text: "O firmware mantém um loop em tempo real — captura sensores, calcula o desvio, aplica PID e comanda os motores. A meta é evoluir do ajuste manual de ganhos, feito no V1 com apoio da telemetria, para a obtenção das constantes de PID por algoritmos bioinspirados.",
      },
      {
        text: "Em paralelo, modela-se um sistema de visão computacional que delimita o caminho à frente do robô, complementando os sensores de refletância e tornando o seguimento de trajeto mais robusto nas próximas iterações.",
      },
    ],
  },
  {
    id: "galeria",
    label: "Galeria",
    paragraphs: [
      {
        text: "Fotos da montagem, dos ajustes nos motores e da evolução mecânica do Robô Bio — do protótipo inicial à estrutura preparada para os testes de controle e software.",
      },
    ],
    images: [
      { src: inicioMontagem, alt: "Início da montagem do Robô Bio" },
      { src: engrenagemMotor, alt: "Engrenagem acoplada ao motor" },
      { src: chanfroMotor, alt: "Motor com chanfro antes do ajuste" },
      { src: chanfroRemovidoMotor, alt: "Motor após remoção do chanfro" },
      { src: remontagemMotor, alt: "Remontagem do conjunto motor-engrenagem" },
      { src: remontagemMotor2, alt: "Detalhe da remontagem dos motores" },
    ],
  },
];

export const ROBO_BIO_INTRO = [
  "O Robô Bio é um seguidor de linha autônomo desenvolvido inicialmente como trabalho final da disciplina Fundamentos de Sistemas Embarcados (FSE), da Faculdade de Ciências e Tecnologias em Engenharia (FCTE/UnB), sob orientação do professor Dr. Renato Coral.",
  "O projeto partiu da V1 PID clássico, sensores de refletância e telemetria via ThingsBoard passou por um novo chassi na V2, inspirado no rover open source ExoMy, e segue em direção a um robô mais robusto: calibração de PID por algoritmos bioinspirados e delimitação do trajeto por visão computacional.",
];
