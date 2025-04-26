'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

type TeamImage = {
  src: string;
  alt: string;
};

const TeamImagesCarousel = () => {
  // Add all your team images here
  const teamImages: TeamImage[] = [
    { src: '/prague_spartans_home_logo.jpeg', alt: 'Prague Spartans Logo' },
    { src: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg', alt: 'Spartans in Action' },
    { src: '/prague_spartans_home_logo.jpeg', alt: 'Team Photo' },
    { src: '/WhatsApp Image 2025-04-24 at 14.31.05.jpeg', alt: 'Match Day' },
    // In a real implementation, you would add more actual team images here
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === teamImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, teamImages.length]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex((prevIndex) => 
      prevIndex === teamImages.length - 1 ? 0 : prevIndex + 1
    );
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [teamImages.length]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? teamImages.length - 1 : prevIndex - 1
    );
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [teamImages.length]);

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlaying(false); // Pause auto-playing when manually navigating
    setCurrentIndex(index);
    
    // Resume auto-playing after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Images */}
      {teamImages.map((image, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-30' : 'opacity-0'
          }`}
          aria-hidden={index !== currentIndex}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      ))}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a3049]/70 to-[#1a3049]/90 z-10"></div>
      
      {/* Navigation buttons */}
      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-4 z-20">
        <button 
          onClick={goToPrevious}
          className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-2 rounded-full transition-all hover:scale-110"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button 
          onClick={goToNext}
          className="bg-[#1a3049]/50 hover:bg-[#1a3049]/70 text-white p-2 rounded-full transition-all hover:scale-110"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Indicator dots */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center space-x-3 z-20">
        {teamImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-[#f3c066] scale-125' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>
      
      {/* Current image caption - optional */}
      <div className="absolute bottom-16 inset-x-0 z-20 text-center">
        <span className="inline-block bg-black/30 text-white text-sm py-1 px-3 rounded-full">
          {teamImages[currentIndex].alt}
        </span>
      </div>
    </div>
  );
};

export default TeamImagesCarousel; 