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
      title: 'Prague Spartans Logo', 
      image_url: '/prague_spartans_home_logo.jpeg', 
      alt_text: 'Prague Spartans Logo',
      created_at: new Date().toISOString()
    },
    { 
      id: 2, 
      title: 'Spartans in Action', 
      image_url: '/spartan_team.PNG', 
      alt_text: 'Spartans in Action',
      created_at: new Date().toISOString()
    },
    { 
      id: 3, 
      title: 'Team Photo', 
      image_url: '/prague_spartans_home_logo.jpeg', 
      alt_text: 'Team Photo',
      created_at: new Date().toISOString()
    },
    { 
      id: 4, 
      title: 'Match Day', 
      image_url: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg', 
      alt_text: 'Match Day',
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
    if (staticImages.length <= 1) return; // No need to rotate with only one image
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === staticImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, staticImages.length]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (staticImages.length <= 1) return; // Do nothing if we only have one image
    
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex((prevIndex) => 
      prevIndex === staticImages.length - 1 ? 0 : prevIndex + 1
    );
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  const goToPrevious = useCallback(() => {
    if (staticImages.length <= 1) return; // Do nothing if we only have one image
    
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? staticImages.length - 1 : prevIndex - 1
    );
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  const goToSlide = useCallback((index: number) => {
    if (staticImages.length <= 1) return; // Do nothing if we only have one image
    
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex(index);
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [staticImages.length]);

  if (isLoading) {
    return (
      <div className="relative h-full w-full bg-[#1a3049]/50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
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
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      ))}
      
      {/* Overlay gradient - reducing opacity */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3049]/30 to-[#1a3049]/50 z-10"></div>
      
      {/* Only show navigation if we have more than one image */}
      {staticImages.length > 1 && (
        <>
          {/* Navigation buttons */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-4 z-20">
            <button 
              onClick={goToPrevious}
              className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-2 rounded-full transition-all hover:scale-110 cursor-pointer"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button 
              onClick={goToNext}
              className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-2 rounded-full transition-all hover:scale-110 cursor-pointer"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          
          {/* Indicator dots */}
          <div className="absolute bottom-6 inset-x-0 flex justify-center space-x-3 z-20">
            {staticImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
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
      <div className="absolute bottom-16 inset-x-0 z-20 text-center">
        <span className="inline-block bg-black/30 text-white text-sm py-1 px-3 rounded-full">
          {staticImages[currentIndex]?.alt_text || staticImages[currentIndex]?.title}
        </span>
      </div>
    </div>
  );
};

export default TeamImagesCarousel; 