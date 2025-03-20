import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  return (
    <nav className="flex justify-between items-center px-6 py-4 relative">
      <div className="flex items-center font-semibold text-xl text-primary-purple">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#a78bfa" fillOpacity="0.2"/>
          <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" fill="#a78bfa"/>
        </svg>
        <span>Lime Dex</span>
      </div>
      
      <div className="hidden md:flex items-center gap-5">
        <Link href="#" className="px-3 py-2 font-medium hover:opacity-80">Trade</Link>
        <Link href="#" className="px-3 py-2 font-medium hover:opacity-80">Explore</Link>
        <Link href="#" className="px-3 py-2 font-medium hover:opacity-80">Pool</Link>
        
        <div className="relative ml-5">
          <input 
            type="text" 
            className="py-2.5 px-4 pl-10 rounded-2xl border border-border-color w-60 text-sm" 
            placeholder="Search tokens" 
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        {/* <Button variant="secondary" className="hidden md:block">Get the app</Button>
        <Button 
          variant="transparent" 
          className="flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
            <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor"/>
            <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor"/>
          </svg>
        </Button> */}
        <Button variant="primary">Connect</Button>
      </div>
    </nav>
  );
};

export default Navbar;