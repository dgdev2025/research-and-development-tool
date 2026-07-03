"use client";

import { useCallback, useEffect, useState } from "react";

export interface SliderImage {
  url: string;
  label: string;
}

interface ImageSliderModalProps {
  images: SliderImage[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageSliderModal({
  images,
  initialIndex = 0,
  onClose,
}: ImageSliderModalProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, images]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((current) => (current < images.length - 1 ? current + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [goNext, goPrev, onClose]);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <div className="image-slider-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="image-slider-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-slider-header">
          <span className="image-slider-title">{current.label}</span>
          <span className="image-slider-count">
            {index + 1} / {images.length}
          </span>
          <button type="button" className="image-slider-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="image-slider-body">
          {images.length > 1 && (
            <button
              type="button"
              className="image-slider-nav image-slider-prev"
              onClick={goPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <img src={current.url} alt={current.label} className="image-slider-image" />

          {images.length > 1 && (
            <button
              type="button"
              className="image-slider-nav image-slider-next"
              onClick={goNext}
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="image-slider-dots">
            {images.map((image, dotIndex) => (
              <button
                key={`${image.url}-${dotIndex}`}
                type="button"
                className={`image-slider-dot${dotIndex === index ? " active" : ""}`}
                onClick={() => setIndex(dotIndex)}
                aria-label={`View ${image.label}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
