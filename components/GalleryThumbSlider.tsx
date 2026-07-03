"use client";

import { useRef } from "react";
import type { SliderImage } from "./ImageSliderModal";

interface GalleryThumbSliderProps {
  images: SliderImage[];
  onImageClick: (index: number) => void;
}

export function GalleryThumbSlider({
  images,
  onImageClick,
}: GalleryThumbSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = direction === "left" ? -200 : 200;
    track.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="gallery-thumb-slider-wrap">
      {images.length > 3 && (
        <button
          type="button"
          className="gallery-thumb-nav gallery-thumb-nav-prev"
          onClick={() => scroll("left")}
          aria-label="Scroll thumbnails left"
        >
          ‹
        </button>
      )}

      <div ref={trackRef} className="gallery-thumb-slider">
        {images.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            type="button"
            className="gallery-thumb-item"
            onClick={() => onImageClick(index)}
            aria-label={`Open ${image.label}`}
          >
            <div className="gallery-thumb-frame">
              <img src={image.url} alt={image.label} />
              <span className="gallery-thumb-label">{image.label}</span>
            </div>
          </button>
        ))}
      </div>

      {images.length > 3 && (
        <button
          type="button"
          className="gallery-thumb-nav gallery-thumb-nav-next"
          onClick={() => scroll("right")}
          aria-label="Scroll thumbnails right"
        >
          ›
        </button>
      )}
    </div>
  );
}
