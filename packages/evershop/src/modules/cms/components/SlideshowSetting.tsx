/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { FileBrowser } from '@components/admin/FileBrowser.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import { Checkbox } from '@components/common/ui/Checkbox.js';
import { Input } from '@components/common/ui/Input.js';
import { Item, ItemContent, ItemTitle } from '@components/common/ui/Item.js';
import { Label } from '@components/common/ui/Label.js';
import React, { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

/* ── Fixed slideshow dimensions ────────────────────────────── */
const REQUIRED_WIDTH = 2400;
const REQUIRED_HEIGHT = 1200;

interface SlideData {
  id: string;
  image: string;
  width?: number;
  height?: number;
  headline: string;
  subText: string;
  buttonText: string;
  buttonLink: string;
  buttonColor: string;
}

interface SlideshowSettingProps {
  slideshowWidget?: {
    slides?: SlideData[];
    autoplay?: boolean;
    autoplaySpeed?: number;
    arrows?: boolean;
    dots?: boolean;
    fullWidth?: boolean;
    widthValue?: number;
    heightValue?: number;
    heightType?: 'auto' | 'fixed' | 'full';
  };
}

export default function SlideshowSetting({
  slideshowWidget
}: SlideshowSettingProps) {
  const {
    slides = [],
    autoplay = true,
    autoplaySpeed = 3000,
    arrows = true,
    dots = true,
    fullWidth = true
  } = slideshowWidget || {};

  const { control, setValue, watch } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'settings.slides'
  });

  const currentSlides = watch('settings.slides', slides);
  const currentAutoplay = watch('settings.autoplay', autoplay);
  const currentAutoplaySpeed = watch('settings.autoplaySpeed', autoplaySpeed);
  const currentArrows = watch('settings.arrows', arrows);
  const currentDots = watch('settings.dots', dots);
  const currentFullWidth = watch('settings.fullWidth', fullWidth);

  useEffect(() => {
    // Initialize slides with existing data
    setValue('settings.slides', currentSlides?.length ? currentSlides : []);

    // Initialize the autoplay settings
    const handleAutoplay =
      currentAutoplay === undefined || currentAutoplay === null
        ? autoplay
        : Boolean(currentAutoplay);
    setValue('settings.autoplay', handleAutoplay);

    // Initialize the autoplay speed
    const speed = Number(currentAutoplaySpeed) || Number(autoplaySpeed) || 3000;
    setValue('settings.autoplaySpeed', speed);

    // Initialize the arrows setting
    const handleArrows =
      currentArrows === undefined || currentArrows === null
        ? arrows
        : Boolean(currentArrows);
    setValue('settings.arrows', handleArrows);

    // Initialize the dots setting
    const handleDots =
      currentDots === undefined || currentDots === null
        ? dots
        : Boolean(currentDots);
    setValue('settings.dots', handleDots);

    // Initialize the fullWidth setting
    const handleFullWidth =
      currentFullWidth === undefined || currentFullWidth === null
        ? fullWidth
        : Boolean(currentFullWidth);
    setValue('settings.fullWidth', handleFullWidth);

    // Always use adaptive height for the slideshow
    setValue('settings.heightType', 'auto');

    // Process all slides to detect image dimensions if they don't have them yet
    if (currentSlides?.length) {
      currentSlides.forEach((slide, index) => {
        if (slide.image && (!slide.width || !slide.height)) {
          getImageDimensions(slide.image, index);
        }
      });
    }
  }, []);

  const [activeSlideIndex, setActiveSlideIndex] = React.useState<number | null>(
    null
  );
  const [openFileBrowser, setOpenFileBrowser] = React.useState(false);

  // Function to get image dimensions
  const getImageDimensions = (imageUrl: string, slideIndex: number) => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Update the current slides with the new dimensions
      const newSlides = [...currentSlides];
      newSlides[slideIndex] = {
        ...newSlides[slideIndex],
        width,
        height
      };
      setValue('settings.slides', newSlides);
    };
    img.src = imageUrl;
  };

  // Check if dimensions match the required 2400×1200
  const isDimensionMatch = (w?: number, h?: number): boolean => {
    if (!w || !h) return false;
    return w === REQUIRED_WIDTH && h === REQUIRED_HEIGHT;
  };

  const handleImageSelect = (image: string) => {
    if (activeSlideIndex !== null) {
      setValue(`settings.slides.${activeSlideIndex}.image`, image);

      // Detect image dimensions when a new image is selected
      getImageDimensions(image, activeSlideIndex);
      setOpenFileBrowser(false);
    }
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: uuidv4(),
      image: '',
      width: 0,
      height: 0,
      headline: '',
      subText: '',
      buttonText: '',
      buttonLink: '',
      buttonColor: '#3B82F6'
    };
    append(newSlide);

    setTimeout(() => {
      setActiveSlideIndex(fields.length);
    }, 50);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
      setActiveSlideIndex(index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
      setActiveSlideIndex(index + 1);
    }
  };

  return (
    <div className="slideshow-widget">
      {openFileBrowser && (
        <div className="max-h-96">
          <FileBrowser
            isMultiple={false}
            onInsert={handleImageSelect}
            close={() => setOpenFileBrowser(false)}
          />
        </div>
      )}

      <Item variant={'outline'}>
        <ItemContent>
          <ItemTitle>Paramètres du diaporama</ItemTitle>

          {/* Dimension notice */}
          <div className="mt-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              📐 Dimensions requises : {REQUIRED_WIDTH} × {REQUIRED_HEIGHT} pixels (ratio 2:1)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Les images qui ne correspondent pas à ces dimensions seront automatiquement redimensionnées et recadrées pour s'adapter.
            </p>
          </div>

          <div className="space-y-2 mt-3">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <div className="flex items-center mb-4">
                <Checkbox
                  id="arrows"
                  checked={Boolean(currentArrows)}
                  onCheckedChange={(checked) => {
                    setValue('settings.arrows', checked);
                  }}
                  className="mr-2 h-4 w-4"
                />
                <Label htmlFor="arrows">Afficher les flèches de navigation</Label>
              </div>
              <div className="flex justify-start items-center">
                <Checkbox
                  id="autoplay"
                  checked={Boolean(currentAutoplay)}
                  onCheckedChange={(checked) => {
                    setValue('settings.autoplay', checked);
                  }}
                  className="mr-2 h-4 w-4"
                />
                <Label htmlFor="autoplay" className="text-sm">
                  Lecture automatique
                </Label>
              </div>

              {Boolean(currentAutoplay) && (
                <InputField
                  type="number"
                  label="Vitesse de lecture auto (ms)"
                  name="settings.autoplaySpeed"
                  defaultValue={Number(autoplaySpeed) || 3000}
                  placeholder="ex. 3000 pour 3 secondes"
                  validation={{
                    min: { value: 1000, message: 'La vitesse minimale est 1000 ms' }
                  }}
                />
              )}
            </div>

            <div className="col-span-2 md:col-span-1">
            </div>
          </div>
        </ItemContent>
      </Item>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium">Diapositives</h2>
          <Button onClick={addSlide} variant={'outline'}>
            Ajouter une diapositive
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {fields.map((slide, index) => {
              const slideW = currentSlides[index]?.width;
              const slideH = currentSlides[index]?.height;
              const match = isDimensionMatch(slideW, slideH);
              const hasImage = !!currentSlides[index]?.image;
              const hasDims = slideW && slideH;

              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideIndex(index)}
                  className={`relative border rounded overflow-hidden cursor-pointer ${
                    activeSlideIndex === index ? 'ring-2 ring-blue-500' : ''
                  } ${hasImage && hasDims && !match ? 'border-amber-400' : 'border-border'}`}
                >
                  <div className="aspect-[2/1] bg-gray-100 flex items-center justify-center">
                    {currentSlides[index]?.image ? (
                      <img
                        src={currentSlides[index].image}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">Pas d'image</div>
                    )}
                  </div>
                  {/* Dimension warning badge */}
                  {hasImage && hasDims && !match && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Redimensionnée
                    </div>
                  )}
                  <div className="p-2 bg-white border-t border-border">
                    <p className="text-sm font-medium truncate">
                      {currentSlides[index]?.headline || `Slide ${index + 1}`}
                    </p>
                    <div className="flex mt-2">
                      <Button
                        variant={'outline'}
                        size={'sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveUp(index);
                        }}
                        disabled={index === 0}
                        className={`mr-1 p-1`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        size={'sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDown(index);
                        }}
                        disabled={index === fields.length - 1}
                        className={`mr-1 p-1`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </Button>
                      <Button
                        variant="destructive"
                        size={'sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(index);
                          if (activeSlideIndex === index) {
                            setActiveSlideIndex(null);
                          } else if (
                            activeSlideIndex !== null &&
                            activeSlideIndex > index
                          ) {
                            setActiveSlideIndex(activeSlideIndex - 1);
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <p className="text-gray-500 mb-4">Aucune diapositive n'a encore été ajoutée.</p>
            <Button variant="outline" onClick={addSlide}>
              Ajouter votre première diapositive
            </Button>
          </div>
        )}
      </div>

      {activeSlideIndex !== null && fields[activeSlideIndex] && (
        <div className="bg-white p-4 rounded border border-border">
          <h3 className="text-sm font-normal mb-4">
            Modifier la diapositive {activeSlideIndex + 1}
          </h3>
          <div className="mb-2 border border-border rounded overflow-hidden">
            <div className="aspect-[2/1] bg-gray-100 relative">
              {currentSlides[activeSlideIndex]?.image ? (
                <div className="relative w-full h-full">
                  <img
                    src={currentSlides[activeSlideIndex].image}
                    alt={`Slide ${activeSlideIndex + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        if (
                          !currentSlides[activeSlideIndex]?.width ||
                          !currentSlides[activeSlideIndex]?.height
                        ) {
                          const newSlides = [...currentSlides];
                          newSlides[activeSlideIndex] = {
                            ...newSlides[activeSlideIndex],
                            width: img.naturalWidth,
                            height: img.naturalHeight
                          };
                          setValue('settings.slides', newSlides);
                        }
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {currentSlides[activeSlideIndex]?.headline && (
                      <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
                        {currentSlides[activeSlideIndex].headline}
                      </h3>
                    )}
                    {currentSlides[activeSlideIndex]?.subText && (
                      <p className="text-white mb-4">
                        {currentSlides[activeSlideIndex].subText}
                      </p>
                    )}
                    {currentSlides[activeSlideIndex]?.buttonText && (
                      <button
                        type="button"
                        className="px-4 py-2 rounded"
                        style={{
                          backgroundColor:
                            currentSlides[activeSlideIndex].buttonColor ||
                            '#3B82F6'
                        }}
                      >
                        {currentSlides[activeSlideIndex].buttonText}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setOpenFileBrowser(true)}
                  >
                    Sélectionner une image
                  </Button>
                </div>
              )}

              {currentSlides[activeSlideIndex]?.image && (
                <Button
                  variant="outline"
                  onClick={() => setOpenFileBrowser(true)}
                  className="absolute bottom-2 right-2"
                >
                  Changer l'image
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="hidden"
              name={`settings.slides.${activeSlideIndex}.image`}
              value={
                (currentSlides && currentSlides[activeSlideIndex]?.image) || ''
              }
            />

            <input
              type="hidden"
              name={`settings.slides.${activeSlideIndex}.id`}
              value={
                (currentSlides && currentSlides[activeSlideIndex]?.id) ||
                uuidv4()
              }
            />

            {/* Hidden fields for image dimensions */}
            <input
              type="hidden"
              name={`settings.slides.${activeSlideIndex}.width`}
              value={currentSlides[activeSlideIndex]?.width || 0}
            />

            <input
              type="hidden"
              name={`settings.slides.${activeSlideIndex}.height`}
              value={currentSlides[activeSlideIndex]?.height || 0}
            />

            {/* Display image dimensions and warn if not matching */}
            {currentSlides[activeSlideIndex]?.image && (
              <div className="md:col-span-2 mb-2">
                {currentSlides[activeSlideIndex]?.width &&
                currentSlides[activeSlideIndex]?.height ? (
                  <div>
                    <div className="text-sm text-gray-500">
                      <p>
                        Image dimensions : {currentSlides[activeSlideIndex].width}{' '}
                        × {currentSlides[activeSlideIndex].height} pixels
                      </p>
                    </div>
                    {!isDimensionMatch(
                      currentSlides[activeSlideIndex].width,
                      currentSlides[activeSlideIndex].height
                    ) && (
                      <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                        ⚠️ Cette image ne fait pas {REQUIRED_WIDTH} × {REQUIRED_HEIGHT} px.
                        Elle sera automatiquement redimensionnée et recadrée (cover) pour s'adapter au format {REQUIRED_WIDTH} × {REQUIRED_HEIGHT}.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>Détection des dimensions de l'image...</p>
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block mb-1 text-sm">Titre</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                name={`settings.slides.${activeSlideIndex}.headline`}
                value={currentSlides[activeSlideIndex]?.headline || ''}
                onChange={(e) => {
                  const newSlides = [...currentSlides];
                  newSlides[activeSlideIndex] = {
                    ...newSlides[activeSlideIndex],
                    headline: e.target.value
                  };
                  setValue('settings.slides', newSlides);
                }}
                placeholder="ex. Nouvelle collection disponible"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 text-sm">Sous-texte</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                name={`settings.slides.${activeSlideIndex}.subText`}
                value={currentSlides[activeSlideIndex]?.subText || ''}
                onChange={(e) => {
                  const newSlides = [...currentSlides];
                  newSlides[activeSlideIndex] = {
                    ...newSlides[activeSlideIndex],
                    subText: e.target.value
                  };
                  setValue('settings.slides', newSlides);
                }}
                placeholder="ex. Découvrez nos derniers produits avec des réductions spéciales"
                rows={3}
              ></textarea>
            </div>

            <div>
              <label className="block mb-1 text-sm">Texte du bouton</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                name={`settings.slides.${activeSlideIndex}.buttonText`}
                value={currentSlides[activeSlideIndex]?.buttonText || ''}
                onChange={(e) => {
                  const newSlides = [...currentSlides];
                  newSlides[activeSlideIndex] = {
                    ...newSlides[activeSlideIndex],
                    buttonText: e.target.value
                  };
                  setValue('settings.slides', newSlides);
                }}
                placeholder="ex. Acheter maintenant"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Lien du bouton</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                name={`settings.slides.${activeSlideIndex}.buttonLink`}
                value={currentSlides[activeSlideIndex]?.buttonLink || ''}
                onChange={(e) => {
                  const newSlides = [...currentSlides];
                  newSlides[activeSlideIndex] = {
                    ...newSlides[activeSlideIndex],
                    buttonLink: e.target.value
                  };
                  setValue('settings.slides', newSlides);
                }}
                placeholder="ex. /category/new-arrivals"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Couleur du bouton</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={
                    currentSlides[activeSlideIndex]?.buttonColor || '#3B82F6'
                  }
                  onChange={(e) => {
                    const newSlides = [...currentSlides];
                    newSlides[activeSlideIndex] = {
                      ...newSlides[activeSlideIndex],
                      buttonColor: e.target.value
                    };
                    setValue('settings.slides', newSlides);
                  }}
                  className="w-10 h-10 rounded border-border mr-2 cursor-pointer"
                />
                <Input
                  type="text"
                  value={
                    currentSlides[activeSlideIndex]?.buttonColor || '#3B82F6'
                  }
                  onChange={(e) => {
                    const newSlides = [...currentSlides];
                    newSlides[activeSlideIndex] = {
                      ...newSlides[activeSlideIndex],
                      buttonColor: e.target.value
                    };
                    setValue('settings.slides', newSlides);
                  }}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
        </div>
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
      dots: $dots,
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
  dots: getWidgetSetting("dots"),
}`;
