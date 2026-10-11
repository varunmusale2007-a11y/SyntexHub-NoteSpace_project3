/**
 * NoteSpace - Storage Module
 * Handles local storage persistence, data validation, and default seeds.
 */

const STORAGE_KEYS = {
  NOTES: 'notespace_notes_v1',
  CATEGORIES: 'notespace_categories_v1',
  THEME: 'notespace_theme_v1',
  VIEW_MODE: 'notespace_view_v1',
  SORT_MODE: 'notespace_sort_v1'
};

const DEFAULT_CATEGORIES = ['All', 'Personal', 'Work', 'Ideas', 'Study', 'To-Do'];

const DEFAULT_NOTES = [
  {
    id: 'note_seed_1',
    title: '👋 Welcome to NoteSpace!',
    content: 'Welcome to your modern workspace for thoughts, plans, and ideas.\n\n✨ Features at a glance:\n• Clean, distraction-free markdown-friendly editor\n• Color-coded notes & category tags\n• Real-time autosave with word & character counters\n• Instant fuzzy search across titles & content\n• Pin important notes to keep them on top\n• Safe Trash Bin with restore & permanent delete\n• Gorgeous Light & Dark theme toggle\n\nClick any note to open and edit it, or press "New Note" to create your next big idea!',
    category: 'Ideas',
    color: 'purple',
    isPinned: true,
    isTrashed: false,
    tags: ['welcome', 'guide', 'features'],
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'note_seed_2',
    title: '🚀 Project Roadmap & Milestones',
    content: 'Key deliverables for Q4:\n\n1. Design System Architecture\n   - Finalize purple & indigo gradient accents\n   - Ensure AAA accessible contrast ratios\n\n2. Core Performance\n   - Sub-millisecond search query filtering\n   - Zero external backend dependencies\n\n3. Responsive Testing\n   - Touch targets 48px minimum on mobile devices\n   - Smooth drawer animations on tablets\n\nTarget ship date: End of this month.',
    category: 'Work',
    color: 'indigo',
    isPinned: true,
    isTrashed: false,
    tags: ['roadmap', 'q4', 'planning'],
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'note_seed_3',
    title: '🌱 Habits for Deep Focus',
    content: 'Notes from "Deep Work" and personal reflections:\n\n• Turn off notifications during 90-minute morning focus sprint.\n• Keep a quick scratchpad (like NoteSpace!) for intrusive thoughts.\n• Take a 10-minute walk without screens after deep coding sessions.\n• Review and archive finished notes every Friday afternoon.',
    category: 'Personal',
    color: 'emerald',
    isPinned: false,
    isTrashed: false,
    tags: ['habits', 'productivity', 'books'],
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'note_seed_4',
    title: '📚 Vanilla JS Concepts to Review',
    content: 'Essential Web APIs & Modern Patterns:\n\n- Event Delegation pattern for high-performance lists\n- Debounce & Throttle for real-time input fields\n- LocalStorage quota handling & try/catch safety\n- CSS Custom Properties + data-theme dynamic switching\n- Custom DOM element creation without innerHTML XSS vulnerabilities',
    category: 'Study',
    color: 'amber',
    isPinned: false,
    isTrashed: false,
    tags: ['javascript', 'frontend', 'revision'],
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'note_seed_5',
    title: '🛒 Weekly Grocery & Supplies',
    content: 'Weekly restock list:\n\n- Organic Greek yogurt & almond milk\n- Fresh blueberries, avocados, and baby spinach\n- Espresso roast whole beans ☕\n- Dark chocolate (85% cacao)\n- Notebook refills & fine-tip gel pens',
    category: 'To-Do',
    color: 'rose',
    isPinned: false,
    isTrashed: false,
    tags: ['errands', 'shopping'],
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
        this.saveNotes(DEFAULT_NOTES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        this.saveCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      console.warn('LocalStorage access is restricted or unavailable:', e);
    }
  }

  getNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (!data) return DEFAULT_NOTES;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_NOTES;
    } catch (e) {
      console.error('Error reading notes from localStorage:', e);
      return DEFAULT_NOTES;
    }
  }

  saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      return true;
    } catch (e) {
      console.error('Error saving notes to localStorage:', e);
      return false;
    }
  }

  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  saveCategories(categories) {
    try {
      // Ensure 'All' is always present
      const clean = Array.from(new Set(['All', ...categories.filter(c => c && c.trim())]));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(clean));
      return true;
    } catch (e) {
      console.error('Error saving categories:', e);
      return false;
    }
  }

  addCategory(newCategory) {
    const trimmed = newCategory.trim();
    if (!trimmed) return false;
    const current = this.getCategories();
    if (current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      return false; // already exists
    }
    current.push(trimmed);
    this.saveCategories(current);
    return true;
  }

  deleteCategory(categoryName) {
    if (categoryName === 'All') return false;
    const current = this.getCategories().filter(c => c !== categoryName);
    this.saveCategories(current);

    // Reassign notes under this category to 'General' or 'All'
    const notes = this.getNotes();
    const updated = notes.map(n => {
      if (n.category === categoryName) {
        return { ...n, category: 'Personal', updatedAt: new Date().toISOString() };
      }
      return n;
    });
    this.saveNotes(updated);
    return true;
  }

  getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    } catch (e) {
      return 'light';
    }
  }

  setTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  }

  getViewMode() {
    try {
      return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'grid';
    } catch (e) {
      return 'grid';
    }
  }

  setViewMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    } catch (e) {
      console.error('Error saving view mode:', e);
    }
  }

  getSortMode() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SORT_MODE) || 'updated-desc';
    } catch (e) {
      return 'updated-desc';
    }
  }

  setSortMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEYS.SORT_MODE, mode);
    } catch (e) {
      console.error('Error saving sort mode:', e);
    }
  }

  getNoteById(id) {
    const notes = this.getNotes();
    return notes.find(n => n.id === id) || null;
  }

  createNote(noteData) {
    const notes = this.getNotes();
    const now = new Date().toISOString();
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      title: (noteData.title || '').trim() || 'Untitled Note',
      content: noteData.content || '',
      category: noteData.category || 'Personal',
      color: noteData.color || 'default',
      isPinned: Boolean(noteData.isPinned),
      isTrashed: false,
      tags: Array.isArray(noteData.tags) ? noteData.tags : [],
      createdAt: now,
      updatedAt: now
    };
    notes.unshift(newNote);
    this.saveNotes(notes);
    return newNote;
  }

  updateNote(id, updates) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    const existing = notes[index];
    const updatedNote = {
      ...existing,
      ...updates,
      title: updates.title !== undefined ? (updates.title.trim() || 'Untitled Note') : existing.title,
      updatedAt: new Date().toISOString()
    };
    notes[index] = updatedNote;
    this.saveNotes(notes);
    return updatedNote;
  }

  togglePin(id) {
    const note = this.getNoteById(id);
    if (!note) return null;
    return this.updateNote(id, { isPinned: !note.isPinned });
  }

  moveToTrash(id) {
    const note = this.getNoteById(id);
    if (!note) return null;
    return this.updateNote(id, { isTrashed: true, isPinned: false });
  }

  restoreFromTrash(id) {
    const note = this.getNoteById(id);
    if (!note) return null;
    return this.updateNote(id, { isTrashed: false });
  }

  deletePermanently(id) {
    const notes = this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    this.saveNotes(filtered);
    return true;
  }

  emptyTrash() {
    const notes = this.getNotes();
    const activeOnly = notes.filter(n => !n.isTrashed);
    this.saveNotes(activeOnly);
    return true;
  }

  exportBackup() {
    const payload = {
      version: 1,
      appName: 'NoteSpace',
      exportedAt: new Date().toISOString(),
      notes: this.getNotes(),
      categories: this.getCategories()
    };
    return JSON.stringify(payload, null, 2);
  }

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.notes)) {
        throw new Error('Invalid backup file format: missing notes array');
      }
      this.saveNotes(data.notes);
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      return { success: true, count: data.notes.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.NOTES);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      this.init();
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Global storage instance
window.storage = new StorageManager();
