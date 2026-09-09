'use client';

import Image from 'next/image';
import { useState } from 'react';
import { A11y, FreeMode, Keyboard, Navigation, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import type { ProjectImage } from '@/types/content';

/** 作品縮圖輪播，最多 10 張（規格 §3.1、§6.4）。 */
export function ProjectGallery({ images, label }: { images: ProjectImage[]; label: string }) {
  const [thumbs, setThumbs] = useState<SwiperClass | null>(null);

  if (images.length === 0) return null;

  return (
    <section aria-label={label}>
      <Swiper
        modules={[Navigation, Thumbs, Keyboard, A11y]}
        navigation
        keyboard={{ enabled: true }}
        thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}
        spaceBetween={12}
        className="rounded-md"
      >
        {images.slice(0, 10).map((image) => (
          <SwiperSlide key={image.id}>
            <figure className="m-0">
              <div className="relative aspect-16/10 overflow-hidden rounded-md media-slot">
                <Image
                  src={image.url}
                  alt={image.alt ?? ''}
                  fill
                  sizes="(min-width: 768px) 760px, 100vw"
                  className="object-cover"
                />
              </div>
              {image.caption ? (
                <figcaption className="mt-2 text-[14px] text-ink-55">{image.caption}</figcaption>
              ) : null}
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 ? (
        <Swiper
          modules={[FreeMode, Thumbs, A11y]}
          onSwiper={setThumbs}
          freeMode
          watchSlidesProgress
          slidesPerView={4}
          spaceBetween={8}
          className="mt-2.5"
        >
          {images.slice(0, 10).map((image) => (
            <SwiperSlide key={`thumb-${image.id}`} className="cursor-pointer">
              <div className="relative aspect-16/10 overflow-hidden rounded-sm media-slot opacity-60 transition-opacity [.swiper-slide-thumb-active_&]:opacity-100">
                <Image
                  src={image.thumbnailUrl ?? image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </section>
  );
}
