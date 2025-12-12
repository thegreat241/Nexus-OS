import { AnyItem, ItemType, ResearchItem } from "../types";

// Simulation d'un moteur de recherche sémantique (Style Voyager / TensorFlow.js)
// Dans une implémentation réelle, on chargerait un modèle WASM ici.

export const generateEmbedding = (text: string): number[] => {
    // Simulation: création d'un vecteur simple basé sur le hash des mots
    // Ceci remplace l'appel à un modèle "universal-sentence-encoder" pour la démo
    const vector = new Array(50).fill(0);
    const words = text.toLowerCase().split(/\W+/);
    words.forEach(w => {
        const hash = w.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 50;
        vector[hash] += 1;
    });
    return vector;
};

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
};

export const semanticSearch = (query: string, items: AnyItem[]): AnyItem[] => {
    // 1. Vectoriser la requête
    const queryVector = generateEmbedding(query);
    
    // 2. Vectoriser les items (ceux de type NOTE ou FILE)
    const candidates = items.filter(i => i.type === ItemType.NOTE || i.type === ItemType.FILE) as ResearchItem[];
    
    // 3. Calculer la similarité
    const ranked = candidates.map(item => {
        // En prod, l'embedding de l'item serait déjà stocké dans SQLite
        const itemVector = generateEmbedding(item.content + " " + (item.fileName || ""));
        const score = cosineSimilarity(queryVector, itemVector);
        return { item, score };
    });

    // 4. Trier et filtrer
    return ranked
        .filter(r => r.score > 0.1) // Seuil de pertinence
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);
};