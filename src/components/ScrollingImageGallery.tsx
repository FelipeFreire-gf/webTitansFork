type GalleryImage = {
  src: string;
  alt: string;
};

type ScrollingImageGalleryProps = {
  images: GalleryImage[];
};

const ScrollingImageGallery = ({ images }: ScrollingImageGalleryProps) => {
  if (images.length === 0) return null;

  return (
    <div className="relative mt-8 w-full overflow-hidden py-8">
      <div className="flex w-max animate-scroll-left hover:[animation-play-state:paused]">
        {[0, 1, 2].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center gap-8 pl-8"
            aria-hidden={copy > 0 ? true : undefined}
          >
            {images.map((photo, index) => (
              <div
                key={`${copy}-${photo.alt}-${index}`}
                className="relative z-0 flex h-96 min-w-[640px] shrink-0 items-center justify-center rounded-xl bg-white/90 px-12 py-8 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out will-change-transform hover:z-30 hover:scale-110 hover:shadow-2xl dark:bg-card/90"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-[22rem] w-auto max-w-[580px] object-contain"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingImageGallery;
