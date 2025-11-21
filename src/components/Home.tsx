import React, { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';

// --- 1. CONNECT TO THE NEW JAVA PLUGIN ---
interface InstalledAppsPlugin {
  getApps(): Promise<{ apps: AppItem[] }>;
  launchApp(options: { packageName: string }): Promise<void>;
  requestDefaultLauncher(): Promise<void>;
}
const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

interface AppItem {
  label: string;
  packageName: string;
  icon: string; // Now a file path, not a massive Base64 string!
}

// --- 2. ICONS & ASSETS ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Home: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for Drawer
  const [pressedApp, setPressedApp] = useState<string | null>(null);

  // Load apps once on startup
  useEffect(() => {
    const load = async () => {
      const result = await InstalledApps.getApps();
      setApps(result.apps);
    };
    load();
  }, []);

  const handleAppClick = async (packageName: string) => {
    setPressedApp(packageName);
    setTimeout(async () => {
      await InstalledApps.launchApp({ packageName });
      setPressedApp(null);
    }, 150);
  };

  const handleSetDefault = async () => {
    await InstalledApps.requestDefaultLauncher();
  };

  // Filter apps for search
  const filteredApps = apps.filter(app => 
    app.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none bg-black text-white">
      
      {/* WALLPAPER (Fixed Background) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transform scale-105"
        style={{ backgroundImage: 'url("https://picsum.photos/1080/1920?blur=2")' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* --- VIEW 1: THE HOME SCREEN (Clock & Date) --- */}
      <div 
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-500 ease-out
        ${isDrawerOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
        onClick={() => setIsDrawerOpen(true)} // Clicking anywhere opens drawer
      >
        <div className="flex flex-col items-center mb-20">
          <h1 className="text-8xl font-thin tracking-tighter drop-shadow-2xl">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h1>
          <p className="text-2xl font-light opacity-90 tracking-widest uppercase mt-2">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* The "Set Default" Button (Only visible on Home) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleSetDefault(); }}
          className="mt-10 px-8 py-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20 active:bg-white/20 transition-all shadow-xl text-sm font-medium tracking-wider"
        >
          SET AS DEFAULT LAUNCHER
        </button>
        
        <div className="absolute bottom-12 opacity-60 animate-bounce text-sm tracking-widest">
          SWIPE UP TO OPEN
        </div>
      </div>

      {/* --- VIEW 2: THE APP DRAWER --- */}
      <div 
        className={`absolute inset-0 z-20 bg-black/60 backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col
        ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Close Handle */}
        <div 
          className="w-full h-12 flex justify-center items-center shrink-0 cursor-pointer"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div className="w-16 h-1.5 bg-white/30 rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="px-6 mb-4 shrink-0">
           <div className="w-full h-14 bg-white/10 rounded-2xl flex items-center px-4 gap-3 border border-white/10">
              <SearchIcon />
              <input 
                type="text" 
                placeholder="Search apps..." 
                className="w-full bg-transparent outline-none text-lg placeholder-white/40 h-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
            <div className="grid grid-cols-4 gap-y-8 gap-x-2">
              {filteredApps.map((app) => (
                <div 
                  key={app.packageName}
                  className={`flex flex-col items-center gap-3 transition-all duration-200
                    ${pressedApp === app.packageName ? 'scale-90 opacity-70' : ''}
                  `}
                  onClick={() => handleAppClick(app.packageName)}
                >
                  {/* App Icon - Now using standard <img> because Java sends a file path! */}
                  <div className="w-[62px] h-[62px] bg-white rounded-2xl p-0.5 shadow-lg overflow-hidden">
                     <img 
                       src={app.icon} 
                       alt={app.label}
                       loading="lazy"
                       className="w-full h-full object-cover rounded-[14px]"
                     />
                  </div>
                  
                  <span className="text-[11px] font-medium text-center text-white/90 truncate w-full px-1 leading-tight">
                    {app.label}
                  </span>
                </div>
              ))}
            </div>
        </div>
      </div>

    </div>
  );
};

export default Home;