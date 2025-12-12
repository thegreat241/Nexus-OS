export enum AppMode {
  RESEARCH = 'RESEARCH',
  FINANCE = 'FINANCE',
  CALENDAR = 'CALENDAR',
  PROJECTS = 'PROJECTS',
  CODE = 'CODE'
}

export enum ItemType {
  NOTE = 'NOTE',
  FILE = 'FILE',
  TRANSACTION = 'TRANSACTION',
  EVENT = 'EVENT',
  TASK = 'TASK',
  GOAL = 'GOAL',
  PROJECT = 'PROJECT',
  CODE = 'CODE'
}

export interface BaseItem {
  id: string;
  createdAt: number;
  content: string; // Used as main body or H1 for notes
  tags: string[];
}

export interface ResearchItem extends BaseItem {
  type: ItemType.NOTE | ItemType.FILE;
  subtitle?: string; // H2
  sources?: string[]; // Liens
  attachments?: string[]; // Noms des fichiers simulés
  fileName?: string;
  fileType?: string;
}

export interface CodeItem extends BaseItem {
  type: ItemType.CODE;
  language: 'html' | 'javascript' | 'css' | 'json';
  code: string;
}

export interface TransactionItem extends BaseItem {
  type: ItemType.TRANSACTION;
  amount: number;
  currency: string;
  category: string;
  isExpense: boolean;
  date: number; 
}

export interface CalendarItem extends BaseItem {
  type: ItemType.EVENT;
  startTime: number;
  endTime: number;
  location?: string;
  allDay?: boolean;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  reminders?: number[]; // Minutes avant
}

export interface TaskItem extends BaseItem {
  type: ItemType.TASK;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: number;
  projectId?: string;
  assignee?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ProjectItem extends BaseItem {
  type: ItemType.PROJECT;
  name: string;
  deadline?: number;
  progress: number; // 0-100
  members: string[]; 
}

export interface GoalItem extends BaseItem {
  type: ItemType.GOAL;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
}

export type AnyItem = ResearchItem | TransactionItem | CalendarItem | TaskItem | GoalItem | ProjectItem | CodeItem;

export interface Collection {
  id: string;
  name: string;
  mode: AppMode;
  description: string;
  icon?: string;
  pinned?: boolean;
}