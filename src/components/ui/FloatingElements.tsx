import React from 'react';

const FloatingElements: React.FC = () => {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 overflow-hidden -z-10">
        {/* Gradient background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-light-purple/50 blur-xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-purple/40 blur-xl" />
        {/* <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-purple/40 blur-xl" /> */}
        {/* <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-purple/40 blur-xl" /> */}
        
        {/* Floating tokens */}
        <div className="absolute top-1/5 left-1/6 w-16 h-16 bg-yellow-400/80 rounded-xl animate-float z-[-1]" />
        <div className="absolute bottom-1/5 right-1/6 w-16 h-16 bg-green-500/80 rounded-xl animate-float-reverse z-[-1]" />
      </div>
    </>
  );
};

export default FloatingElements;
