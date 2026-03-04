"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ImageConfig {
  src: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  useBlur?: boolean;
  aspectRatio?: string;
}

interface RevealTextProps {
  text?: string;
  textColor?: string;
  overlayColor?: string;
  fontSize?: string;
  letterDelay?: number;
  overlayDelay?: number;
  overlayDuration?: number;
  springDuration?: number;
  letterImages?: (string | ImageConfig)[];
}

export function RevealText({
  text = "STUNNING",
  textColor = "text-white",
  overlayColor = "text-blue-900",
  fontSize = "text-[250px]",
  letterDelay = 0.08,
  overlayDelay = 0.05,
  overlayDuration = 0.4,
  springDuration = 600,
  letterImages = []
}: RevealTextProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showRedText, setShowRedText] = useState(false);
  
  useEffect(() => {
    // Calculate when the last letter animation completes
    // Last letter starts at (text.length - 1) * letterDelay seconds
    // Add springDuration for the spring animation to settle
    const lastLetterDelay = (text.length - 1) * letterDelay;
    const totalDelay = (lastLetterDelay * 1000) + springDuration;
    
    const timer = setTimeout(() => {
      setShowRedText(true);
    }, totalDelay);
    
    return () => clearTimeout(timer);
  }, [text.length, letterDelay, springDuration]);

  return (
    <div className="flex items-center justify-center relative">
      <div className="flex">
        {text.split("").map((letter, index) => {
          const hasImages = letterImages && letterImages.length > 0;
          const imgConfig = hasImages ? letterImages[index % letterImages.length] : undefined;
          const imgSrc = imgConfig ? (typeof imgConfig === 'string' ? imgConfig : imgConfig.src) : "";
          const bgSize = imgConfig && typeof imgConfig === 'object' && imgConfig.backgroundSize ? imgConfig.backgroundSize : "contain";
          const bgPos = imgConfig && typeof imgConfig === 'object' && imgConfig.backgroundPosition ? imgConfig.backgroundPosition : "center center";
          const useBlur = imgConfig && typeof imgConfig === 'object' && imgConfig.useBlur;
          const aspectRatio = imgConfig && typeof imgConfig === 'object' && imgConfig.aspectRatio ? imgConfig.aspectRatio : undefined;

          return (
            <motion.span
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`${fontSize} font-black tracking-tight cursor-pointer relative overflow-hidden pointer-events-auto`}
              style={{ aspectRatio }} // Apply Aspect Ratio if defined
              initial={{ 
                scale: 0,
                opacity: 0,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              transition={{
                delay: index * letterDelay,
                type: "spring",
                damping: 8,
                stiffness: 200,
                mass: 0.8,
              }}
            >
              {/* Base text layer */}
              <span className="opacity-0">{letter}</span>
              <motion.span 
                className={`absolute inset-0 ${textColor} z-10`}
                animate={{ 
                  opacity: hoveredIndex === index ? 0 : 1 
                }}
                transition={{ duration: 0.1 }}
              >
                {letter}
              </motion.span>

               {/* Optional Blur Background Layer (for filling gaps) */}
               {useBlur && (
                <motion.span
                  className="text-transparent bg-clip-text bg-cover bg-no-repeat absolute inset-0"
                  style={{
                    backgroundImage: `url('${imgSrc}')`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    filter: "blur(4px)", // Blur to hide borders
                    transform: "scale(1.2)", // Scale up to prevent blurred edges from showing
                    opacity: 0.7, // Slightly dimmed to let foreground pop
                  }}
                  animate={{ 
                    opacity: hoveredIndex === index ? 0.7 : 0,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {letter}
                </motion.span>
              )}

              {/* Main Subject Image */}
              <motion.span
                className="text-transparent bg-clip-text bg-cover bg-no-repeat absolute inset-0 z-10" // z-10 to stay above blur
                style={{
                  backgroundImage: `url('${imgSrc}')`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: bgSize,
                }}
                initial={{
                  backgroundPosition: bgPos, 
                }}
                animate={{ 
                  opacity: hoveredIndex === index ? 1 : 0,
                  scale: hoveredIndex === index ? 1.05 : 1, 
                }}
                transition={{ 
                  opacity: { duration: 0.1 },
                  scale: { duration: 0.3 }
                }}
              >
                {letter}
              </motion.span>
              
              {/* Overlay text layer that sweeps across each letter */}
              {showRedText && (
                <motion.span
                  className={`absolute inset-0 ${overlayColor} pointer-events-none z-20`}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    delay: index * overlayDelay,
                    duration: overlayDuration,
                    times: [0, 0.1, 0.7, 1],
                    ease: "easeInOut"
                  }}
                >
                  {letter}
                </motion.span>
              )}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
