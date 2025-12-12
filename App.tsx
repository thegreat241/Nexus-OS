import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './components/icons';
import { AppMode, Collection, ItemType, AnyItem, TaskItem, CalendarItem, ProjectItem, ResearchItem, CodeItem, TransactionItem } from './types';
import * as StorageService from './services/storageService';
import { parseLocalInput } from './services/localParser';

// --- COMPONENTS SYSTEM ---

const GlassCard: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, noPadding?: boolean }> = ({ children, className = '', onClick, noPadding }) => (
    <div onClick={onClick} className={`glass-panel rounded-2xl border border-white/5 shadow-xl backdrop-blur-xl bg-nexus-card/40 ${noPadding ? '' : 'p-5'} ${className} transition-all duration-300 hover:border-white/10`}>
        {children}
    </div>
);

const NeonButton: React.FC<{ children: React.ReactNode, onClick?: () => void, type?: "button" | "submit", variant?: 'primary' | 'secondary' | 'danger', className?: string, size?: 'sm' | 'md' }> = ({ children, onClick, type = "button", variant = 'primary', className = '', size = 'md' }) => {
    const base = "rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-gradient-to-r from-nexus-primary to-blue-600 text-white shadow-nexus-primary/20 hover:shadow-nexus-primary/40 border border-white/10",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/20",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
    };
    const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-3 text-sm" };
    
    return (
        <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
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

// --- MODULE: CODE STUDIO ---

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
        if(!activeCode) {
            setActiveCode(newItem); 
        }
    };

    const loadCode = (item: CodeItem) => {
        setActiveCode(item);
        setTitle(item.content);
        setCodeContent(item.code);
    };

    return (
        <div className="h-full flex flex-col p-4 pb-28 gap-4">
            <SectionHeader title="Code Studio" subtitle="HTML/CSS/JS Playground" icon={Icons.Code} 
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
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom du fichier..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-nexus-primary outline-none"/>
                        <NeonButton onClick={handleSave}><Icons.Save size={16}/> Sauvegarder</NeonButton>
                    </div>
                    
                    <div className="flex-1 grid grid-rows-2 gap-4 min-h-[400px]">
                        <div className="relative group flex flex-col">
                             <div className="flex justify-between items-center mb-1 px-1">
                                <span className="text-xs text-nexus-muted uppercase">Source</span>
                             </div>
                             <textarea 
                                value={codeContent} 
                                onChange={e => setCodeContent(e.target.value)} 
                                className="w-full h-full bg-[#1e1e1e] text-green-400 font-mono p-4 rounded-xl border border-white/10 focus:border-nexus-primary outline-none resize-none text-sm leading-relaxed"
                                spellCheck={false}
                             />
                        </div>
                        
                        {/* Preview Window with Full Screen Logic */}
                        <div className={`relative bg-white rounded-xl overflow-hidden border border-white/10 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[1000] rounded-none w-screen h-screen' : ''}`}>
                            <div className="absolute top-2 right-2 flex gap-2 z-20">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 bg-black/80 text-white rounded-full hover:bg-nexus-primary shadow-lg border border-white/10 backdrop-blur">
                                    {isFullScreen ? <Icons.Minimize2 size={20}/> : <Icons.Maximize2 size={20}/>}
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 text-xs text-black bg-white/80 px-2 rounded shadow pointer-events-none z-10">Prévisualisation</div>
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

// --- MODULE: NOTES & RESEARCH (PDF Reader + Full Height) ---

const ResearchStudio: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [activeNote, setActiveNote] = useState<ResearchItem | null>(null);
    const [form, setForm] = useState({ title: '', subtitle: '', content: '', sources: '' });
    const [attachments, setAttachments] = useState<{name: string, url?: string}[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [pdfPreview, setPdfPreview] = useState<string | null>(null);

    const openNote = (note: ResearchItem) => {
        setActiveNote(note);
        setForm({
            title: note.content,
            subtitle: note.subtitle || '',
            content: note.type === ItemType.NOTE ? (note as any).body || '' : '', 
            sources: note.sources?.join('\n') || ''
        });
        // Remap string[] to object with url undefined (persistance sim)
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

    return (
        <div className="h-full flex flex-col sm:flex-row pb-20 sm:pb-0 overflow-hidden relative">
            {/* Sidebar List */}
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

            {/* Main Editor */}
            <div className={`${!sidebarOpen || activeNote ? 'flex' : 'hidden'} sm:flex flex-1 flex-col h-full bg-nexus-bg relative z-10`}>
                {!activeNote ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-nexus-muted">
                        <Icons.Edit3 size={48} className="mb-4 opacity-20"/>
                        <p>Sélectionnez ou créez une note</p>
                        <button onClick={handleCreateNew} className="mt-4 text-nexus-primary hover:underline">Créer maintenant</button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in">
                        {/* Toolbar */}
                        <div className="p-3 border-b border-white/5 flex justify-between items-center bg-nexus-bg/50 backdrop-blur">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sm:hidden p-2 text-white"><Icons.Menu size={20}/></button>
                                <span className="text-xs text-nexus-muted uppercase tracking-widest hidden sm:block">Éditeur</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDeleteCurrent} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Icons.Trash2 size={18}/></button>
                                <NeonButton size="sm" onClick={handleSave}><Icons.Save size={16}/> Enregistrer</NeonButton>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
                            <input 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                                placeholder="Titre de la note..." 
                                className="w-full bg-transparent text-3xl font-bold text-white placeholder-white/20 outline-none border-none flex-shrink-0"
                            />
                            <input 
                                value={form.subtitle} 
                                onChange={e => setForm({...form, subtitle: e.target.value})} 
                                placeholder="Sous-titre ou sujet..." 
                                className="w-full bg-transparent text-xl font-medium text-nexus-primary placeholder-nexus-primary/30 outline-none border-none flex-shrink-0"
                            />
                            
                            <div className="w-full h-px bg-white/10 my-2 flex-shrink-0"></div>

                            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                                {/* Text Area - Maximized */}
                                <div className="flex-1 relative h-full flex flex-col">
                                    <textarea 
                                        value={form.content} 
                                        onChange={e => setForm({...form, content: e.target.value})} 
                                        className="w-full flex-1 bg-transparent text-nexus-text text-base leading-relaxed outline-none resize-none p-2"
                                        placeholder="Commencez à écrire..."
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                         <button onClick={handlePaste} className="bg-nexus-card border border-white/10 p-2 rounded-full shadow-lg text-nexus-muted hover:text-white" title="Coller"><Icons.Copy size={16}/></button>
                                    </div>
                                </div>

                                {/* Meta Side */}
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
                                                <div key={i} className="flex items-center gap-2 text-xs text-white bg-black/20 p-2 rounded truncate group">
                                                    <span className="truncate flex-1">{a.name}</span>
                                                    {a.name.toLowerCase().endsWith('.pdf') && (
                                                        <button 
                                                            onClick={() => a.url && setPdfPreview(a.url)}
                                                            className="text-nexus-primary hover:text-white"
                                                            title="Lire le PDF"
                                                        >
                                                            <Icons.BookOpen size={12}/>
                                                        </button>
                                                    )}
                                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}><Icons.X size={12} className="text-red-400"/></button>
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

            {/* PDF Viewer Overlay */}
            {pdfPreview && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col">
                    <div className="h-12 flex justify-between items-center px-4 border-b border-white/10 bg-nexus-card">
                        <span className="text-white font-bold">Lecteur PDF</span>
                        <button onClick={() => setPdfPreview(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><Icons.X size={20}/></button>
                    </div>
                    <iframe src={pdfPreview} className="flex-1 w-full bg-white" title="PDF Reader" />
                </div>
            )}
        </div>
    );
};

// --- MODULE: FINANCE PRO (Restored) ---

const FinancePro: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ desc: '', amount: '', type: 'EXPENSE' }); // EXPENSE or INCOME

    const transactions = items.filter(i => i.type === ItemType.TRANSACTION) as TransactionItem[];
    
    // Calculs
    const income = transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.desc || !form.amount) return;
        
        const newItem: TransactionItem = {
            id: Date.now().toString(),
            type: ItemType.TRANSACTION,
            content: form.desc,
            amount: parseFloat(form.amount),
            currency: 'XOF',
            category: 'Général',
            isExpense: form.type === 'EXPENSE',
            date: Date.now(),
            createdAt: Date.now(),
            tags: []
        };
        onUpdate(newItem);
        setShowModal(false);
        setForm({ desc: '', amount: '', type: 'EXPENSE' });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in">
             <SectionHeader 
                title="Finance" 
                subtitle="Gestion Budgétaire" 
                icon={Icons.CreditCard} 
                rightAction={
                    <NeonButton size="sm" onClick={() => setShowModal(true)}>
                        <Icons.Plus size={18}/> Transaction
                    </NeonButton>
                }
            />

            {/* Balance Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-600/20 to-orange-900/20 border border-white/10 p-6 shadow-2xl">
                 <div className="relative z-10 text-center">
                    <p className="text-nexus-muted text-sm uppercase tracking-widest mb-1">Solde Actuel</p>
                    <h2 className={`text-4xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatMoney(balance)}</h2>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-nexus-muted">Revenus</span>
                        </div>
                        <p className="text-lg font-bold text-green-400">{formatMoney(income)}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs text-nexus-muted">Dépenses</span>
                        </div>
                        <p className="text-lg font-bold text-red-400">{formatMoney(expense)}</p>
                    </div>
                 </div>
            </div>

            {/* Recent Transactions */}
            <div>
                <h3 className="text-white font-bold mb-4">Récemment</h3>
                <div className="space-y-3">
                    {transactions.length === 0 && <p className="text-nexus-muted text-sm text-center py-4">Aucune transaction.</p>}
                    {transactions.sort((a,b) => b.date - a.date).map(t => (
                        <GlassCard key={t.id} className="flex justify-between items-center" noPadding>
                            <div className="p-4 flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.isExpense ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {t.isExpense ? <Icons.ArrowDown size={18}/> : <Icons.ArrowUp size={18}/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{t.content}</p>
                                        <p className="text-[10px] text-nexus-muted">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${t.isExpense ? 'text-red-400' : 'text-green-400'}`}>
                                        {t.isExpense ? '-' : '+'}{formatMoney(t.amount)}
                                    </p>
                                    <button onClick={() => onDelete(t.id)} className="text-[10px] text-nexus-muted hover:text-red-400">Supprimer</button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Nouvelle Transaction</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                                <button type="button" onClick={() => setForm({...form, type: 'EXPENSE'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.type === 'EXPENSE' ? 'bg-red-500 text-white' : 'text-nexus-muted'}`}>Dépense</button>
                                <button type="button" onClick={() => setForm({...form, type: 'INCOME'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.type === 'INCOME' ? 'bg-green-500 text-white' : 'text-nexus-muted'}`}>Revenu</button>
                            </div>
                            <input autoFocus placeholder="Description (ex: Loyer)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <input type="number" placeholder="Montant (FCFA)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <div className="flex gap-2">
                                <NeonButton className="flex-1" type="submit">Ajouter</NeonButton>
                                <NeonButton variant="secondary" type="button" onClick={() => setShowModal(false)}>Annuler</NeonButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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

// --- MODULE: DASHBOARD (HOME) ---

const DashboardPro: React.FC<{ items: AnyItem[], onNavigate: (t: string) => void }> = ({ items, onNavigate }) => {
    const today = new Date();
    const tasks = items.filter(i => i.type === ItemType.TASK && (i as TaskItem).status !== 'DONE') as TaskItem[];
    const codes = items.filter(i => i.type === ItemType.CODE).slice(0, 2) as CodeItem[];
    const notes = items.filter(i => i.type === ItemType.NOTE).slice(0, 2) as ResearchItem[];
    
    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in duration-500">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nexus-primary/20 to-purple-900/20 border border-white/10 p-6 shadow-2xl">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-1">Nexus OS</h2>
                    <p className="text-nexus-muted mb-4">Espace de Travail Unifié</p>
                    <div className="flex gap-3">
                         <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                            <Icons.Code size={14} className="text-green-400" />
                            <span className="text-xs text-white">{items.filter(i=>i.type===ItemType.CODE).length} Snippets</span>
                        </div>
                         <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                            <Icons.BookOpen size={14} className="text-purple-400" />
                            <span className="text-xs text-white">{items.filter(i=>i.type===ItemType.NOTE).length} Notes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shortcuts Grid */}
            <div className="grid grid-cols-2 gap-4">
                 <GlassCard onClick={() => onNavigate('CODE')} className="cursor-pointer group hover:bg-white/5">
                    <Icons.Code size={24} className="text-green-400 mb-2 group-hover:scale-110 transition-transform"/>
                    <h4 className="font-bold text-white">Code Studio</h4>
                    <p className="text-xs text-nexus-muted">{codes.length > 0 ? 'Reprendre le travail' : 'Nouveau script'}</p>
                </GlassCard>
                <GlassCard onClick={() => onNavigate('RESEARCH')} className="cursor-pointer group hover:bg-white/5">
                    <Icons.BookOpen size={24} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform"/>
                    <h4 className="font-bold text-white">Recherche</h4>
                    <p className="text-xs text-nexus-muted">Notes & Sources</p>
                </GlassCard>
            </div>

            {/* Recent Code & Notes */}
            <div className="grid grid-cols-1 gap-4">
                <h3 className="font-bold text-white px-1">Accès Rapide</h3>
                {codes.map(c => (
                    <div key={c.id} onClick={() => onNavigate('CODE')} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-nexus-primary/50">
                        <div className="p-2 bg-green-500/10 text-green-400 rounded-lg"><Icons.Code size={16}/></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">{c.content}</p>
                            <p className="text-[10px] text-nexus-muted">HTML/JS</p>
                        </div>
                        <Icons.ArrowRight size={14} className="text-white/30"/>
                    </div>
                ))}
                {notes.map(n => (
                    <div key={n.id} onClick={() => onNavigate('RESEARCH')} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-nexus-primary/50">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Icons.FileText size={16}/></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">{n.content}</p>
                            <p className="text-[10px] text-nexus-muted">Note de recherche</p>
                        </div>
                        <Icons.ArrowRight size={14} className="text-white/30"/>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MODULE: PROJECT HUB PRO (Bug Fixed) ---

const ProjectsPro: React.FC<{ items: AnyItem[], onUpdate: (item: AnyItem) => void, onDelete: (id: string) => void }> = ({ items, onUpdate, onDelete }) => {
    const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    
    // Etats des formulaires (sortis des composants internes pour éviter le re-rendu)
    const [newProjectForm, setNewProjectForm] = useState({ name: '', desc: '', deadline: '' });
    const [taskModal, setTaskModal] = useState<{open: boolean, columnId: string, projectId: string}>({ open: false, columnId: 'TODO', projectId: '' });
    const [taskForm, setTaskForm] = useState({ content: '', priority: 'MEDIUM' });

    const handleCreateProject = () => {
        if(!newProjectForm.name) return;
        onUpdate({ 
            id: Date.now().toString(), 
            type: ItemType.PROJECT, 
            name: newProjectForm.name, 
            content: newProjectForm.desc, 
            progress: 0, 
            deadline: newProjectForm.deadline ? new Date(newProjectForm.deadline).getTime() : undefined,
            members: [], createdAt: Date.now(), tags: [] 
        } as ProjectItem);
        setShowNewProjectModal(false);
        setNewProjectForm({ name: '', desc: '', deadline: '' }); // Reset
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if(taskForm.content) {
            onUpdate({ 
                id: Date.now().toString(), type: ItemType.TASK, 
                content: taskForm.content, status: taskModal.columnId, projectId: taskModal.projectId, 
                createdAt: Date.now(), tags: [], priority: taskForm.priority as any
            } as TaskItem);
            setTaskModal({ ...taskModal, open: false });
            setTaskForm({ content: '', priority: 'MEDIUM' }); // Reset
        }
    };

    const projects = items.filter(i => i.type === ItemType.PROJECT) as ProjectItem[];

    // --- Detail View (Kanban) ---
    if (activeProject) {
        const pTasks = items.filter(i => i.type === ItemType.TASK && i.projectId === activeProject.id) as TaskItem[];
        const columns = [
            { id: 'TODO', title: 'À Faire', color: 'border-nexus-muted' },
            { id: 'IN_PROGRESS', title: 'En Cours', color: 'border-blue-500' },
            { id: 'DONE', title: 'Terminé', color: 'border-green-500' }
        ];

        return (
            <div className="h-full flex flex-col bg-nexus-bg pb-20">
                <div className="p-6 pb-2 sticky top-0 bg-nexus-bg/95 backdrop-blur z-20">
                    <button onClick={() => setActiveProject(null)} className="flex items-center gap-2 text-nexus-muted hover:text-white mb-4 transition-colors">
                        <Icons.ChevronLeft size={16}/> Retour aux projets
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">{activeProject.name}</h2>
                            <p className="text-sm text-nexus-muted max-w-xs line-clamp-1">{activeProject.content}</p>
                        </div>
                    </div>
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3 mt-6 mb-4">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="block text-xl font-bold text-white">{pTasks.filter(t => t.status === 'DONE').length}</span>
                            <span className="text-[10px] text-nexus-muted uppercase">Terminées</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="block text-xl font-bold text-nexus-primary">{pTasks.length}</span>
                            <span className="text-[10px] text-nexus-muted uppercase">Total Tâches</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="block text-xl font-bold text-red-400">{activeProject.deadline ? Math.ceil((activeProject.deadline - Date.now())/(1000*60*60*24)) : '-'}</span>
                            <span className="text-[10px] text-nexus-muted uppercase">Jours Rest.</span>
                        </div>
                    </div>
                </div>

                {/* Kanban Horizontal Scroll */}
                <div className="flex-1 overflow-x-auto px-6 pb-6 flex gap-4 snap-x">
                    {columns.map(col => (
                        <div key={col.id} className="min-w-[280px] w-[80%] flex flex-col snap-center">
                            <div className={`border-t-2 ${col.color} pt-3 mb-4 flex justify-between`}>
                                <h3 className="font-bold text-white">{col.title}</h3>
                                <span className="text-xs text-nexus-muted bg-white/5 px-2 py-0.5 rounded">{pTasks.filter(t => t.status === col.id).length}</span>
                            </div>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setTaskModal({ open: true, columnId: col.id, projectId: activeProject.id })}
                                    className="w-full py-3 border border-dashed border-white/20 rounded-xl text-nexus-muted hover:border-nexus-primary hover:text-nexus-primary transition-colors text-sm"
                                >
                                    + Ajouter Tâche
                                </button>
                                {pTasks.filter(t => t.status === col.id).map(task => (
                                    <GlassCard key={task.id} className="group cursor-grab active:cursor-grabbing hover:border-nexus-primary/50 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${task.priority === 'HIGH' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-white/10 text-gray-400'}`}>
                                                {task.priority || 'NORMAL'}
                                            </span>
                                            <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Icons.X size={14}/></button>
                                        </div>
                                        <p className="text-sm text-white font-medium mb-3">{task.content}</p>
                                        <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                                            {col.id !== 'TODO' && <button onClick={() => onUpdate({...task, status: 'TODO'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">À Faire</button>}
                                            {col.id !== 'IN_PROGRESS' && <button onClick={() => onUpdate({...task, status: 'IN_PROGRESS'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">En Cours</button>}
                                            {col.id !== 'DONE' && <button onClick={() => onUpdate({...task, status: 'DONE'})} className="flex-1 text-[10px] text-center bg-white/5 py-1 rounded hover:bg-white/10">Fini</button>}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Task Modal Inline */}
                {taskModal.open && (
                    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-white font-bold mb-4">Nouvelle Tâche</h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <input autoFocus placeholder="Description de la tâche..." value={taskForm.content} onChange={e => setTaskForm({...taskForm, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                                <div className="flex gap-2">
                                     {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                         <button key={p} type="button" onClick={() => setTaskForm({...taskForm, priority: p})} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${taskForm.priority === p ? 'bg-nexus-primary border-nexus-primary text-white' : 'bg-transparent border-white/10 text-nexus-muted'}`}>{p}</button>
                                     ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <NeonButton type="submit" className="flex-1">Ajouter</NeonButton>
                                    <NeonButton type="button" variant="secondary" onClick={() => setTaskModal({...taskModal, open: false})}>Annuler</NeonButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- List View ---
    return (
        <div className="p-6 pb-28 space-y-6 animate-in fade-in">
             <SectionHeader 
                title="Projets" 
                subtitle="Gestion & Roadmap" 
                icon={Icons.Layout} 
                rightAction={
                    <NeonButton size="sm" onClick={() => setShowNewProjectModal(true)}>
                        <Icons.Plus size={18}/> Nouveau
                    </NeonButton>
                }
            />

            <div className="grid grid-cols-1 gap-5">
                {projects.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl">
                        <Icons.Layout className="mx-auto text-nexus-muted mb-3" size={40}/>
                        <p className="text-nexus-muted">Aucun projet actif.</p>
                    </div>
                )}
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
                                <p className="text-sm text-nexus-muted mb-4 line-clamp-2">{p.content}</p>
                                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2">
                                    <div className="bg-nexus-primary h-full" style={{ width: `${percent}%` }}></div>
                                </div>
                             </div>
                        </GlassCard>
                    );
                })}
            </div>

            {/* New Project Modal Inline */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-nexus-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-4">Nouveau Projet</h3>
                        <div className="space-y-4">
                            <input autoFocus placeholder="Nom du projet" value={newProjectForm.name} onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary"/>
                            <textarea placeholder="Description courte" value={newProjectForm.desc} onChange={e => setNewProjectForm({...newProjectForm, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-nexus-primary h-20"/>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-nexus-muted">Deadline</label>
                                <input type="date" value={newProjectForm.deadline} onChange={e => setNewProjectForm({...newProjectForm, deadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white"/>
                            </div>
                            <div className="flex gap-2">
                                <NeonButton className="flex-1" onClick={handleCreateProject}>Créer</NeonButton>
                                <NeonButton variant="secondary" onClick={() => setShowNewProjectModal(false)}>Annuler</NeonButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN LAYOUT & APP ---

const NexusApp = () => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [items, setItems] = useState<AnyItem[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
      const cols = StorageService.getCollections();
      let allItems: AnyItem[] = [];
      cols.forEach(c => allItems.push(...StorageService.getItems(c.id)));
      setItems(allItems);
  }, []);

  const handleUpdate = (item: AnyItem) => {
      setItems(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) return prev.map(i => i.id === item.id ? item : i);
        return [item, ...prev]; // Add new items to top
      });
      StorageService.saveItem('1', item); 
  };

  const handleDelete = (id: string) => {
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleQuickAdd = (text: string) => {
      const parsed = parseLocalInput(text);
      const newItem = {
          id: Date.now().toString(),
          createdAt: Date.now(),
          tags: [],
          type: parsed.type,
          content: text,
          ...parsed.data
      } as AnyItem;
      handleUpdate(newItem);
      setShowQuickAdd(false);
  };

  const ActiveComponent = () => {
      switch(activeTab) {
          case 'DASHBOARD': return <DashboardPro items={items} onNavigate={setActiveTab} />;
          case 'CALENDAR': return <CalendarPro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'PROJECTS': return <ProjectsPro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'RESEARCH': return <ResearchStudio items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          case 'CODE': return <CodeStudio items={items} onUpdate={handleUpdate} />;
          case 'FINANCE': return <FinancePro items={items} onUpdate={handleUpdate} onDelete={handleDelete} />;
          default: return null;
      }
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans selection:bg-nexus-primary selection:text-white">
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
        </div>
    </div>
  );
};

export default NexusApp;