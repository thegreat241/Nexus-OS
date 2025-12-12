import { ItemType } from "../types";

// Analyseur "Intelligent" Local
// Détecte le contexte basé sur des mots clés naturels

export const parseLocalInput = (text: string): { type: ItemType, data?: any } => {
  const lower = text.trim().toLowerCase();
  
  // 1. Détection Finance (Commence par un nombre ou contient des mots clés financiers)
  // Ex: "5000 courses" ou "250000 Salaire"
  // Note: En FCFA, on utilise rarement les décimales pour la saisie courante
  const amountMatch = text.match(/^(\d+([.,]\d+)?)\s+(.*)$/); 
  const moneyKeywords = ['achat', 'payé', 'dépense', 'coût', 'prix', 'virement', 'reçu', 'salaire', 'facture'];
  
  if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/\s/g, '').replace(',', '.'));
      const desc = amountMatch[3];
      return {
          type: ItemType.TRANSACTION,
          data: { 
              amount, 
              content: desc, 
              isExpense: true, 
              category: 'Général',
              currency: 'XOF' 
          }
      };
  }

  // 2. Détection Tâche (Verbes d'action ou mots clés)
  const taskKeywords = ['faire', 'acheter', 'appeler', 'envoyer', 'rédiger', 'finir', 'checker', 'todo', 'penser à', 'projet'];
  if (taskKeywords.some(k => lower.startsWith(k))) {
      return {
          type: ItemType.TASK,
          data: { content: text, status: 'TODO' }
      };
  }

  // 3. Détection Événement (Temps)
  const timeKeywords = ['demain', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche', 'à 10h', 'à 14h', 'réunion', 'rdv', 'rendez-vous'];
  if (timeKeywords.some(k => lower.includes(k))) {
       const now = new Date();
       const tomorrow = new Date(now);
       tomorrow.setDate(tomorrow.getDate() + 1);
       
       return {
           type: ItemType.EVENT,
           data: { 
               content: text, 
               startTime: tomorrow.getTime(), 
               endTime: tomorrow.getTime() + 3600000 
           }
       };
  }

  // 4. Par défaut : Note (Recherche)
  return { type: ItemType.NOTE, data: { content: text } };
};