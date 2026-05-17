import React, { useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';

/* ── Fixed slideshow dimensions ────────────────────────────── */
const SLIDE_WIDTH = 2400;
const SLIDE_HEIGHT = 1200;

/**
 * Build srcSet entries for a slideshow image.
 * Every variant is requested at the fixed 2:1 aspect ratio with fit=cover
 * so the server crops / resizes non-conforming images automatically.
 */
function buildSlideSrcSet(src: string, quality: number = 75): string {
  const widths = [640, 960, 1280, 1600, 1920, 2400];
  return widths
    .map((w) => {
      const h = Math.round(w * (SLIDE_HEIGHT / SLIDE_WIDTH));
      const url = `/images?src=${encodeURIComponent(src)}&w=${w}&h=${h}&q=${quality}&fit=cover`;
      return `${url} ${w}w`;
    })
    .join(', ');
}

function buildSlideFallback(src: string, quality: number = 75): string {
  return `/images?src=${encodeURIComponent(src)}&w=${SLIDE_WIDTH}&h=${SLIDE_HEIGHT}&q=${quality}&fit=cover`;
}

const SliderComponent = Slider as any;

interface SlideData {
  id: string;
  image: string;
  width?: number;
  height?: number;
  headline?: string;
  subText?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
}

interface SlideshowProps {
  slideshowWidget: {
    slides: SlideData[];
    autoplay?: boolean;
    autoplaySpeed?: number;
    arrows?: boolean;
    dots?: boolean;
  };
}

export default function Slideshow({
  slideshowWidget: {
    slides = [],
    autoplay = true,
    autoplaySpeed = 3000,
    arrows = true,
    dots = true
  }
}: SlideshowProps) {
  const sliderRef = useRef<any>(null);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: Boolean(autoplay),
    autoplaySpeed: Number(autoplaySpeed) || 3000,
    arrows: false,
    fade: false,
    pauseOnHover: true,
    adaptiveHeight: false
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  const showArrows = Boolean(arrows) && slides.length > 1;

  return (
    <div
      className="slideshow-widget w-full"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <SliderComponent ref={sliderRef} {...settings}>
        {slides.map((slide) => (
          <div key={slide.id}>
            {/* Each slide is a simple relative wrapper; image sets the height */}
            <div style={{ position: 'relative', lineHeight: 0 }}>
              <img
                src={buildSlideFallback(slide.image)}
                srcSet={buildSlideSrcSet(slide.image)}
                sizes="100vw"
                alt={slide.headline || 'Slideshow image'}
                loading="eager"
                decoding="async"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '2 / 1',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />

              {/* Overlay content */}
              {(slide.headline ||
                slide.subText ||
                (slide.buttonText && slide.buttonLink)) && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '1rem'
                  }}
                >
                  <div className="p-4 md:p-8 rounded-lg max-w-3xl">
                    {slide.headline && (
                      <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                        {slide.headline}
                      </h2>
                    )}

                    {slide.subText && (
                      <p className="text-white text-sm md:text-base lg:text-lg mb-4 md:mb-8 max-w-2xl mx-auto drop-shadow-md">
                        {slide.subText}
                      </p>
                    )}

                    {slide.buttonText && slide.buttonLink && (
                      <a
                        href={slide.buttonLink}
                        className="inline-block px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:scale-105"
                        style={{
                          backgroundColor: slide.buttonColor || '#3B82F6'
                        }}
                      >
                        {slide.buttonText}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </SliderComponent>

      {/* Arrow buttons — children of the same relative wrapper, positioned with inline style */}
      {showArrows && (
        <>
          <button
            onClick={() => sliderRef.current?.slickPrev()}
            aria-label="Diapositive précédente"
            type="button"
            className="flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none h-8 w-8 md:h-10 md:w-10"
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 md:h-5 md:w-5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => sliderRef.current?.slickNext()}
            aria-label="Diapositive suivante"
            type="button"
            className="flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none h-8 w-8 md:h-10 md:w-10"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 md:h-5 md:w-5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

export const query = `
  query Query($slides: [SlideInput], $autoplay: Boolean, $autoplaySpeed: Int, $arrows: Boolean, $dots: Boolean) {
    slideshowWidget(
      slides: $slides,
      autoplay: $autoplay,
      autoplaySpeed: $autoplaySpeed,
      arrows: $arrows,
      dots: $dots
    ) {
      slides {
        id
        image
        width
        height
        headline
        subText
        buttonText
        buttonLink
        buttonColor
      }
      autoplay
      autoplaySpeed
      arrows
      dots
    }
  }
`;

export const fragments = `
  fragment SlideData on Slide {
    id
    image
    width
    height
    headline
    subText
    buttonText
    buttonLink
    buttonColor
  }
`;

export const variables = `{
  slides: getWidgetSetting("slides"),
  autoplay: getWidgetSetting("autoplay"),
  autoplaySpeed: getWidgetSetting("autoplaySpeed"),
  arrows: getWidgetSetting("arrows"),
  dots: getWidgetSetting("dots")
}`;
