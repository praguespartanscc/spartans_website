'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TeamImage as TeamImageType } from '@/types/supabase';

const TeamImagesCarousel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Static images data
  const staticImages = useMemo<TeamImageType[]>(() => [
    { 
      id: 1, 
      title: 'Home Carousel 1', 
      image_url: '/home_carousel.jpeg', 
      alt_text: 'Prague Spartans team celebrating',
      created_at: new Date().toISOString()
    },
    { 
      id: 2, 
      title: 'Home Carousel 2', 
      image_url: '/home_carousel1.jpeg', 
      alt_text: 'Prague Spartans team group photo',
      created_at: new Date().toISOString()
    },
    { 
      id: 3, 
      title: 'Home Carousel 3', 
      image_url: '/home_carouse2.jpeg', 
      alt_text: 'Prague Spartans match action',
      created_at: new Date().toISOString()
    },
    { 
      id: 4, 
      title: 'Spartans Logo', 
      image_url: '/prague_spartans_home_logo.jpeg', 
      alt_text: 'Prague Spartans Logo',
      created_at: new Date().toISOString()
    },
    { 
      id: 5, 
      title: 'Spartan Team', 
      image_url: '/spartan_team.PNG', 
      alt_text: 'Spartans in Action',
      created_at: new Date().toISOString()
    }
  ], []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (staticImages.length <= 1) return;
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === staticImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, staticImages.length]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (staticImages.length <= 1) return;
    
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === staticImages.length - 1 ? 0 : prevIndex + 1
    );
    
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  const goToPrevious = useCallback(() => {
    if (staticImages.length <= 1) return;
    
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? staticImages.length - 1 : prevIndex - 1
    );
    
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  const goToSlide = useCallback((index: number) => {
    if (staticImages.length <= 1) return;
    
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  if (isLoading) {
    return (
      <div className="relative h-full w-full bg-[#1a3049]/50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Images */}
      {staticImages.map((image, index) => (
        <div 
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-80' : 'opacity-0'
          }`}
          aria-hidden={index !== currentIndex}
        >
          <Image
            src={image.image_url}
            alt={image.alt_text}
            fill
            priority={index === 0}
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 100vw"
          />
        </div>
      ))}
      
      {/* Overlay gradient - reducing opacity */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3049]/30 to-[#1a3049]/50 z-10"></div>
      
      {/* Only show navigation if we have more than one image */}
      {staticImages.length > 1 && (
        <>
          {/* Navigation buttons */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-2 sm:px-4 z-20">
            <button 
              onClick={goToPrevious}
              className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-1.5 sm:p-2 rounded-full transition-all hover:scale-110 cursor-pointer"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button 
              onClick={goToNext}
              className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-1.5 sm:p-2 rounded-full transition-all hover:scale-110 cursor-pointer"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          
          {/* Indicator dots */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 flex justify-center space-x-2 sm:space-x-3 z-20">
            {staticImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all cursor-pointer ${
                  index === currentIndex 
                    ? 'bg-[#f3c066] scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Current image caption */}
      <div className="absolute bottom-2 sm:bottom-4 inset-x-0 z-20 text-center">
        <span className="inline-block bg-black/30 text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
          {staticImages[currentIndex]?.alt_text || staticImages[currentIndex]?.title}
        </span>
      </div>
    </div>
  );
};

export default TeamImagesCarousel; 