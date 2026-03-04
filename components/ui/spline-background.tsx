"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const Spline = dynamic(() => import('@splinetool/react-spline'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-transparent" />
});

export default function SplineBackground() {
  return (
    <motion.div 
      className="absolute inset-0 w-full h-full object-cover -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <Spline scene="/assets/glass_dashboard.spline" />
      {/* Optional overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </motion.div>
  );
}
