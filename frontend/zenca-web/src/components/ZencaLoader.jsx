import React from 'react';

export default function ZencaLoader({ size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? 'h-screen w-screen' : 'h-64 w-full'}`}
    >
      <div className="flex flex-col items-center">
        <span
          className={`${sizeClass} font-extrabold tracking-wider text-black dark:text-white animate-pulse`}
          style={{ letterSpacing: '0.15em' }}
        >
          ZENCA
        </span>
        <span className="mt-2 text-sm text-gray-400 dark:text-gray-500 animate-pulse delay-150">
          Loading...
        </span>
      </div>
    </div>
  );
}