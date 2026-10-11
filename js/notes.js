/**
 * NoteSpace - Notes Helper & Logic Module
 * Provides filtering, sorting, date formatting, statistics, and safe DOM builders.
 */

const COLOR_MAP = {
  default: { name: 'Neutral Slate', class: 'note-color-default', hex: '#64748b' },
  purple: { name: 'Lavender Purple', class: 'note-color-purple', hex: '#8b5cf6' },
  indigo: { name: 'Royal Indigo', class: 'note-color-indigo', hex: '#6366f1' },
  emerald: { name: 'Fresh Emerald', class: 'note-color-emerald', hex: '#10b981' },
  amber: { name: 'Warm Amber', class: 'note-color-amber', hex: '#f59e0b' },
  rose: { name: 'Blush Rose', class: 'note-color-rose', hex: '#f43f5e' },
  cyan: { name: 'Sky Cyan', class: 'note-color-cyan', hex: '#06b6d4' }
};

class NotesHelper {
  static getColors() {
    return Object.keys(COLOR_MAP).map(key => ({
      id: key,
      ...COLOR_MAP[key]
    }));
  }

  static getColorClass(colorKey) {
    return (COLOR_MAP[colorKey] && COLOR_MAP[colorKey].class) || 'note-color-default';
  }

  static countWordsAndChars(text = '') {
    const trimmed = text.trim();
    const chars = text.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMinutes };
  }

  static formatRelativeTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (e) {
      return '';
    }
  }

  static formatFullDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return '';
    }
  }

  static filterNotes(notes, { filter = 'all', category = 'All', searchQuery = '', tag = '' }) {
    return notes.filter(note => {
      // 1. Trash filter
      if (filter === 'trash') {
        if (!note.isTrashed) return false;
      } else {
        if (note.isTrashed) return false;
      }

      // 2. Special section filters
      if (filter === 'pinned') {
        if (!note.isPinned) return false;
      } else if (filter === 'recent') {
        // Updated within the last 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(note.updatedAt).getTime() < sevenDaysAgo) return false;
      }

      // 3. Category filter
      if (filter !== 'trash' && category && category !== 'All') {
        if (note.category.toLowerCase() !== category.toLowerCase()) return false;
      }

      // 4. Tag filter
      if (tag && note.tags) {
        if (!note.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) return false;
      }

      // 5. Search query filter (title, content, tags)
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = (note.title || '').toLowerCase().includes(query);
        const inContent = (note.content || '').toLowerCase().includes(query);
        const inCategory = (note.category || '').toLowerCase().includes(query);
        const inTags = Array.isArray(note.tags) && note.tags.some(t => t.toLowerCase().includes(query));
        if (!inTitle && !inContent && !inCategory && !inTags) return false;
      }

      return true;
    });
  }

  static sortNotes(notes, sortMode = 'updated-desc') {
    const list = [...notes];
    switch (sortMode) {
      case 'updated-desc':
        return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      case 'updated-asc':
        return list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      case 'created-desc':
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'created-asc':
        return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'title-asc':
        return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'title-desc':
        return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      default:
        return list;
    }
  }

  static getStats(allNotes, categories) {
    const active = allNotes.filter(n => !n.isTrashed);
    const pinned = active.filter(n => n.isPinned);
    const trashed = allNotes.filter(n => n.isTrashed);
    const totalWords = active.reduce((acc, note) => {
      const { words } = NotesHelper.countWordsAndChars(note.content);
      return acc + words;
    }, 0);

    return {
      total: active.length,
      pinned: pinned.length,
      categoriesCount: categories.filter(c => c !== 'All').length,
      trashedCount: trashed.length,
      totalWords
    };
  }

  /**
   * Safely create a Note Card DOM element without vulnerable innerHTML injection.
   */
  static createNoteCard(note, { onOpen, onPin, onTrash, onRestore, onDeletePermanent, onDuplicate }) {
    const card = document.createElement('article');
    card.className = `note-card ${this.getColorClass(note.color)} ${note.isPinned ? 'is-pinned' : ''}`;
    card.setAttribute('data-id', note.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Note: ${note.title}`);

    // Header: Category badge & Actions
    const cardHeader = document.createElement('div');
    cardHeader.className = 'note-card-header';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'note-category-badge';
    categoryBadge.textContent = note.category || 'Personal';
    cardHeader.appendChild(categoryBadge);

    const headerActions = document.createElement('div');
    headerActions.className = 'note-card-actions';

    if (!note.isTrashed) {
      // Pin Button
      const pinBtn = document.createElement('button');
      pinBtn.className = `icon-btn pin-btn ${note.isPinned ? 'active' : ''}`;
      pinBtn.setAttribute('title', note.isPinned ? 'Unpin Note' : 'Pin Note');
      pinBtn.setAttribute('aria-label', note.isPinned ? 'Unpin Note' : 'Pin Note');
      pinBtn.innerHTML = note.isPinned 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPin(note.id);
      });
      headerActions.appendChild(pinBtn);
    }

    cardHeader.appendChild(headerActions);
    card.appendChild(cardHeader);

    // Body: Title & Content Preview
    const cardBody = document.createElement('div');
    cardBody.className = 'note-card-body';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'note-card-title';
    cardTitle.textContent = note.title || 'Untitled Note';
    cardBody.appendChild(cardTitle);

    const cardSnippet = document.createElement('p');
    cardSnippet.className = 'note-card-snippet';
    // Truncate cleanly for snippet
    const contentText = (note.content || '').trim();
    cardSnippet.textContent = contentText ? (contentText.length > 240 ? contentText.substring(0, 240) + '...' : contentText) : 'No additional text...';
    cardBody.appendChild(cardSnippet);

    card.appendChild(cardBody);

    // Tags list if any
    if (Array.isArray(note.tags) && note.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'note-card-tags';
      note.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'note-tag-chip';
        tagEl.textContent = `#${tag}`;
        tagsContainer.appendChild(tagEl);
      });
      if (note.tags.length > 3) {
        const moreTag = document.createElement('span');
        moreTag.className = 'note-tag-chip more-tag';
        moreTag.textContent = `+${note.tags.length - 3}`;
        tagsContainer.appendChild(moreTag);
      }
      card.appendChild(tagsContainer);
    }

    // Footer: Timestamp, stats & footer actions
    const cardFooter = document.createElement('div');
    cardFooter.className = 'note-card-footer';

    const metaInfo = document.createElement('div');
    metaInfo.className = 'note-card-meta';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'note-time';
    timeSpan.title = `Updated: ${NotesHelper.formatFullDate(note.updatedAt)}`;
    timeSpan.textContent = NotesHelper.formatRelativeTime(note.updatedAt);
    metaInfo.appendChild(timeSpan);

    const { words } = NotesHelper.countWordsAndChars(note.content);
    const countSpan = document.createElement('span');
    countSpan.className = 'note-words-count';
    countSpan.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    metaInfo.appendChild(countSpan);

    cardFooter.appendChild(metaInfo);

    const footerActions = document.createElement('div');
    footerActions.className = 'note-footer-actions';

    if (note.isTrashed) {
      // Restore button
      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'icon-btn-text text-emerald';
      restoreBtn.title = 'Restore Note';
      restoreBtn.setAttribute('aria-label', 'Restore Note');
      restoreBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg> <span>Restore</span>`;
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRestore(note.id);
      });
      footerActions.appendChild(restoreBtn);

      // Delete permanently button
      const delPermBtn = document.createElement('button');
      delPermBtn.className = 'icon-btn-text text-rose';
      delPermBtn.title = 'Delete Permanently';
      delPermBtn.setAttribute('aria-label', 'Delete Permanently');
      delPermBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> <span>Delete</span>`;
      delPermBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDeletePermanent(note.id);
      });
      footerActions.appendChild(delPermBtn);
    } else {
      // Duplicate button
      const dupBtn = document.createElement('button');
      dupBtn.className = 'icon-btn icon-hover-only';
      dupBtn.title = 'Duplicate Note';
      dupBtn.setAttribute('aria-label', 'Duplicate Note');
      dupBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
      dupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDuplicate(note.id);
      });
      footerActions.appendChild(dupBtn);

      // Trash button
      const trashBtn = document.createElement('button');
      trashBtn.className = 'icon-btn icon-hover-only hover-rose';
      trashBtn.title = 'Move to Trash';
      trashBtn.setAttribute('aria-label', 'Move to Trash');
      trashBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;
      trashBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onTrash(note.id);
      });
      footerActions.appendChild(trashBtn);
    }

    cardFooter.appendChild(footerActions);
    card.appendChild(cardFooter);

    // Click handler to open/edit note (unless clicked on an action button)
    card.addEventListener('click', () => {
      if (!note.isTrashed) {
        onOpen(note.id);
      }
    });

    // Keyboard support: Enter / Space opens the note
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!note.isTrashed) {
          e.preventDefault();
          onOpen(note.id);
        }
      }
    });

    return card;
  }
}

window.NotesHelper = NotesHelper;
