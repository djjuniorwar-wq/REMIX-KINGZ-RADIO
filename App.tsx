import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Share2, Calendar, Users, 
  Image as ImageIcon, Radio, Clock, 
  Instagram, Facebook, Settings, X, LogIn, ExternalLink, SkipBack, SkipForward, Shuffle, Music,
  MessageSquare, Send, Crown, Mail, Key, ShieldCheck, Twitter, Youtube, CheckCircle2, UserPlus,
  LayoutDashboard, Megaphone, List, Trash2, Palette, Type, Monitor
} from 'lucide-react';
import { fetchNowPlaying } from './services/azuracast';
import { AzuraCastNowPlaying, DJ, EventListing, GalleryItem, ChatMessage } from './types';
import { STATION_NAME as DEFAULT_NAME, STATION_LOGO as DEFAULT_LOGO, DJS as DEFAULT_DJS, EVENTS as DEFAULT_EVENTS, GALLERY as DEFAULT_GALLERY, INITIAL_CHAT, STATION_SOCIALS } from './constants';

interface UserAccount {
  email: string;
  pass: string;
  name: string;
  isVerified: boolean;
  onMailingList: boolean;
  joinedAt: number;
}

const App: React.FC = () => {
  // --- Security & Admin State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState(() => localStorage.getItem('kingz_admin_pass') || 'KINGZ_ADMIN_2024');

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; isVerified: boolean } | null>(() => {
    const saved = localStorage.getItem('kingz_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('kingz_accounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [mailingList, setMailingList] = useState<string[]>(() => {
    const saved = localStorage.getItem('kingz_mailing_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [resetEmail, setResetEmail] = useState('');
  const [resetType, setResetType] = useState<'listener' | 'dj'>('listener');
  const [isResetLinkSent, setIsResetLinkSent] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // --- Station & DJ State ---
  const [loggedInDJ, setLoggedInDJ] = useState<DJ | null>(null);
  const [stationName, setStationName] = useState(() => localStorage.getItem('station_name') || DEFAULT_NAME);
  const [stationLogo, setStationLogo] = useState(() => localStorage.getItem('station_logo') || DEFAULT_LOGO);
  
  const [bgConfig, setBgConfig] = useState(() => {
    const saved = localStorage.getItem('bg_config');
    const defaultImg = "https://www.dropbox.com/scl/fi/whatsapp-image-2025-12-27.jpeg?rlkey=hidden&raw=1";
    // We attempt to fix the dropbox preview link to a raw link if the user provides the preview one.
    const userProvidedUrl = "https://www.dropbox.com/preview/DREAM%20TEAM%20PRODUCTION/WhatsApp%20Image%202025-12-27%20at%206.23.15%20PM.jpeg?context=file_uploader_preview_file&role=personal";
    // Replacing dropbox.com with dl.dropboxusercontent.com and removing query params or adding raw=1 is the standard way to get the direct image.
    const rawUrl = userProvidedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').split('?')[0] + '?raw=1';

    return saved ? JSON.parse(saved) : { 
      type: 'image', 
      value: rawUrl, 
      brightness: 0.25
    };
  });
  
  const [localDjs, setLocalDjs] = useState<DJ[]>(() => JSON.parse(localStorage.getItem('custom_djs') || JSON.stringify(DEFAULT_DJS)));
  const [localEvents, setLocalEvents] = useState<EventListing[]>(() => JSON.parse(localStorage.getItem('custom_events') || JSON.stringify(DEFAULT_EVENTS)));
  const [localGallery, setLocalGallery] = useState<GalleryItem[]>(() => JSON.parse(localStorage.getItem('custom_gallery') || JSON.stringify(DEFAULT_GALLERY)));

  // --- Chat State ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kingz_chat');
    return saved ? JSON.parse(saved) : INITIAL_CHAT;
  });
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- UI & Player State ---
  const [nowPlaying, setNowPlaying] = useState<AzuraCastNowPlaying | null>(null);
  const [localElapsed, setLocalElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'djs' | 'events' | 'chat'>('home');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLogoDropdown, setShowLogoDropdown] = useState(false);
  const [showDJLogin, setShowDJLogin] = useState(false);
  const [selectedDJProfile, setSelectedDJProfile] = useState<DJ | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'mailing' | 'blast' | 'station'>('users');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('kingz_session', JSON.stringify(currentUser));
    localStorage.setItem('kingz_accounts', JSON.stringify(registeredUsers));
    localStorage.setItem('kingz_mailing_list', JSON.stringify(mailingList));
    localStorage.setItem('kingz_admin_pass', adminPasscode);
    localStorage.setItem('station_name', stationName);
    localStorage.setItem('station_logo', stationLogo);
    localStorage.setItem('bg_config', JSON.stringify(bgConfig));
    localStorage.setItem('custom_djs', JSON.stringify(localDjs));
    localStorage.setItem('custom_events', JSON.stringify(localEvents));
    localStorage.setItem('custom_gallery', JSON.stringify(localGallery));
    localStorage.setItem('kingz_chat', JSON.stringify(chatMessages));
  }, [currentUser, registeredUsers, mailingList, adminPasscode, stationName, stationLogo, bgConfig, localDjs, localEvents, localGallery, chatMessages]);

  // Scroll Chat to Bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Handle Outside Clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowLogoDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll Stream Data
  useEffect(() => {
    if (!currentUser || !currentUser.isVerified) return; 
    const updateData = async () => {
      const data = await fetchNowPlaying();
      if (data) {
        setNowPlaying(data);
        setLocalElapsed(data.now_playing.elapsed);
      }
    };
    updateData();
    const interval = setInterval(updateData, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Smooth Progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLocalElapsed(prev => {
        if (nowPlaying && prev < nowPlaying.now_playing.duration) return prev + 1;
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, nowPlaying]);

  // Audio Control
  const togglePlay = () => {
    if (!audioRef.current || !nowPlaying) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = nowPlaying.station.listen_url;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Logic Helpers
  const currentDJ = useMemo(() => {
    if (!nowPlaying?.live?.is_live) return null;
    return localDjs.find(dj => dj.name.toLowerCase().includes(nowPlaying.live?.streamer_name.toLowerCase() || '')) || null;
  }, [nowPlaying, localDjs]);

  const activeLogo = currentDJ ? currentDJ.logo : (nowPlaying?.now_playing.song.art || stationLogo);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Interaction Actions ---
  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const pass = (formData.get('password') as string)?.trim();
    const name = (formData.get('name') as string || email?.split('@')[0])?.trim();

    if (authMode === 'signup') {
      if (registeredUsers.some(u => u.email === email)) { alert("User already exists with this email."); return; }
      const newUser: UserAccount = { 
        email, pass, name, isVerified: false, onMailingList: true, joinedAt: Date.now()
      };
      setRegisteredUsers([...registeredUsers, newUser]);
      if (!mailingList.includes(email)) setMailingList([...mailingList, email]);
      setUnverifiedEmail(email);
      setAuthMode('verify');
    } else if (authMode === 'login') {
      const user = registeredUsers.find(u => u.email === email && u.pass === pass);
      if (user) {
        if (!user.isVerified) {
          setUnverifiedEmail(email);
          setAuthMode('verify');
        } else {
          setCurrentUser({ email, name: user.name, isVerified: user.isVerified });
        }
      } else {
        alert("Invalid email or password.");
      }
    } else if (authMode === 'reset') {
      const newPass = (formData.get('new_password') as string)?.trim();
      if (resetType === 'listener') {
        setRegisteredUsers(registeredUsers.map(u => u.email === resetEmail ? { ...u, pass: newPass } : u));
      } else {
        setLocalDjs(localDjs.map(d => d.email === resetEmail ? { ...d, password: newPass } : d));
      }
      alert("Password updated!");
      setAuthMode('login');
    }
  };

  const handleVerifyEmail = () => {
    const updated = registeredUsers.map(u => u.email === unverifiedEmail ? { ...u, isVerified: true } : u);
    setRegisteredUsers(updated);
    const user = updated.find(u => u.email === unverifiedEmail);
    if (user) setCurrentUser({ email: user.email, name: user.name, isVerified: true });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userEmail: currentUser.email,
      userName: loggedInDJ ? `DJ ${loggedInDJ.name}` : currentUser.name,
      text: chatInput,
      timestamp: Date.now(),
      isDJ: !!loggedInDJ
    };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
  };

  const shareApp = async () => {
    const shareData = {
      title: stationName,
      text: `Listening to ${stationName}! 👑 Join the kingdom:`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Link copied!');
    }
  };

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pass = new FormData(e.currentTarget).get('admin_pass') as string;
    if (pass === adminPasscode) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setShowAdminPanel(true);
    } else alert("Invalid Passcode.");
  };

  const handleDJLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const user = (data.get('dj_user') as string).toLowerCase();
    const pass = data.get('dj_pass') as string;
    const dj = localDjs.find(d => d.name.toLowerCase() === user && d.password === pass);
    if (dj) {
      setLoggedInDJ(dj);
      setCurrentUser({ email: dj.email || `${user}@remixkingz.com`, name: `DJ ${dj.name}`, isVerified: true });
      setShowDJLogin(false);
    } else alert("Invalid DJ credentials.");
  };

  const deleteUser = (email: string) => {
    if (window.confirm("Remove this listener?")) {
      setRegisteredUsers(registeredUsers.filter(u => u.email !== email));
      setMailingList(mailingList.filter(m => m !== email));
    }
  };

  if (!currentUser || !currentUser.isVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white text-center font-inter">
        <div className="w-full max-w-lg glass border border-yellow-500/30 rounded-[3rem] p-10">
          <img src={stationLogo} className="w-32 h-32 rounded-full border-4 border-yellow-500 mx-auto mb-6 object-cover" />
          <h1 className="text-5xl font-oswald font-black uppercase italic mb-8">REMIX KINGZ</h1>
          {authMode === 'verify' ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-oswald text-yellow-500">VERIFY EMAIL</h3>
              <p className="text-sm text-gray-400">Waiting for activation link on {unverifiedEmail}</p>
              <button onClick={handleVerifyEmail} className="w-full py-4 bg-yellow-600 rounded-2xl font-black text-black">SIMULATE VERIFICATION</button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-6 text-left">
              {authMode === 'signup' && <input name="name" placeholder="Display Name" className="w-full bg-black/50 border border-white/10 p-4 rounded-xl font-bold" />}
              <input name="email" type="email" placeholder="Email Address" className="w-full bg-black/50 border border-white/10 p-4 rounded-xl font-bold" />
              <input name="password" type="password" placeholder="Password" className="w-full bg-black/50 border border-white/10 p-4 rounded-xl font-bold" />
              <button type="submit" className="w-full py-5 bg-yellow-600 rounded-2xl font-black text-black uppercase tracking-widest">
                {authMode === 'login' ? 'ENTER THE DECK' : 'JOIN THE KINGDOM'}
              </button>
              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-yellow-500 font-black">
                   {authMode === 'login' ? "JOIN US" : "BACK TO LOGIN"}
                </button>
                <button type="button" onClick={() => setShowDJLogin(true)} className="text-[10px] text-gray-500 uppercase">DJ Access</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-40 md:pb-0 text-white relative bg-black font-inter">
      <audio ref={audioRef} />

      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {bgConfig.type === 'image' && bgConfig.value ? (
          <div className="absolute inset-0 bg-center bg-cover transition-all duration-1000" style={{ backgroundImage: `url(${bgConfig.value})`, filter: `brightness(${bgConfig.brightness}) scale(1.1)` }} />
        ) : (
          <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: bgConfig.value }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-yellow-500/20 backdrop-blur-3xl">
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <div className="relative cursor-pointer" onClick={() => setShowLogoDropdown(!showLogoDropdown)}>
            <img src={stationLogo} className="w-12 h-12 rounded-full border-2 border-yellow-600 shadow-xl object-cover" />
            <div className="absolute -top-1 -right-1 text-[10px]">👑</div>
          </div>
          {showLogoDropdown && (
            <div className="absolute top-16 left-0 w-72 glass border border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl z-[100] p-2 animate-slide-in-top backdrop-blur-3xl">
              <button onClick={() => { if(isAdmin) setShowAdminPanel(true); else setShowAdminLogin(true); setShowLogoDropdown(false); }} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-yellow-500/10 rounded-2xl transition-all">
                <Settings size={18} className="text-yellow-500" /> <span className="text-xs font-bold uppercase">Master Console</span>
              </button>
              <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-red-500/10 text-red-400 rounded-2xl transition-all">
                <X size={18} /> <span className="text-xs font-bold uppercase">Sign Out</span>
              </button>
            </div>
          )}
          <h1 className="text-2xl font-oswald font-black uppercase italic tracking-tighter hidden sm:block">
            {stationName.split(' ')[0]} <span className="text-yellow-500">{stationName.split(' ').slice(1).join(' ')}</span>
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-4">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Radio size={18} />} label="LIVE" />
          <NavItem active={activeTab === 'djs'} onClick={() => setActiveTab('djs')} icon={<Users size={18} />} label="KINGZ DJS" />
          <NavItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Calendar size={18} />} label="FLYERS" />
          <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18} />} label="CHAT ROOM" />
        </nav>
        <button onClick={shareApp} className="p-3 bg-white/5 border border-white/10 rounded-full text-yellow-500"><Share2 size={24} /></button>
      </header>

      {/* Master Console Dashboard */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
          <header className="px-8 py-6 border-b border-yellow-500/20 flex items-center justify-between bg-zinc-950">
             <div className="flex items-center gap-4">
                <LayoutDashboard className="text-yellow-500" />
                <h2 className="text-3xl font-oswald font-bold uppercase">MASTER CONSOLE</h2>
             </div>
             <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-red-500"><X size={32}/></button>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <aside className="w-64 border-r border-yellow-500/10 p-4 space-y-2 bg-zinc-950/50">
              <AdminNavItem active={adminTab === 'users'} onClick={() => setAdminTab('users')} icon={<Users size={18}/>} label="LISTENER DATA" />
              <AdminNavItem active={adminTab === 'station'} onClick={() => setAdminTab('station')} icon={<Palette size={18}/>} label="STATION CONTROL" />
              <AdminNavItem active={adminTab === 'mailing'} onClick={() => setAdminTab('mailing')} icon={<List size={18}/>} label="MAILING LIST" />
              <AdminNavItem active={adminTab === 'blast'} onClick={() => setAdminTab('blast')} icon={<Megaphone size={18}/>} label="SEND BLAST" />
            </aside>
            <main className="flex-1 p-10 overflow-y-auto">
              {adminTab === 'station' && (
                <div className="max-w-4xl space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Branding Section */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-oswald font-bold text-yellow-500 uppercase flex items-center gap-3">
                        <Monitor size={20}/> Station Branding
                      </h3>
                      <div className="space-y-4 glass p-8 rounded-3xl border border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Station Name</label>
                          <input 
                            value={stationName} 
                            onChange={(e) => setStationName(e.target.value)} 
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-600 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Main Logo URL</label>
                          <input 
                            value={stationLogo} 
                            onChange={(e) => setStationLogo(e.target.value)} 
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-600 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Background Control Section */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-oswald font-bold text-yellow-500 uppercase flex items-center gap-3">
                        <Palette size={20}/> Background & Colors
                      </h3>
                      <div className="space-y-6 glass p-8 rounded-3xl border border-white/5">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setBgConfig({...bgConfig, type: 'color'})} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bgConfig.type === 'color' ? 'bg-yellow-600 text-black' : 'bg-white/5'}`}
                          >Solid Color</button>
                          <button 
                            onClick={() => setBgConfig({...bgConfig, type: 'image'})} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bgConfig.type === 'image' ? 'bg-yellow-600 text-black' : 'bg-white/5'}`}
                          >Custom Graphic</button>
                        </div>

                        {bgConfig.type === 'color' ? (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pick Background Color</label>
                            <input 
                              type="color" 
                              value={bgConfig.value} 
                              onChange={(e) => setBgConfig({...bgConfig, value: e.target.value})}
                              className="w-full h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Graphic Image URL</label>
                            <input 
                              value={bgConfig.value} 
                              onChange={(e) => setBgConfig({...bgConfig, value: e.target.value})} 
                              placeholder="Link to your background JPG/PNG"
                              className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-600 text-xs font-mono"
                            />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Atmosphere Brightness</label>
                            <span className="text-[10px] text-yellow-500 font-black">{Math.round(bgConfig.brightness * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.01" 
                            value={bgConfig.brightness} 
                            onChange={(e) => setBgConfig({...bgConfig, brightness: Number(e.target.value)})}
                            className="w-full accent-yellow-500"
                          />
                          <p className="text-[9px] text-gray-500 italic">Lowering brightness helps the text pop against graphics.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-600/10 border border-yellow-600/30 p-8 rounded-[2rem] flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-oswald font-bold uppercase text-yellow-500">Live Preview Mode</h4>
                      <p className="text-xs text-gray-400 mt-1">Background changes happen instantly across all devices.</p>
                    </div>
                    <button onClick={() => alert("Station UI Synced!")} className="px-8 py-4 bg-yellow-600 text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all">SYNC GLOBAL UI</button>
                  </div>
                </div>
              )}
              {adminTab === 'users' && (
                <div className="space-y-8 animate-fade-in">
                  <h3 className="text-4xl font-oswald font-bold uppercase">Listener Database</h3>
                  <div className="glass rounded-3xl overflow-hidden border border-white/5">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-yellow-500">
                        <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr>
                      </thead>
                      <tbody>
                        {registeredUsers.map(u => (
                          <tr key={u.email} className="border-b border-white/5 hover:bg-white/5 transition-all">
                            <td className="px-6 py-4 font-bold">{u.name}</td>
                            <td className="px-6 py-4 text-gray-400">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black ${u.isVerified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{u.isVerified ? 'VERIFIED' : 'PENDING'}</span>
                            </td>
                            <td className="px-6 py-4"><button onClick={() => deleteUser(u.email)} className="text-red-500"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {adminTab === 'blast' && (
                <form onSubmit={(e) => { e.preventDefault(); alert("Blast Sent!"); }} className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                  <h3 className="text-4xl font-oswald font-bold uppercase text-center">SEND GLOBAL BLAST</h3>
                  <input placeholder="Blast Headline" className="w-full bg-black/50 border border-white/10 p-6 rounded-3xl text-xl font-bold" />
                  <textarea placeholder="Message Content" className="w-full bg-black/50 border border-white/10 p-6 rounded-3xl h-64 resize-none" />
                  <button className="w-full py-6 bg-yellow-600 rounded-3xl text-black font-black uppercase tracking-widest shadow-xl">DEPLOY NOTIFICATION</button>
                </form>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="w-full max-w-md glass border border-red-500/30 rounded-[3rem] p-10 text-center">
            <h2 className="text-4xl font-oswald font-bold uppercase text-red-500 mb-8">ADMIN AUTH</h2>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input required name="admin_pass" type="password" placeholder="Passcode" className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-center text-xl font-bold" />
              <button type="submit" className="w-full py-4 bg-red-600 rounded-xl font-black text-black">UNLOCK CONSOLE</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="text-xs text-gray-500 uppercase mt-4">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-6 py-8 relative z-10 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in-up">
            <div className="lg:col-span-8 space-y-12">
              <div className="relative aspect-video rounded-[3rem] overflow-hidden border-4 border-yellow-600/30 shadow-2xl group bg-black/60">
                <img src={activeLogo} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-12 left-12">
                  <h3 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest mb-2">{nowPlaying?.now_playing.song.artist || stationName}</h3>
                  <h2 className="text-5xl font-oswald font-black uppercase leading-tight">{nowPlaying?.now_playing.song.title || 'Live Streaming...'}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Clock/>} label="Up Next" value="KINGZ MIX" />
                <StatCard icon={<Users/>} label="Listeners" value={nowPlaying?.live?.is_live ? "1.8K" : "0.9K"} />
                <StatCard icon={<Music/>} label="Vibe" value="REMIX KINGZ" />
              </div>
            </div>
            <div className="lg:col-span-4 glass rounded-[3rem] p-8 border border-yellow-500/20 h-fit space-y-8">
              <h3 className="text-2xl font-oswald font-bold uppercase text-yellow-500 border-b border-white/10 pb-4">RESIDENT KINGZ</h3>
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {localDjs.slice(0, 10).map(dj => (
                  <div key={dj.id} onClick={() => setSelectedDJProfile(dj)} className="flex items-center gap-4 group cursor-pointer hover:translate-x-2 transition-all">
                    <img src={dj.logo} className="w-14 h-14 rounded-2xl object-cover border border-white/10 group-hover:border-yellow-500" />
                    <div><p className="font-bold uppercase text-lg group-hover:text-yellow-500 transition-colors">{dj.name}</p><p className="text-[10px] text-gray-500 font-black uppercase">Resident</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto h-[70vh] flex flex-col glass rounded-[3rem] p-6 border border-yellow-500/20 shadow-2xl backdrop-blur-3xl">
             <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
               {chatMessages.map(m => (
                 <div key={m.id} className={`flex flex-col ${m.userEmail === currentUser.email ? 'items-end' : 'items-start'}`}>
                   <span className="text-[9px] text-gray-500 font-black mb-1 px-2 uppercase tracking-widest">{m.userName}</span>
                   <div className={`px-5 py-3 rounded-3xl text-sm font-medium ${m.isDJ ? 'bg-yellow-600 text-black' : 'bg-white/10'}`}>{m.text}</div>
                 </div>
               ))}
               <div ref={chatEndRef} />
             </div>
             <form onSubmit={handleSendMessage} className="mt-6 flex gap-4 p-2 bg-black/40 rounded-full border border-white/10">
               <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message the deck..." className="flex-1 bg-transparent px-6 py-3 outline-none" />
               <button className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-black shadow-lg"><Send size={20} fill="currentColor"/></button>
             </form>
          </div>
        )}

        {activeTab === 'djs' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 animate-fade-in-up">
            {localDjs.map(dj => (
              <div key={dj.id} onClick={() => setSelectedDJProfile(dj)} className="glass p-6 rounded-[2.5rem] group cursor-pointer hover:-translate-y-2 transition-all">
                <img src={dj.logo} className="aspect-square rounded-[2rem] object-cover mb-4 group-hover:scale-105 transition-all" />
                <h4 className="font-oswald text-xl font-bold text-center uppercase group-hover:text-yellow-500">{dj.name}</h4>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-fade-in-up">
             {localEvents.map(event => (
               <div key={event.id} className="glass rounded-[3rem] overflow-hidden group hover:border-yellow-500/50 transition-all">
                 <img src={event.flyer} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-all" />
                 <div className="p-8"><h3 className="text-2xl font-oswald font-bold uppercase">{event.title}</h3><p className="text-xs text-yellow-500 font-black mt-2">{event.date} @ {event.location}</p></div>
               </div>
             ))}
           </div>
        )}
      </main>

      {/* Floating Player */}
      <footer className="fixed bottom-0 left-0 right-0 md:bottom-10 md:left-10 md:right-10 z-[60]">
        <div className="glass md:rounded-[3rem] p-6 border-t-4 border-yellow-600 shadow-2xl backdrop-blur-3xl bg-black/80">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-6 flex-1 w-full">
              <button onClick={togglePlay} className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-black transition-all hover:scale-110 shadow-xl">
                {isPlaying ? <Pause fill="black" size={32}/> : <Play fill="black" size={32} className="ml-1" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">{nowPlaying?.live?.streamer_name || 'KINGZ RADIO'}</p>
                <h4 className="text-xl font-oswald font-bold truncate uppercase">{nowPlaying?.now_playing.song.title || 'Welcome to the Kingdom'}</h4>
                <p className="text-xs text-white/40 truncate">{nowPlaying?.now_playing.song.artist || stationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex items-center gap-4 flex-1 md:w-48">
                <button onClick={() => setIsMuted(!isMuted)} className="text-yellow-500">{isMuted ? <VolumeX size={24}/> : <Volume2 size={24}/>}</button>
                <input type="range" className="w-full h-1.5 bg-black rounded-full accent-yellow-500" value={volume} onChange={e => setVolume(Number(e.target.value))} />
              </div>
              <button onClick={shareApp} className="p-3 bg-white/5 border border-white/10 rounded-full text-yellow-500"><Share2 size={20}/></button>
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-black/60 rounded-full overflow-hidden">
             <div className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(212,175,55,1)] transition-all" style={{ width: `${(localElapsed / (nowPlaying?.now_playing.duration || 1)) * 100}%` }} />
          </div>
        </div>
      </footer>
    </div>
  );
};

// UI Helpers
const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] tracking-widest ${active ? 'bg-yellow-600 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const AdminNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all font-black text-[10px] tracking-widest text-left ${active ? 'bg-yellow-600 text-black' : 'text-gray-500 hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="glass p-6 rounded-[2.5rem] border border-white/5">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-yellow-500/60 mb-2">{icon} {label}</div>
    <div className="text-xl font-bold uppercase tracking-tight">{value}</div>
  </div>
);

export default App;