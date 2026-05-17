import ProjectHeroCarousel from "@/components/ProjectHeroCarousel";
import { ROBO_BIO_HERO_IMAGES } from "@/lib/robo-bio-content";

type RoboBioHeroCarouselProps = {
  className?: string;
};

const RoboBioHeroCarousel = ({ className }: RoboBioHeroCarouselProps) => (
  <ProjectHeroCarousel
    images={ROBO_BIO_HERO_IMAGES}
    ariaLabel="Imagens do Robô Bio"
    className={className}
  />
);

export default RoboBioHeroCarousel;
