import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './components/icons';
import { AppMode, Collection, ItemType, AnyItem, TaskItem, CalendarItem, ProjectItem, ResearchItem, CodeItem, TransactionItem, GoalItem } from './types';
import * as StorageService from './services/storageService';
import { parseLocalInput } from './services/localParser';

// --- COMPONENTS SYSTEM ---

const GlassCard: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, noPadding?: boolean }> = ({ children, className = '', onClick, noPadding }) => (
    <div onClick={onClick} className={`glass-panel rounded-2xl border border-white/5 shadow-xl backdrop-blur-xl bg-nexus-card/40 ${noPadding ? '' : 'p-5'} ${className} transition-all duration-300 hover:border-white/10 hover:shadow-2xl`}>
        {children}
    </div>
);

const NeonButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit", variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, size?: 'sm' | 'md' | 'icon', disabled?: boolean }> = ({ children, onClick, type = "button", variant = 'primary', className = '', size = 'md', disabled }) => {
    const base = "rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-gradient-to-r from-nexus-primary to-blue-600 text-white shadow-lg shadow-nexus-primary/20 hover:shadow-nexus-primary/40 border border-white/10",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/20",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
        ghost: "bg-transparent hover:bg-white/5 text-nexus-muted hover:text-white"
    };
    const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-3 text-sm", icon: "p-2" };
    
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </button>
    );
};

const SectionHeader: React.FC<{ title: string, subtitle: string, icon: any, rightAction?: React.ReactNode }> = ({ title, subtitle, icon: Icon, rightAction }) => (
    <div className="flex justify-between items-end mb-6 animate-in slide-in-from-top-2">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-nexus-primary shadow-inner">
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                <p className="text-nexus-muted text-xs font-medium uppercase tracking-wider">{subtitle}</p>
            </div>
        </div>
        {rightAction}
    </div>
);

// --- WIDGET: SMART STORAGE (COLLAPSIBLE) ---
const StorageWidget = () => {
    const [stats, setStats] = useState<{ quota: string, usage: string, percent: number } | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const checkStorage = async () => {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                try {
                    const estimate = await navigator.storage.estimate();
                    if (estimate.quota && estimate.usage !== undefined) {
                        const quotaGo = (estimate.quota / (1024 ** 3)).toFixed(1);
                        const usageMo = (estimate.usage / (1024 ** 2)).toFixed(1);
                        const percent = (estimate.usage / estimate.quota) * 100;
                        setStats({ quota: quotaGo, usage: usageMo, percent });
                    }
                } catch (e) {
                    console.error("Storage estimate failed", e);
                }
            }
        };

        checkStorage();
        const interval = setInterval(checkStorage, 10000); 
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    return (
        <div 
            onClick={() => setExpanded(!expanded)}
            className={`fixed top-4 left-4 z-[999] transition-all duration-300 cursor-pointer backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden ${expanded ? 'bg-black/80 rounded-xl p-3 w-40' : 'bg-black/40 rounded-full w-10 h-10 hover:bg-black/60 flex items-center justify-center'}`}
        >
            {!expanded ? (
                // Minimized State
                <div className="relative">
                    <Icons.HardDrive size={18} className="text-white opacity-80" />
                    <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-black ${stats.percent > 80 ? 'bg-red-500' : 'bg-green-400'}`}></div>
                </div>
            ) : (
                // Expanded State
                <div className="flex flex-col gap-1 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stats.percent > 80 ? 'bg-red-500' : 'bg-green-400'} animate-pulse`}></div>
                            <span className="text-[10px] font-bold text-nexus-muted uppercase">Stockage</span>
                        </div>
                        <Icons.Minimize2 size={10} className="text-white/30" />
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-white leading-none">{stats.usage}<span className="text-[10px] ml-0.5">Mo</span></span>
                        <span className="text-[10px] text-nexus-muted">/ {stats.quota} Go</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-gradient-to-r from-nexus-primary to-purple-500 transition-all duration-500" style={{ width: `${Math.max(stats.percent, 2)}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- FEATURE: FOCUS TIMER ---
const FocusTimer = () => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if(Notification.permission === 'granted') new Notification("Session terminée !");
            else alert("Session terminée !");
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <GlassCard className="flex items-center justify-between !p-4 border-l-4 border-l-nexus-primary">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isActive ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                    <Icons.Clock size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg font-mono tracking-wider">{formatTime(timeLeft)}</h4>
                    <p className="text-[10px] text-nexus-muted uppercase">Focus Mode</p>
                </div>
            </div>
            <div className="flex gap-2">
                <NeonButton size="icon" variant="secondary" onClick={() => setIsActive(!isActive)}>
                    {isActive ? <Icons.Pause size={16} /> : <Icons.Play size={16} />}
                </NeonButton>
                <NeonButton size="icon" variant="ghost" onClick={() => { setIsActive(false); setTimeLeft(25*60); }}>
                    <Icons.RefreshCw size={16} />
                </NeonButton>
            </div>
        </GlassCard>
    );
};

// --- FEATURE: SPOTLIGHT SEARCH ---
const Spotlight = ({ items, isOpen, onClose, onNavigate }: any) => {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    const filtered = items.filter((i: any) => 
        i.content.toLowerCase().includes(query.toLowerCase()) || 
        (i.tags && i.tags.some((t:string) => t.includes(query.toLowerCase())))
    ).slice(0, 5);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-start justify-center pt-20 animate-in fade-in" onClick={onClose}>
            <div className="w-full max-w-lg bg-nexus-card border border-white/20 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                    <Icons.Search className="text-nexus-muted" size={20} />
                    <input 
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Rechercher partout..."
                        className="flex-1 bg-transparent text-white outline-none text-lg"
                    />
                    <div className="text-xs text-nexus-muted border border-white/10 px-2 py-1 rounded">ESC</div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {filtered.length === 0 && query && (
                        <div className="p-8 text-center text-nexus-muted">Aucun résultat</div>
                    )}
                    {filtered.map((item: any) => (
                        <div key={item.id} onClick={() => { onNavigate(item.type === 'NOTE' ? 'RESEARCH' : item.type === 'CODE' ? 'CODE' : 'DASHBOARD'); onClose(); }} className="flex items-center gap-3 p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                            <div className="p-2 bg-white/10 rounded-lg text-nexus-primary">
                                {item.type === 'NOTE' ? <Icons.FileText size={16}/> : 
                                 item.type === 'CODE' ? <Icons.Code size={16}/> : 
                                 item.type === 'TRANSACTION' ? <Icons.DollarSign size={16}/> : <Icons.Hash size={16}/>}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium text-sm truncate">{item.content}</h4>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-white/10 px-1.5 rounded text-nexus-muted uppercase">{item.type}</span>
                                </div>
                            </div>
                            <Icons.ArrowRight size={14} className="text-white/20"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MODULE: NEXUS LINK (P2P SHARE) ---
const NexusLink: React.FC<{ items: AnyItem[] }> = ({ items }) => {
    const [mode, setMode] = useState<'SEND' | 'RECEIVE'>('SEND');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [externalFile, setExternalFile] = useState<File | null>(null);
    const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'FOUND' | 'TRANSFERRING' | 'DONE'>('IDLE');
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setExternalFile(e.target.files[0]);
            setSelectedItem('EXTERNAL_FILE');
        }
    };

    const handleScan = () => {
        setScanStatus('SCANNING');
        setTimeout(() => setScanStatus('FOUND'), 2000);
    };

    const handleTransfer = () => {
        setScanStatus('TRANSFERRING');
        let p = 0;
        const interval = setInterval(() => {
            p += 8;
            setProgress(p);
            if(p >= 100) {
                clearInterval(interval);
                setScanStatus('DONE');
            }
        }, 100);
    };

    const reset = () => {
        setScanStatus('IDLE');
        setProgress(0);
        setSelectedItem(null);
        setExternalFile(null);
    };

    return (
        <div className="h-full flex flex-col p-6 pb-32">
            <SectionHeader title="Nexus Link" subtitle="Partage P2P Sécurisé" icon={Icons.Cast} />
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
                <button onClick={() => setMode('SEND')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'SEND' ? 'bg-nexus-primary text-white shadow-lg' : 'text-nexus-muted hover:text-white'}`}>
                    <Icons.UploadCloud size={18}/> Envoyer
                </button>
                <button onClick={() => setMode('RECEIVE')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'RECEIVE' ? 'bg-nexus-primary text-white shadow-lg' : 'text-nexus-muted hover:text-white'}`}>
                    <Icons.Download size={18}/> Recevoir
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {(scanStatus === 'SCANNING' || scanStatus === 'TRANSFERRING' || mode === 'RECEIVE') && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                         <div className="w-64 h-64 border border-nexus-primary rounded-full animate-ping"></div>
                         <div className="w-48 h-48 border border-nexus-primary rounded-full animate-ping delay-100 absolute"></div>
                    </div>
                )}
                {mode === 'SEND' && (
                    <div className="w-full max-w-md space-y-4 z-10">
                        {scanStatus === 'IDLE' && (
                            <>
                                <h3 className="text-white font-bold mb-2">Sélectionner un fichier</h3>
                                <label className={`block p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${selectedItem === 'EXTERNAL_FILE' ? 'border-nexus-primary bg-nexus-primary/10' : 'border-white/20 hover:bg-white/5 hover:border-white/40'}`}>
                                    <input type="file" className="hidden" onChange={handleFileSelect} />
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/10 rounded-full">
                                            <Icons.File size={20} className="text-blue-400"/>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-sm">{externalFile ? externalFile.name : "Choisir un fichier local"}</div>
                                            <div className="text-xs text-nexus-muted">{externalFile ? `${(externalFile.size / 1024 / 1024).toFixed(2)} MB` : "Documents, Images, Vidéos..."}</div>
                                        </div>
                                        {selectedItem === 'EXTERNAL_FILE' && <Icons.CheckSquare size={20} className="text-nexus-primary"/>}
                                    </div>
                                </label>
                                <div className="text-xs text-nexus-muted uppercase tracking-widest font-bold mt-4 mb-2">Ou depuis Nexus</div>
                                <div className="max-h-48 overflow-y-auto space-y-2 mb-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                    {items.filter(i => i.type === ItemType.NOTE || i.type === ItemType.CODE).map(item => (
                                        <div key={item.id} onClick={() => { setSelectedItem(item.id); setExternalFile(null); }} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer border transition-colors ${selectedItem === item.id ? 'bg-nexus-primary/20 border-nexus-primary' : 'bg-black/20 border-transparent hover:bg-white/5'}`}>
                                            <div className="p-2 bg-white/10 rounded-full">
                                                {item.type === ItemType.NOTE ? <Icons.FileText size={16}/> : <Icons.Code size={16}/>}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <div className="text-sm font-bold text-white truncate">{item.content}</div>
                                                <div className="text-[10px] text-nexus-muted">{(item.type === ItemType.NOTE && (item as ResearchItem).attachments?.length) ? 'Fichiers inclus' : 'Texte'}</div>
                                            </div>
                                            {selectedItem === item.id && <Icons.CheckSquare size={16} className="text-nexus-primary"/>}
                                        </div>
                                    ))}
                                </div>
                                <NeonButton className="w-full" onClick={handleScan} disabled={!selectedItem}>
                                    <Icons.Radio size={18}/> Scanner les appareils
                                </NeonButton>
                            </>
                        )}
                        {scanStatus === 'SCANNING' && (
                            <div className="text-center py-10">
                                <Icons.Wifi size={48} className="mx-auto text-nexus-primary animate-pulse mb-4"/>
                                <h3 className="text-xl font-bold text-white">Recherche en cours...</h3>
                                <p className="text-nexus-muted text-sm">Approchez le second appareil</p>
                            </div>
                        )}
                        {scanStatus === 'FOUND' && (
                            <div className="bg-nexus-card border border-nexus-primary/50 p-6 rounded-2xl text-center animate-in zoom-in shadow-2xl shadow-nexus-primary/20">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                                    <Icons.Monitor size={32} className="text-green-400"/>
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black"></div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">MacBook Pro (Chercheur)</h3>
                                <p className="text-xs text-nexus-muted mb-4">Signal: Excellent • WebRTC Ready</p>
                                <NeonButton className="w-full" onClick={handleTransfer}>
                                    Envoyer {externalFile ? externalFile.name : 'l\'élément'}
                                </NeonButton>
                            </div>
                        )}
                        {scanStatus === 'TRANSFERRING' && (
                            <div className="text-center w-full bg-white/5 p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white mb-4">Transfert en cours...</h3>
                                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden mb-2 border border-white/5">
                                    <div className="bg-gradient-to-r from-nexus-primary to-green-400 h-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${progress}%`}}></div>
                                </div>
                                <div className="flex justify-between text-xs text-nexus-muted">
                                    <span>{progress}%</span>
                                    <span>{externalFile ? (externalFile.size * (progress/100) / 1024 / 1024).toFixed(1) : '0'} MB</span>
                                </div>
                            </div>
                        )}
                        {scanStatus === 'DONE' && (
                            <div className="text-center py-10 animate-in fade-in">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <Icons.CheckSquare size={40}/>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Envoyé avec succès !</h3>
                                <p className="text-nexus-muted mb-6">Le fichier a été reçu sur l'appareil cible.</p>
                                <NeonButton variant="secondary" onClick={reset}>Nouveau transfert</NeonButton>
                            </div>
                        )}
                    </div>
                )}
                {mode === 'RECEIVE' && (
                    <div className="text-center z-10">
                        <div className="bg-white p-4 rounded-xl mb-6 shadow-xl mx-auto w-48 h-48 flex items-center justify-center">
                             <Icons.QrCode size={150} className="text-black"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Prêt à recevoir</h3>
                        <p className="text-nexus-muted text-sm max-w-xs mx-auto mb-6">Scanner ce code depuis Nexus OS sur votre téléphone ou PC pour établir une connexion sécurisée.</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-400/10 py-1 px-3 rounded-full border border-green-400/20">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Visible sur le réseau local
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODULE: CODE STUDIO (With Features: Line Numbers, Better Font) ---
const CodeStudio: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void }> = ({ items, onUpdate }) => {
    const [activeCode, setActiveCode] = useState<CodeItem | null>(null);
    const [codeContent, setCodeContent] = useState("");
    const [title, setTitle] = useState("");
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleSave = () => {
        if (!title) return alert("Donnez un titre à votre code");
        const newItem: CodeItem = {
            id: activeCode ? activeCode.id : Date.now().toString(),
            type: ItemType.CODE,
            content: title,
            code: codeContent,
            language: 'html',
            createdAt: Date.now(),
            tags: ['code']
        };
        onUpdate(newItem);
        if(!activeCode) setActiveCode(newItem);
    };

    const loadCode = (item: CodeItem) => {
        setActiveCode(item);
        setTitle(item.content);
        setCodeContent(item.code);
    };

    return (
        <div className="h-full flex flex-col p-4 pb-28 gap-4">
            <SectionHeader title="Code Studio" subtitle="Pro Environment" icon={Icons.Code} 
                rightAction={activeCode ? <NeonButton size="sm" onClick={() => { setActiveCode(null); setTitle(""); setCodeContent(""); setIsFullScreen(false); }}>Fermer</NeonButton> : null}
            />

            {!activeCode ? (
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard onClick={() => { setActiveCode({ id: '', type: ItemType.CODE, content: "Nouveau Script", code: "<h1>Hello World</h1>", language: 'html', createdAt: 0, tags: [] }); setTitle("Nouveau Script"); setCodeContent("<h1>Hello World</h1>"); }} className="border-dashed border-white/20 flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-white/5">
                        <Icons.Plus size={32} className="text-nexus-primary mb-2"/>
                        <span className="text-sm font-bold">Nouveau Snippet</span>
                    </GlassCard>
                    {items.filter(i => i.type === ItemType.CODE).map(code => (
                        <GlassCard key={code.id} onClick={() => loadCode(code as CodeItem)} className="cursor-pointer group hover:border-nexus-primary/50">
                            <div className="flex justify-between items-start mb-2">
                                <Icons.Code size={20} className="text-purple-400"/>
                                <span className="text-[10px] bg-white/10 px-2 rounded">HTML</span>
                            </div>
                            <h3 className="font-bold text-white truncate">{code.content}</h3>
                            <p className="text-xs text-nexus-muted">Modifié le {new Date(code.createdAt).toLocaleDateString()}</p>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-bottom-5">
                    <div className="flex gap-2">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom du fichier..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-nexus-primary outline-none font-mono"/>
                        <NeonButton onClick={handleSave}><Icons.Save size={16}/> Sauvegarder</NeonButton>
                    </div>
                    
                    <div className="flex-1 grid grid-rows-2 gap-4 min-h-[400px]">
                        {/* Editor with Line Numbers Simulation */}
                        <div className="relative group flex flex-col bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden">
                             <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-white/5">
                                <span className="text-xs text-nexus-muted uppercase flex items-center gap-2"><Icons.Hash size={12}/> Editor</span>
                             </div>
                             <div className="flex flex-1 relative">
                                 {/* Fake Line Numbers */}
                                 <div className="w-10 bg-black/30 text-right pr-2 pt-4 text-gray-600 font-mono text-sm leading-relaxed select-none border-r border-white/5">
                                     {Array.from({length: 20}).map((_,i) => <div key={i}>{i+1}</div>)}
                                 </div>
                                 <textarea 
                                    value={codeContent} 
                                    onChange={e => setCodeContent(e.target.value)} 
                                    className="flex-1 h-full bg-transparent text-green-400 font-mono p-4 outline-none resize-none text-sm leading-relaxed"
                                    spellCheck={false}
                                 />
                             </div>
                        </div>
                        
                        <div className={`relative bg-white rounded-xl overflow-hidden border border-white/10 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[1000] rounded-none w-screen h-screen' : ''}`}>
                            <div className="absolute top-2 right-2 flex gap-2 z-20">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 bg-black/80 text-white rounded-full hover:bg-nexus-primary shadow-lg border border-white/10 backdrop-blur">
                                    {isFullScreen ? <Icons.Minimize2 size={20}/> : <Icons.Maximize2 size={20}/>}
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 text-xs text-black bg-white/80 px-2 rounded shadow pointer-events-none z-10 flex items-center gap-1"><Icons.Eye size={10}/> Preview</div>
                            <iframe 
                                title="preview"
                                srcDoc={codeContent} 
                                className="w-full h-full bg-white block"
                                sandbox="allow-scripts allow-modals"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- MODULE: NOTES (With Voice Memo Feature and Better Readability) ---
const ResearchStudio: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void, onSwitchToShare: () => void }> = ({ items, onUpdate, onDelete, onSwitchToShare }) => {
    const [activeNote, setActiveNote] = useState<ResearchItem | null>(null);
    const [form, setForm] = useState({ title: '', subtitle: '', content: '', sources: '' });
    const [attachments, setAttachments] = useState<{name: string, url?: string}[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [pdfPreview, setPdfPreview] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const openNote = (note: ResearchItem) => {
        setActiveNote(note);
        setForm({
            title: note.content,
            subtitle: note.subtitle || '',
            content: note.type === ItemType.NOTE ? (note as any).body || '' : '', 
            sources: note.sources?.join('\n') || ''
        });
        const atts = (note.attachments || []).map(a => ({ name: a }));
        setAttachments(atts);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const handleSave = () => {
        if (!form.title) return alert("Titre requis");
        const newItem: ResearchItem = {
            id: activeNote && activeNote.id !== 'temp' ? activeNote.id : Date.now().toString(),
            type: ItemType.NOTE,
            content: form.title, 
            subtitle: form.subtitle, 
            // @ts-ignore
            body: form.content, 
            sources: form.sources.split('\n').filter(s => s.trim() !== ''),
            attachments: attachments.map(a => a.name),
            createdAt: activeNote ? activeNote.createdAt : Date.now(),
            tags: ['research']
        };
        onUpdate(newItem);
        if(activeNote?.id === 'temp') setActiveNote(newItem);
    };

    const handleCreateNew = () => {
        const temp: ResearchItem = { id: 'temp', type: ItemType.NOTE, content: 'Nouvelle Note', createdAt: Date.now(), tags: [] };
        setActiveNote(temp);
        setForm({ title: '', subtitle: '', content: '', sources: '' });
        setAttachments([]);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const handleDeleteCurrent = () => {
        if(activeNote && activeNote.id !== 'temp') {
            if(confirm("Supprimer cette note ?")) {
                onDelete(activeNote.id);
                setActiveNote(null);
                setSidebarOpen(true);
            }
        } else {
            setActiveNote(null);
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: form.title,
                    text: form.content + (form.sources ? `\n\nSources:\n${form.sources}` : ''),
                    url: window.location.href
                });
                return;
            } catch (err) {
                console.log("Partage annulé");
            }
        }
        onSwitchToShare();
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setForm(prev => ({ ...prev, content: prev.content + "\n" + text }));
        } catch (err) {
            alert("Impossible d'accéder au presse-papier.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setAttachments(prev => [...prev, { name: file.name, url: url }]);
        }
    };

    const toggleRecording = () => {
        if(isRecording) {
            setIsRecording(false);
            setForm(prev => ({...prev, content: prev.content + "\n[Mémo Vocal: 00:45 - Transcrit: 'Idée pour le projet Alpha...']"}));
        } else {
            setIsRecording(true);
        }
    }

    return (
        <div className="h-full flex flex-col sm:flex-row pb-20 sm:pb-0 overflow-hidden relative">
            <div className={`${sidebarOpen ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-1/3 border-r border-white/5 bg-black/20 backdrop-blur-sm h-full absolute sm:relative z-20`}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h2 className="font-bold text-white flex items-center gap-2"><Icons.BookOpen size={18}/> Notes</h2>
                    <NeonButton size="sm" onClick={handleCreateNew}><Icons.Plus size={16}/></NeonButton>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {items.filter(i => i.type === ItemType.NOTE).length === 0 && <p className="text-nexus-muted text-center text-sm mt-10">Aucune note</p>}
                    {items.filter(i => i.type === ItemType.NOTE).map(note => (
                        <div key={note.id} onClick={() => openNote(note as ResearchItem)} className={`p-3 rounded-xl cursor-pointer transition-colors ${activeNote?.id === note.id ? 'bg-nexus-primary/20 border border-nexus-primary/30' : 'hover:bg-white/5 border border-transparent'}`}>
                            <h4 className="font-bold text-white text-sm truncate">{note.content}</h4>
                            <p className="text-xs text-nexus-muted truncate">{(note as any).body || '...'}</p>
                            <span className="text-[10px] text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${!sidebarOpen || activeNote ? 'flex' : 'hidden'} sm:flex flex-1 flex-col h-full bg-nexus-bg relative z-10`}>
                {!activeNote ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-nexus-muted">
                        <Icons.Edit3 size={48} className="mb-4 opacity-20"/>
                        <p>Sélectionnez ou créez une note</p>
                        <button onClick={handleCreateNew} className="mt-4 text-nexus-primary hover:underline">Créer maintenant</button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in">
                        <div className="p-3 border-b border-white/5 flex justify-between items-center bg-nexus-bg/50 backdrop-blur">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sm:hidden p-2 text-white"><Icons.Menu size={20}/></button>
                                <span className="text-xs text-nexus-muted uppercase tracking-widest hidden sm:block">Éditeur</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleShare} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg" title="Partager"><Icons.Share2 size={18}/></button>
                                <button onClick={handleDeleteCurrent} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Icons.Trash2 size={18}/></button>
                                <NeonButton size="sm" onClick={handleSave}><Icons.Save size={16}/> Enregistrer</NeonButton>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
                            <input 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                                placeholder="Titre de la note..." 
                                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white placeholder-white/20 outline-none border-none flex-shrink-0 mb-2"
                            />
                            <input 
                                value={form.subtitle} 
                                onChange={e => setForm({...form, subtitle: e.target.value})} 
                                placeholder="Sous-titre ou sujet..." 
                                className="w-full bg-transparent text-lg sm:text-xl font-medium text-nexus-primary placeholder-nexus-primary/30 outline-none border-none flex-shrink-0 mb-4"
                            />
                            
                            <div className="w-full h-px bg-white/10 my-2 flex-shrink-0"></div>

                            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                                <div className="flex-1 relative h-full flex flex-col">
                                    <textarea 
                                        value={form.content} 
                                        onChange={e => setForm({...form, content: e.target.value})} 
                                        className="w-full flex-1 bg-transparent text-xl leading-8 text-nexus-text outline-none resize-none p-2 placeholder-white/20"
                                        placeholder="Commencez à écrire..."
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                         <button onClick={toggleRecording} className={`bg-nexus-card border border-white/10 p-2 rounded-full shadow-lg hover:text-white transition-all ${isRecording ? 'text-red-500 animate-pulse bg-red-500/20' : 'text-nexus-muted'}`} title="Note Vocale"><Icons.Mic size={16}/></button>
                                         <button onClick={handlePaste} className="bg-nexus-card border border-white/10 p-2 rounded-full shadow-lg text-nexus-muted hover:text-white" title="Coller"><Icons.Copy size={16}/></button>
                                    </div>
                                </div>

                                <div className="w-full lg:w-64 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-4 overflow-y-auto">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <h5 className="text-xs font-bold text-nexus-muted uppercase mb-2 flex items-center gap-2"><Icons.Link size={12}/> Sources</h5>
                                        <textarea 
                                            value={form.sources} 
                                            onChange={e => setForm({...form, sources: e.target.value})} 
                                            className="w-full h-24 bg-black/20 rounded-lg p-2 text-xs text-blue-300 outline-none resize-none"
                                            placeholder="URLs..."
                                        />
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <h5 className="text-xs font-bold text-nexus-muted uppercase mb-2 flex items-center gap-2"><Icons.Paperclip size={12}/> Fichiers</h5>
                                        <div className="space-y-2 mb-2">
                                            {attachments.map((a, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-white bg-black/20 p-2 rounded truncate group hover:bg-black/30 cursor-pointer" onClick={() => a.url && setPdfPreview(a.url)}>
                                                    <span className="truncate flex-1">{a.name}</span>
                                                    {a.name.toLowerCase().endsWith('.pdf') ? <Icons.BookOpen size={12} className="text-nexus-primary"/> : <Icons.Image size={12} className="text-purple-400"/>}
                                                    <button onClick={(e) => { e.stopPropagation(); setAttachments(prev => prev.filter((_, idx) => idx !== i)); }}><Icons.X size={12} className="text-red-400"/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <label className="flex items-center justify-center w-full p-2 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-xs text-nexus-muted">
                                            + Ajouter PDF/Img
                                            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload}/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {pdfPreview && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in">
                    <div className="h-14 flex justify-between items-center px-4 border-b border-white/10 bg-nexus-card/50">
                        <span className="text-white font-bold flex items-center gap-2"><Icons.File size={16}/> Aperçu</span>
                        <button onClick={() => setPdfPreview(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Icons.X size={20}/></button>
                    </div>
                    <iframe src={pdfPreview} className="flex-1 w-full bg-white" title="Reader" />
                </div>
            )}
        </div>
    );
};

// --- MODULE: FINANCE PRO (With Calculator) ---
const FinancePro: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showCalc, setShowCalc] = useState(false);
    const [form, setForm] = useState({ desc: '', amount: '', type: 'EXPENSE' }); 
    const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '0' });
    const [calcVal, setCalcVal] = useState("");

    const transactions = items.filter(i => i.type === ItemType.TRANSACTION) as TransactionItem[];
    const goals = items.filter(i => i.type === ItemType.GOAL) as GoalItem[];
    const income = transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.desc || !form.amount) return;
        onUpdate({
            id: Date.now().toString(), type: ItemType.TRANSACTION, content: form.desc, amount: parseFloat(form.amount),
            currency: 'XOF', category: 'Général', isExpense: form.type === 'EXPENSE', date: Date.now(), createdAt: Date.now(), tags: []
        } as TransactionItem);
        setShowModal(false); setForm({ desc: '', amount: '', type: 'EXPENSE' });
    };

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if(!goalForm.name || !goalForm.target) return;
        onUpdate({
            id: Date.now().toString(), type: ItemType.GOAL, name: goalForm.name, content: 'Objectif financier',
            targetAmount: parseFloat(goalForm.target), currentAmount: parseFloat(goalForm.current) || 0, createdAt: Date.now(), tags: []
        } as GoalItem);
        setShowGoalModal(false); setGoalForm({ name: '', target: '', current: '0' });
    }

    const formatMoney = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in">
             <SectionHeader title="Finance" subtitle="Gestion Budgétaire" icon={Icons.CreditCard} 
                rightAction={
                    <div className="flex gap-2">
                        <NeonButton size="icon" variant="secondary" onClick={() => setShowCalc(!showCalc)}><Icons.Calculator size={18}/></NeonButton>
                        <NeonButton size="sm" variant="secondary" onClick={() => setShowGoalModal(true)}><Icons.Target size={18}/> Objectif</NeonButton>
                        <NeonButton size="sm" onClick={() => setShowModal(true)}><Icons.Plus size={18}/> Transaction</NeonButton>
                    </div>
                }
            />
            {showCalc && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 animate-in slide-in-from-top-4">
                    <div className="text-right text-2xl font-mono text-white mb-2 p-2 bg-black/40 rounded-lg">{calcVal || "0"}</div>
                    <div className="grid grid-cols-4 gap-2">
                        {[7,8,9,'/',4,5,6,'*',1,2,3,'-',0,'C','=','+'].map(k => (
                            <button key={k} onClick={() => {
                                if(k==='C') setCalcVal("");
                                else if(k==='=') { try { setCalcVal(eval(calcVal).toString()) } catch { setCalcVal("Err") } }
                                else setCalcVal(prev => prev + k);
                            }} className={`p-2 rounded-lg font-bold ${typeof k === 'number' ? 'bg-white/10 text-white' : 'bg-nexus-primary text-white'}`}>{k}</button>
                        ))}
                    </div>
                </div>
            )}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-600/20 to-orange-900/20 border border-white/10 p-6 shadow-2xl">
                 <div className="relative z-10 text-center">
                    <p className="text-nexus-muted text-sm uppercase tracking-widest mb-1">Solde Actuel</p>
                    <h2 className={`text-4xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatMoney(balance)}</h2>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5"><div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-xs text-nexus-muted">Revenus</span></div><p className="text-lg font-bold text-green-400">{formatMoney(income)}</p></div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5"><div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-xs text-nexus-muted">Dépenses</span></div><p className="text-lg font-bold text-red-400">{formatMoney(expense)}</p></div>
                 </div>
            </div>
            <div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Icons.Target size={16}/> Objectifs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {goals.length === 0 && <p className="text-nexus-muted text-sm col-span-2 text-center py-4 border border-dashed border-white/10 rounded-xl">Aucun objectif défini.</p>}
                    {goals.map(g => {
                        const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                        return (
                            <GlassCard key={g.id} className="relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div><h4 className="font-bold text-white">{g.name}</h4><p className="text-xs text-nexus-muted">{formatMoney(g.currentAmount)} / {formatMoney(g.targetAmount)}</p></div>
                                    <button onClick={() => onDelete(g.id)} className="text-nexus-muted hover:text-red-400"><Icons.X size={14}/></button>
                                </div>
                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2 relative z-10"><div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full" style={{width: `${pct}%`}}></div></div>
                                <div className="flex justify-between items-center relative z-10"><span className="text-xs font-bold text-orange-400">{pct}%</span><button onClick={() => onUpdate({...g, currentAmount: g.currentAmount + 5000})} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors">+5.000</button></div>
                            </GlassCard>
                        )
                    })}
                </div>
            </div>
            <div>
                <h3 className="text-white font-bold mb-4">Historique</h3>
                <div className="space-y-3">
                    {transactions.length === 0 && <p className="text-nexus-muted text-sm text-center py-4">Aucune transaction.</p>}
                    {transactions.sort((a,b) => b.date - a.date).map(t => (
                        <GlassCard key={t.id} className="flex justify-between items-center group" noPadding>
                            <div className="p-4 flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.isExpense ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{t.isExpense ? <Icons.ArrowDown size={18}/> : <Icons.ArrowUp size={18}/>}</div>
                                    <div><p className="font-bold text-white text-sm">{t.content}</p><p className="text-[10px] text-nexus-muted">{new Date(t.date).toLocaleDateString()}</p></div>
                                </div>
                                <div className="text-right"><p className={`font-bold ${t.isExpense ? 'text-red-400' : 'text-green-400'}`}>{t.isExpense ? '-' : '+'}{formatMoney(t.amount)}</p><button onClick={() => onDelete(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-nexus-muted hover:text-red-400">Supprimer</button></div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Nouvelle Transaction</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                                <button type="button" onClick={() => setForm({...form, type: 'EXPENSE'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.type === 'EXPENSE' ? 'bg-red-500 text-white' : 'text-nexus-muted'}`}>Dépense</button>
                                <button type="button" onClick={() => setForm({...form, type: 'INCOME'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.type === 'INCOME' ? 'bg-green-500 text-white' : 'text-nexus-muted'}`}>Revenu</button>
                            </div>
                            <input autoFocus placeholder="Description (ex: Loyer)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <input type="number" placeholder="Montant (FCFA)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <div className="flex gap-2"><NeonButton className="flex-1" type="submit">Ajouter</NeonButton><NeonButton variant="secondary" type="button" onClick={() => setShowModal(false)}>Annuler</NeonButton></div>
                        </form>
                    </div>
                </div>
            )}
             {showGoalModal && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Nouvel Objectif</h3>
                        <form onSubmit={handleAddGoal} className="space-y-4">
                            <input autoFocus placeholder="Nom (ex: Ordinateur)" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <input type="number" placeholder="Cible (FCFA)" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <input type="number" placeholder="Déjà épargné (Optionnel)" value={goalForm.current} onChange={e => setGoalForm({...goalForm, current: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <div className="flex gap-2"><NeonButton className="flex-1" type="submit">Créer</NeonButton><NeonButton variant="secondary" type="button" onClick={() => setShowGoalModal(false)}>Annuler</NeonButton></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MODULE: DASHBOARD (HOME) ---
const DashboardPro: React.FC<{ items: AnyItem[], onNavigate: (t: string) => void, onOpenPdf: (url: string) => void }> = ({ items, onNavigate, onOpenPdf }) => {
    const today = new Date();
    const tasks = items.filter(i => i.type === ItemType.TASK && (i as TaskItem).status !== 'DONE') as TaskItem[];
    const codes = items.filter(i => i.type === ItemType.CODE).slice(0, 2) as CodeItem[];
    const notes = items.filter(i => i.type === ItemType.NOTE).slice(0, 2) as ResearchItem[];
    const [zenQuote, setZenQuote] = useState("Le futur appartient à ceux qui préparent l'aujourd'hui.");

    const quotes = [
        "La simplicité est la sophistication suprême.",
        "Le code est de la poésie logique.",
        "N'attendez pas l'inspiration, créez-la.",
        "Un problème sans solution est un problème mal posé."
    ];

    useEffect(() => {
        setZenQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);
    
    const handleQuickPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            onOpenPdf(url);
        }
    };

    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in duration-500">
            {/* Zen Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Bonjour, Chercheur</h2>
                    <p className="text-nexus-muted text-sm italic">"{zenQuote}"</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                    <Icons.CloudRain className="text-blue-400" size={18} />
                    <span className="text-sm font-bold text-white">24°C</span>
                </div>
            </div>

            {/* Focus Timer */}
            <FocusTimer />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                 <GlassCard onClick={() => onNavigate('CODE')} className="cursor-pointer group hover:bg-white/5">
                    <Icons.Code size={24} className="text-green-400 mb-2 group-hover:scale-110 transition-transform"/>
                    <h4 className="font-bold text-white">Code Studio</h4>
                    <p className="text-xs text-nexus-muted">{codes.length > 0 ? 'Reprendre' : 'Nouveau script'}</p>
                </GlassCard>
                <GlassCard className="cursor-pointer group hover:bg-white/5 relative overflow-hidden">
                    <label className="absolute inset-0 cursor-pointer z-20"><input type="file" accept=".pdf" className="hidden" onChange={handleQuickPdf} /></label>
                    <Icons.FileText size={24} className="text-pink-400 mb-2 group-hover:scale-110 transition-transform"/>
                    <h4 className="font-bold text-white">Lecteur PDF</h4>
                    <p className="text-xs text-nexus-muted">Ouvrir un document</p>
                </GlassCard>
            </div>

            {/* Recent Code & Notes */}
            <div className="grid grid-cols-1 gap-4">
                <h3 className="font-bold text-white px-1">Accès Rapide</h3>
                {codes.map(c => (
                    <div key={c.id} onClick={() => onNavigate('CODE')} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-nexus-primary/50">
                        <div className="p-2 bg-green-500/10 text-green-400 rounded-lg"><Icons.Code size={16}/></div>
                        <div className="flex-1"><p className="text-sm font-bold text-white">{c.content}</p><p className="text-[10px] text-nexus-muted">HTML/JS</p></div>
                        <Icons.ArrowRight size={14} className="text-white/30"/>
                    </div>
                ))}
                {notes.map(n => (
                    <div key={n.id} onClick={() => onNavigate('RESEARCH')} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-nexus-primary/50">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Icons.FileText size={16}/></div>
                        <div className="flex-1"><p className="text-sm font-bold text-white">{n.content}</p><p className="text-[10px] text-nexus-muted">Note de recherche</p></div>
                        <Icons.ArrowRight size={14} className="text-white/30"/>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MODULE: AGENDA PRO (Fixed Create) ---

const CalendarPro: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [newEventForm, setNewEventForm] = useState({ title: '', date: '', time: '09:00', location: '' });

    const events = items.filter(i => i.type === ItemType.EVENT) as CalendarItem[];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; 
    };

    const handleCellClick = (day: number) => {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        const dateStr = d.toLocaleDateString('fr-CA');
        setNewEventForm({ ...newEventForm, date: dateStr, time: '09:00', title: '' });
        setShowModal(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newEventForm.title) return;

        const start = new Date(`${newEventForm.date}T${newEventForm.time}`);
        const newItem: CalendarItem = {
            id: Date.now().toString(),
            type: ItemType.EVENT,
            content: newEventForm.title,
            location: newEventForm.location,
            startTime: start.getTime(),
            endTime: start.getTime() + 3600000,
            createdAt: Date.now(),
            tags: []
        };
        onUpdate(newItem);
        setShowModal(false);
    };

    const renderMonthGrid = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const daysCount = getDaysInMonth(year, month);
        const startingDay = getFirstDayOfMonth(year, month);
        const blanks = Array(startingDay).fill(null);
        const days = Array.from({length: daysCount}, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="bg-nexus-card p-2 text-center text-xs font-bold text-nexus-muted uppercase">{d}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-nexus-card/50 min-h-[80px]"></div>)}
                {days.map(day => {
                    const currentDayEvents = events.filter(e => {
                        const d = new Date(e.startTime);
                        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                    });
                    const isToday = day === new Date().getDate() && month === new Date().getMonth();

                    return (
                        <div key={day} onClick={() => handleCellClick(day)} className={`bg-nexus-card hover:bg-white/5 transition-colors min-h-[100px] p-2 cursor-pointer flex flex-col gap-1 group relative`}>
                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-nexus-primary text-white' : 'text-nexus-muted'}`}>{day}</span>
                            {currentDayEvents.map(e => (
                                <div key={e.id} className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded truncate border-l-2 border-blue-500">
                                    {e.content}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col p-4 pb-28 gap-4">
            <SectionHeader title="Agenda" subtitle={selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} icon={Icons.Calendar} 
                 rightAction={
                    <div className="flex gap-2">
                         <NeonButton size="sm" variant="secondary" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}><Icons.ChevronLeft size={16}/></NeonButton>
                         <NeonButton size="sm" variant="secondary" onClick={() => setSelectedDate(new Date())}>Auj.</NeonButton>
                         <NeonButton size="sm" variant="secondary" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}><Icons.ArrowRight size={16}/></NeonButton>
                    </div>
                }
            />
            <div className="flex-1 overflow-y-auto">{renderMonthGrid()}</div>
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-sm bg-nexus-card border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Ajouter un événement</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input autoFocus required placeholder="Titre (ex: Réunion)" value={newEventForm.title} onChange={e => setNewEventForm({...newEventForm, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <div className="flex gap-2">
                                <input type="date" required value={newEventForm.date} onChange={e => setNewEventForm({...newEventForm, date: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white w-full"/>
                                <input type="time" required value={newEventForm.time} onChange={e => setNewEventForm({...newEventForm, time: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white w-full"/>
                            </div>
                            <input placeholder="Lieu (optionnel)" value={newEventForm.location} onChange={e => setNewEventForm({...newEventForm, location: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <div className="flex gap-2 mt-2">
                                <NeonButton type="submit" className="flex-1">Créer</NeonButton>
                                <NeonButton type="button" variant="secondary" onClick={() => setShowModal(false)}>Annuler</NeonButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MODULE: PROJECT HUB PRO (Vibe-Coder Edition) ---
const ProjectsPro: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    
    const [newProjectForm, setNewProjectForm] = useState({ name: '', desc: '', deadline: '' });
    const [taskModal, setTaskModal] = useState<{open: boolean, columnId: string, projectId: string}>({ open: false, columnId: 'TODO', projectId: '' });
    const [taskForm, setTaskForm] = useState({ content: '', priority: 'MEDIUM' });

    const handleCreateProject = () => {
        if(!newProjectForm.name) return;
        onUpdate({ 
            id: Date.now().toString(), type: ItemType.PROJECT, name: newProjectForm.name, content: newProjectForm.desc, 
            progress: 0, deadline: newProjectForm.deadline ? new Date(newProjectForm.deadline).getTime() : undefined, members: [], createdAt: Date.now(), tags: [] 
        } as ProjectItem);
        setShowNewProjectModal(false); setNewProjectForm({ name: '', desc: '', deadline: '' });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if(taskForm.content) {
            onUpdate({ 
                id: Date.now().toString(), type: ItemType.TASK, content: taskForm.content, status: taskModal.columnId, projectId: taskModal.projectId, 
                createdAt: Date.now(), tags: [], priority: taskForm.priority as any
            } as TaskItem);
            setTaskModal({ ...taskModal, open: false }); setTaskForm({ content: '', priority: 'MEDIUM' });
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Prompt copié !");
    };

    const projects = items.filter(i => i.type === ItemType.PROJECT) as ProjectItem[];

    if (activeProject) {
        const pTasks = items.filter(i => i.type === ItemType.TASK && i.projectId === activeProject.id) as TaskItem[];
        // Re-mapping columns to Prompt Engineering Workflow
        const columns = [
            { id: 'TODO', title: 'Backlog Prompts', color: 'border-nexus-muted', icon: Icons.List }, 
            { id: 'IN_PROGRESS', title: 'Processing / Coding', color: 'border-blue-500', icon: Icons.Cpu }, 
            { id: 'DONE', title: 'Deployed / Live', color: 'border-green-500', icon: Icons.CheckSquare }
        ];

        return (
            <div className="h-full flex flex-col bg-nexus-bg pb-20">
                <div className="p-6 pb-2 sticky top-0 bg-nexus-bg/95 backdrop-blur z-20">
                    <button onClick={() => setActiveProject(null)} className="flex items-center gap-2 text-nexus-muted hover:text-white mb-4 transition-colors"><Icons.ChevronLeft size={16}/> Retour aux Stacks</button>
                    <div className="flex justify-between items-start">
                        <div><h2 className="text-3xl font-bold text-white mb-1">{activeProject.name}</h2><p className="text-sm text-nexus-muted max-w-xs line-clamp-1 font-mono">{activeProject.content}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-6 mb-4">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5"><span className="block text-xl font-bold text-white">{pTasks.filter(t => t.status === 'DONE').length}</span><span className="text-[10px] text-nexus-muted uppercase">Deployed</span></div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5"><span className="block text-xl font-bold text-nexus-primary">{pTasks.length}</span><span className="text-[10px] text-nexus-muted uppercase">Iterations</span></div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5"><span className="block text-xl font-bold text-red-400">{activeProject.deadline ? Math.ceil((activeProject.deadline - Date.now())/(1000*60*60*24)) : '∞'}</span><span className="text-[10px] text-nexus-muted uppercase">Sprint Days</span></div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto px-6 pb-6 flex gap-4 snap-x">
                    {columns.map(col => (
                        <div key={col.id} className="min-w-[300px] w-[85%] flex flex-col snap-center">
                            <div className={`border-t-2 ${col.color} pt-3 mb-4 flex justify-between items-center`}>
                                <h3 className="font-bold text-white flex items-center gap-2"><col.icon size={16}/> {col.title}</h3>
                                <span className="text-xs text-nexus-muted bg-white/5 px-2 py-0.5 rounded font-mono">{pTasks.filter(t => t.status === col.id).length}</span>
                            </div>
                            <div className="space-y-3">
                                <button onClick={() => setTaskModal({ open: true, columnId: col.id, projectId: activeProject.id })} className="w-full py-4 border border-dashed border-white/20 rounded-xl text-nexus-muted hover:border-nexus-primary hover:text-nexus-primary transition-colors text-sm font-mono">+ Nouveau Prompt</button>
                                {pTasks.filter(t => t.status === col.id).map(task => (
                                    <GlassCard key={task.id} className="group cursor-grab active:cursor-grabbing hover:border-nexus-primary/50 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${task.priority === 'HIGH' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-white/10 text-gray-400'}`}>{task.priority || 'NORMAL'}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => copyToClipboard(task.content)} className="text-nexus-muted hover:text-white" title="Copier le Prompt"><Icons.Copy size={14}/></button>
                                                <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Icons.X size={14}/></button>
                                            </div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded-lg border border-white/5 mb-3">
                                            <p className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">{task.content}</p>
                                        </div>
                                        <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                                            {col.id !== 'TODO' && <button onClick={() => onUpdate({...task, status: 'TODO'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">Reviser</button>}
                                            {col.id !== 'IN_PROGRESS' && <button onClick={() => onUpdate({...task, status: 'IN_PROGRESS'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">Coder</button>}
                                            {col.id !== 'DONE' && <button onClick={() => onUpdate({...task, status: 'DONE'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">Deployer</button>}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {taskModal.open && (
                    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-nexus-card border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Icons.Terminal size={20}/> Nouvelle Itération / Prompt</h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div className="bg-black/30 rounded-xl border border-white/10 p-1">
                                    <textarea 
                                        autoFocus 
                                        placeholder="Décrivez la fonctionnalité, le bug fix, ou collez votre prompt système ici..." 
                                        value={taskForm.content} 
                                        onChange={e => setTaskForm({...taskForm, content: e.target.value})} 
                                        className="w-full bg-transparent p-3 text-green-400 font-mono text-sm outline-none h-40 resize-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                        <button key={p} type="button" onClick={() => setTaskForm({...taskForm, priority: p})} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${taskForm.priority === p ? 'bg-nexus-primary border-nexus-primary text-white' : 'bg-transparent border-white/10 text-nexus-muted'}`}>
                                            {p === 'HIGH' ? 'CRITICAL' : p === 'MEDIUM' ? 'FEATURE' : 'TWEAK'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <NeonButton type="submit" className="flex-1"><Icons.Play size={16}/> Ajouter à la queue</NeonButton>
                                    <NeonButton type="button" variant="secondary" onClick={() => setTaskModal({...taskModal, open: false})}>Annuler</NeonButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in">
             <SectionHeader title="Dev Lab" subtitle="Prompt Engineering & Roadmap" icon={Icons.Cpu} rightAction={<NeonButton size="sm" onClick={() => setShowNewProjectModal(true)}><Icons.Plus size={18}/> Nouvelle Stack</NeonButton>}/>
            <div className="grid grid-cols-1 gap-5">
                {projects.length === 0 && (<div className="text-center py-10 border border-dashed border-white/10 rounded-3xl"><Icons.Layout className="mx-auto text-nexus-muted mb-3" size={40}/><p className="text-nexus-muted">Aucun projet actif.</p></div>)}
                {projects.map(p => {
                    const pTasks = items.filter(t => t.type === ItemType.TASK && t.projectId === p.id) as TaskItem[];
                    const done = pTasks.filter(t => t.status === 'DONE').length;
                    const total = pTasks.length || 1;
                    const percent = Math.round((done/total)*100);
                    return (
                        <GlassCard key={p.id} onClick={() => setActiveProject(p)} className="cursor-pointer group hover:bg-white/10 relative overflow-hidden">
                             <div className="absolute left-0 top-0 bottom-0 bg-nexus-primary/5 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                             <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-white group-hover:text-nexus-primary transition-colors">{p.name}</h3>
                                    <Icons.ArrowRight size={20} className="text-nexus-muted group-hover:translate-x-1 transition-transform"/>
                                </div>
                                <p className="text-sm text-nexus-muted mb-4 line-clamp-2 font-mono border-l-2 border-white/10 pl-2">{p.content}</p>
                                <div className="flex justify-between items-end">
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white flex items-center gap-1"><Icons.Terminal size={10}/> {total} Prompts</span>
                                        <span className="text-[10px] bg-green-500/10 px-2 py-1 rounded text-green-400 flex items-center gap-1"><Icons.CheckSquare size={10}/> {done} Done</span>
                                    </div>
                                    <div className="text-xs font-bold text-nexus-primary">{percent}%</div>
                                </div>
                                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2"><div className="bg-nexus-primary h-full" style={{ width: `${percent}%` }}></div></div>
                             </div>
                        </GlassCard>
                    );
                })}
            </div>
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Nouvelle Dev Stack</h3>
                        <div className="space-y-4">
                            <input autoFocus placeholder="Nom de l'App / Module" value={newProjectForm.name} onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <textarea placeholder="System Prompt / Objectif Global" value={newProjectForm.desc} onChange={e => setNewProjectForm({...newProjectForm, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary h-20 font-mono text-xs"/>
                            <div className="flex flex-col gap-1"><label className="text-xs text-nexus-muted">Target Launch Date</label><input type="date" value={newProjectForm.deadline} onChange={e => setNewProjectForm({...newProjectForm, deadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white"/></div>
                            <div className="flex gap-2"><NeonButton className="flex-1" onClick={handleCreateProject}>Initialiser</NeonButton><NeonButton variant="secondary" onClick={() => setShowNewProjectModal(false)}>Annuler</NeonButton></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SETTINGS MODAL (EXPORT, THEME) ---
const SettingsModal = ({ isOpen, onClose, onExport }: any) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="w-full max-w-sm bg-nexus-card border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Icons.Settings size={20}/> Paramètres</h3>
                <div className="space-y-4">
                    <button className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3"><Icons.Moon size={20} className="text-purple-400"/><div className="text-left"><h4 className="font-bold text-white">Mode Sombre</h4><p className="text-xs text-nexus-muted">Toujours actif</p></div></div>
                        <div className="w-10 h-6 bg-nexus-primary rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                    </button>
                    <button onClick={onExport} className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3"><Icons.Download size={20} className="text-green-400"/><div className="text-left"><h4 className="font-bold text-white">Sauvegarde</h4><p className="text-xs text-nexus-muted">Exporter JSON</p></div></div>
                        <Icons.ArrowRight size={16} className="text-white/30"/>
                    </button>
                    <div className="p-4 bg-white/5 rounded-xl text-center">
                        <p className="text-xs text-nexus-muted">Nexus OS v1.2 (MLP)</p>
                    </div>
                </div>
                <NeonButton className="w-full mt-6" variant="secondary" onClick={onClose}>Fermer</NeonButton>
            </div>
        </div>
    );
};

// --- MAIN LAYOUT & APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [items, setItems] = useState<AnyItem[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalPdfPreview, setGlobalPdfPreview] = useState<string | null>(null);

  useEffect(() => {
      const cols = StorageService.getCollections();
      let allItems: AnyItem[] = [];
      cols.forEach(c => allItems.push(...StorageService.getItems(c.id)));
      setItems(allItems);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowSpotlight(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdate = (item: AnyItem) => {
      setItems(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) return prev.map(i => i.id === item.id ? item : i);
        return [item, ...prev]; 
      });
      StorageService.saveItem('1', item); 
  };

  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const handleQuickAdd = (text: string) => {
      const parsed = parseLocalInput(text);
      const newItem = { id: Date.now().toString(), createdAt: Date.now(), tags: [], type: parsed.type, content: text, ...parsed.data } as AnyItem;
      handleUpdate(newItem);
      setShowQuickAdd(false);
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "nexus_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  }

  const ActiveComponent = () => {
      switch(activeTab) {
          case 'DASHBOARD': return <DashboardPro items={items} onNavigate={setActiveTab} onOpenPdf={setGlobalPdfPreview} />;
          case 'CALENDAR': return <CalendarPro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'PROJECTS': return <ProjectsPro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'RESEARCH': return <ResearchStudio items={items} onUpdate={handleUpdate} onDelete={handleDelete} onSwitchToShare={() => setActiveTab('SHARE')} />;
          case 'CODE': return <CodeStudio items={items} onUpdate={handleUpdate} />;
          case 'FINANCE': return <FinancePro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'SHARE': return <NexusLink items={items} />;
          default: return null;
      }
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans selection:bg-nexus-primary selection:text-white">
        <StorageWidget />
        
        {/* Top Right Actions */}
        <div className="fixed top-4 right-4 z-[900] flex gap-2">
            <button onClick={() => setShowSpotlight(true)} className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white shadow-lg transition-all"><Icons.Search size={20}/></button>
            <button onClick={() => setShowSettings(true)} className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white shadow-lg transition-all"><Icons.Settings size={20}/></button>
        </div>

        <Spotlight items={items} isOpen={showSpotlight} onClose={() => setShowSpotlight(false)} onNavigate={setActiveTab} />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onExport={handleExport} />

        <div className="max-w-md mx-auto min-h-screen relative flex flex-col shadow-2xl bg-black">
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <ActiveComponent />
            </div>

            {/* Navigation Dock */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="glass-panel rounded-full p-2 px-4 flex items-center gap-4 shadow-2xl border border-white/10 backdrop-blur-2xl">
                    {[
                        { id: 'DASHBOARD', icon: Icons.Grid, color: 'text-nexus-muted' },
                        { id: 'CALENDAR', icon: Icons.Calendar, color: 'text-blue-400' },
                        { id: 'PROJECTS', icon: Icons.Layout, color: 'text-purple-400' },
                    ].map(btn => (
                        <button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`p-2 transition-all duration-300 hover:scale-110 ${activeTab === btn.id ? 'text-white' : 'text-nexus-muted/50'}`}>
                            <btn.icon size={22} />
                        </button>
                    ))}

                    <button 
                        onClick={() => setShowQuickAdd(true)}
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-nexus-primary to-blue-500 shadow-lg text-white flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all border-2 border-white/10"
                    >
                        <Icons.Plus size={24} />
                    </button>

                    {[
                        { id: 'RESEARCH', icon: Icons.BookOpen, color: 'text-pink-400' },
                        { id: 'CODE', icon: Icons.Code, color: 'text-green-400' },
                        { id: 'FINANCE', icon: Icons.CreditCard, color: 'text-yellow-400' },
                        { id: 'SHARE', icon: Icons.Cast, color: 'text-cyan-400' },
                    ].map(btn => (
                        <button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`p-2 transition-all duration-300 hover:scale-110 ${activeTab === btn.id ? 'text-white' : 'text-nexus-muted/50'}`}>
                            <btn.icon size={22} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Add Overlay */}
            {showQuickAdd && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-md bg-nexus-card border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Assistant Nexus</h3>
                            <button onClick={() => setShowQuickAdd(false)} className="p-2 bg-white/5 rounded-full text-nexus-muted"><Icons.X size={20}/></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); const t = (e.target as any).input.value; if(t) handleQuickAdd(t); }}>
                            <input name="input" autoFocus placeholder="Tâche, Note, Idée..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-nexus-primary outline-none mb-4" />
                            <NeonButton className="w-full py-4">
                                <Icons.Brain size={18}/> Analyser & Ajouter
                            </NeonButton>
                        </form>
                    </div>
                </div>
            )}

             {/* Global PDF Viewer Overlay */}
             {globalPdfPreview && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in">
                    <div className="h-14 flex justify-between items-center px-4 border-b border-white/10 bg-nexus-card/50">
                        <span className="text-white font-bold flex items-center gap-2"><Icons.File size={16}/> Lecteur Rapide</span>
                        <button onClick={() => setGlobalPdfPreview(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><Icons.X size={20}/></button>
                    </div>
                    <iframe src={globalPdfPreview} className="flex-1 w-full bg-white" title="Reader" />
                </div>
            )}
        </div>
    );
};