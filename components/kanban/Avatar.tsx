import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

export default function Avatar({ src, name, className = '' }: AvatarProps) {
  if (src && src.trim() !== '') {
    return <img src={src} alt={name || 'User'} className={className} draggable={false} referrerPolicy="no-referrer" />;
  }

  // Handle initials
  const initials = name
    ? name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div
      className={`bg-blue-600 font-bold text-white flex items-center justify-center shrink-0 ${className} text-xs`}
      title={name}
      suppressHydrationWarning
    >
      {initials}
    </div>
  );
}
