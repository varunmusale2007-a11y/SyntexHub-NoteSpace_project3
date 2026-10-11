/**
 * NoteSpace - Main Application Controller
 * Connects Storage, NotesHelper, and DOM events.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- App State ---
  const state = {
    filter: 'all',          // 'all', 'pinned', 'recent', 'trash'
    category: 'All',        // Category name or 'All'
    searchQuery: '',
    selectedTag: '',
    sortMode: window.storage.getSortMode(),
    viewMode: window.storage.getViewMode(),
    activeNoteId: null,     // null for new note, or note.id for editing
    editorTags: [],
    editorColor: 'purple',
    editorIsPinned: false,
    autosaveTimer: null,
    debounceSearchTimer: null,
    confirmCallback: null
  };

  // --- DOM Elements Cache ---
  const el = {
    // Layout & Theme
    html: document.documentElement,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggleBtn: document.getElementById('menuToggleBtn'),
    sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
    heroGreeting: document.getElementById('heroGreeting'),

    // Navigation & Badges
    navItems: document.querySelectorAll('.sidebar-nav .nav-item[data-filter]'),
    badgeAll: document.getElementById('badgeAll'),
    badgePinned: document.getElementById('badgePinned'),
    badgeTrash: document.getElementById('badgeTrash'),
    sidebarCategoryList: document.getElementById('sidebarCategoryList'),
    openAddCategoryBtn: document.getElementById('openAddCategoryBtn'),
    categoryFilterStrip: document.getElementById('categoryFilterStrip'),
    openBackupModalBtn: document.getElementById('openBackupModalBtn'),

    // Top Bar Controls
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    sortSelect: document.getElementById('sortSelect'),
    viewGridBtn: document.getElementById('viewGridBtn'),
    viewListBtn: document.getElementById('viewListBtn'),
    topbarNewNoteBtn: document.getElementById('topbarNewNoteBtn'),
    heroNewNoteBtn: document.getElementById('heroNewNoteBtn'),

    // Dashboard Stats & Containers
    statTotalNotes: document.getElementById('statTotalNotes'),
    statPinnedNotes: document.getElementById('statPinnedNotes'),
    statCategories: document.getElementById('statCategories'),
    statTrash: document.getElementById('statTrash'),
    trashBanner: document.getElementById('trashBanner'),
    emptyTrashBtn: document.getElementById('emptyTrashBtn'),
    notesContainer: document.getElementById('notesContainer'),
    pinnedSection: document.getElementById('pinnedSection'),
    pinnedNotesGrid: document.getElementById('pinnedNotesGrid'),
    pinnedSectionBadge: document.getElementById('pinnedSectionBadge'),
    othersSection: document.getElementById('othersSection'),
    othersNotesGrid: document.getElementById('othersNotesGrid'),
    othersSectionTitle: document.getElementById('othersSectionTitle'),
    othersSectionBadge: document.getElementById('othersSectionBadge'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),

    // Editor Modal Elements
    editorBackdrop: document.getElementById('editorModalBackdrop'),
    editorCategorySelect: document.getElementById('editorCategorySelect'),
    editorColorPicker: document.getElementById('editorColorPicker'),
    editorPinBtn: document.getElementById('editorPinBtn'),
    autosaveDot: document.getElementById('autosaveDot'),
    autosaveText: document.getElementById('autosaveText'),
    editorCopyBtn: document.getElementById('editorCopyBtn'),
    editorDownloadBtn: document.getElementById('editorDownloadBtn'),
    editorCloseBtn: document.getElementById('editorCloseBtn'),
    editorTitleInput: document.getElementById('editorTitleInput'),
    editorTagsContainer: document.getElementById('editorTagsContainer'),
    editorTagChipsList: document.getElementById('editorTagChipsList'),
    editorTagsInput: document.getElementById('editorTagsInput'),
    editorContentTextarea: document.getElementById('editorContentTextarea'),
    editorWordCount: document.getElementById('editorWordCount'),
    editorCharCount: document.getElementById('editorCharCount'),
    editorReadTime: document.getElementById('editorReadTime'),
    editorDeleteBtn: document.getElementById('editorDeleteBtn'),
    editorCancelBtn: document.getElementById('editorCancelBtn'),
    editorSaveBtn: document.getElementById('editorSaveBtn'),

    // Confirmation Modal
    confirmBackdrop: document.getElementById('confirmModalBackdrop'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    confirmProceedBtn: document.getElementById('confirmProceedBtn'),

    // Category Modal
    categoryModalBackdrop: document.getElementById('categoryModalBackdrop'),
    newCategoryInput: document.getElementById('newCategoryInput'),
    categoryCancelBtn: document.getElementById('categoryCancelBtn'),
    categorySubmitBtn: document.getElementById('categorySubmitBtn'),

    // Backup Modal
    backupModalBackdrop: document.getElementById('backupModalBackdrop'),
    backupModalCloseBtn: document.getElementById('backupModalCloseBtn'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importFileInput: document.getElementById('importFileInput'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --- Initialize App ---
  function initApp() {
    initTheme();
    initGreeting();
    initSortAndView();
    renderColorPickerSwatches();
    renderCategories();
    renderNotes();
    attachEventListeners();
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = window.storage.getTheme();
    el.html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const current = el.html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    el.html.setAttribute('data-theme', next);
    window.storage.setTheme(next);
    updateThemeIcon(next);
    showToast(`Switched to ${next} mode`, 'info');
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      // Show Moon icon
      el.themeToggleBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      `;
    } else {
      // Show Sun icon
      el.themeToggleBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    }
  }

  // --- Dynamic Greeting ---
  function initGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateFormatted = new Date().toLocaleDateString(undefined, options);
    if (el.heroGreeting) {
      el.heroGreeting.textContent = `${greeting} • ${dateFormatted}`;
    }
  }

  // --- View Mode & Sort Initializers ---
  function initSortAndView() {
    el.sortSelect.value = state.sortMode;
    applyViewMode(state.viewMode);
  }

  function applyViewMode(mode) {
    state.viewMode = mode;
    window.storage.setViewMode(mode);
    if (mode === 'list') {
      el.notesContainer.classList.add('is-list-view');
      el.viewListBtn.classList.add('active');
      el.viewGridBtn.classList.remove('active');
    } else {
      el.notesContainer.classList.remove('is-list-view');
      el.viewGridBtn.classList.add('active');
      el.viewListBtn.classList.remove('active');
    }
  }

  // --- Category Renderers ---
  function renderCategories() {
    const categories = window.storage.getCategories();
    const allNotes = window.storage.getNotes();

    // 1. Sidebar Category List
    el.sidebarCategoryList.innerHTML = '';
    categories.forEach(cat => {
      if (cat === 'All') return; // Handled by 'All Notes' in views
      const count = allNotes.filter(n => !n.isTrashed && n.category === cat).length;

      const li = document.createElement('li');
      li.className = `nav-item category-item ${state.category === cat ? 'active' : ''}`;
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');

      li.innerHTML = `
        <div class="nav-item-content">
          <span class="category-dot" aria-hidden="true"></span>
          <span>${escapeHTML(cat)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="nav-badge">${count}</span>
          ${cat !== 'Personal' && cat !== 'Work' && cat !== 'Ideas' ? `
            <button class="category-delete-btn" title="Delete category" aria-label="Delete category ${cat}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          ` : ''}
        </div>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.closest('.category-delete-btn')) {
          e.stopPropagation();
          promptDeleteCategory(cat);
          return;
        }
        selectCategory(cat);
      });

      el.sidebarCategoryList.appendChild(li);
    });

    // 2. Horizontal Filter Strip Pills
    el.categoryFilterStrip.innerHTML = '';
    categories.forEach(cat => {
      const pill = document.createElement('button');
      pill.className = `filter-pill ${state.category === cat && state.filter !== 'trash' ? 'active' : ''}`;
      pill.textContent = cat;
      pill.addEventListener('click', () => {
        selectCategory(cat);
      });
      el.categoryFilterStrip.appendChild(pill);
    });

    // 3. Editor Category Dropdown
    el.editorCategorySelect.innerHTML = '';
    categories.forEach(cat => {
      if (cat === 'All') return;
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      el.editorCategorySelect.appendChild(opt);
    });
  }

  function selectCategory(cat) {
    state.category = cat;
    if (state.filter === 'trash') {
      state.filter = 'all'; // return to active notes
    }
    updateNavSelection();
    renderCategories();
    renderNotes();
    closeMobileSidebar();
  }

  function promptDeleteCategory(cat) {
    showConfirmModal(
      `Delete "${cat}" category?`,
      `Notes currently in "${cat}" will be safely moved to "Personal".`,
      () => {
        window.storage.deleteCategory(cat);
        if (state.category === cat) {
          state.category = 'All';
        }
        renderCategories();
        renderNotes();
        showToast(`Category "${cat}" removed`, 'info');
      }
    );
  }

  // --- Render Color Picker Swatches in Editor ---
  function renderColorPickerSwatches() {
    el.editorColorPicker.innerHTML = '';
    const colors = NotesHelper.getColors();
    colors.forEach(col => {
      const btn = document.createElement('button');
      btn.className = `color-swatch-btn ${state.editorColor === col.id ? 'active' : ''}`;
      btn.style.backgroundColor = col.hex;
      btn.title = col.name;
      btn.setAttribute('aria-label', `Select ${col.name} note color`);
      btn.addEventListener('click', () => {
        state.editorColor = col.id;
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        triggerAutosave();
      });
      el.editorColorPicker.appendChild(btn);
    });
  }

  // --- Render Notes & Dashboard ---
  function renderNotes() {
    const allNotes = window.storage.getNotes();
    const categories = window.storage.getCategories();

    // 1. Update Stats Cards & Badges
    const stats = NotesHelper.getStats(allNotes, categories);
    el.statTotalNotes.textContent = stats.total;
    el.statPinnedNotes.textContent = stats.pinned;
    el.statCategories.textContent = stats.categoriesCount;
    el.statTrash.textContent = stats.trashedCount;

    el.badgeAll.textContent = stats.total;
    el.badgePinned.textContent = stats.pinned;
    el.badgeTrash.textContent = stats.trashedCount;

    // 2. Filter & Sort notes
    const filtered = NotesHelper.filterNotes(allNotes, {
      filter: state.filter,
      category: state.category,
      searchQuery: state.searchQuery,
      tag: state.selectedTag
    });

    const sorted = NotesHelper.sortNotes(filtered, state.sortMode);

    // 3. Handle Trash Banner visibility
    if (state.filter === 'trash') {
      el.trashBanner.style.display = 'flex';
      el.categoryFilterStrip.style.display = 'none';
    } else {
      el.trashBanner.style.display = 'none';
      el.categoryFilterStrip.style.display = 'flex';
    }

    // 4. Clear existing grids
    el.pinnedNotesGrid.innerHTML = '';
    el.othersNotesGrid.innerHTML = '';

    // 5. Partition notes: Pinned vs Others (when viewing all/category)
    const cardHandlers = {
      onOpen: (id) => openEditorModal(id),
      onPin: (id) => handleTogglePin(id),
      onTrash: (id) => handleMoveToTrash(id),
      onRestore: (id) => handleRestoreFromTrash(id),
      onDeletePermanent: (id) => promptDeletePermanent(id),
      onDuplicate: (id) => handleDuplicateNote(id)
    };

    if (state.filter === 'trash') {
      // In trash, show all trashed notes in others grid
      el.pinnedSection.style.display = 'none';
      el.othersSection.style.display = sorted.length > 0 ? 'block' : 'none';
      el.othersSectionTitle.textContent = 'Trash Bin';
      el.othersSectionBadge.textContent = sorted.length;

      sorted.forEach(note => {
        el.othersNotesGrid.appendChild(NotesHelper.createNoteCard(note, cardHandlers));
      });
    } else if (state.filter === 'pinned') {
      el.pinnedSection.style.display = 'none';
      el.othersSection.style.display = sorted.length > 0 ? 'block' : 'none';
      el.othersSectionTitle.textContent = 'Pinned Notes';
      el.othersSectionBadge.textContent = sorted.length;

      sorted.forEach(note => {
        el.othersNotesGrid.appendChild(NotesHelper.createNoteCard(note, cardHandlers));
      });
    } else {
      // Normal or Category view: Split into Pinned & Other Notes
      const pinned = sorted.filter(n => n.isPinned);
      const others = sorted.filter(n => !n.isPinned);

      if (pinned.length > 0) {
        el.pinnedSection.style.display = 'block';
        el.pinnedSectionBadge.textContent = pinned.length;
        pinned.forEach(note => {
          el.pinnedNotesGrid.appendChild(NotesHelper.createNoteCard(note, cardHandlers));
        });
      } else {
        el.pinnedSection.style.display = 'none';
      }

      if (others.length > 0 || pinned.length > 0) {
        el.othersSection.style.display = 'block';
        el.othersSectionTitle.textContent = pinned.length > 0 ? 'Other Notes' : (state.category !== 'All' ? `${state.category} Notes` : 'All Notes');
        el.othersSectionBadge.textContent = others.length;
        others.forEach(note => {
          el.othersNotesGrid.appendChild(NotesHelper.createNoteCard(note, cardHandlers));
        });
      } else {
        el.othersSection.style.display = 'none';
      }
    }

    // 6. Handle Empty State
    if (sorted.length === 0) {
      el.emptyState.style.display = 'flex';
      if (state.searchQuery) {
        el.emptyStateTitle.textContent = `No notes match "${state.searchQuery}"`;
        el.emptyStateDesc.textContent = 'Check your spelling or try searching for another keyword or tag.';
        el.emptyStateActionBtn.style.display = 'none';
      } else if (state.filter === 'trash') {
        el.emptyStateTitle.textContent = 'Trash is clean & empty';
        el.emptyStateDesc.textContent = 'Deleted notes will appear here before being permanently wiped.';
        el.emptyStateActionBtn.style.display = 'none';
      } else if (state.filter === 'pinned') {
        el.emptyStateTitle.textContent = 'No pinned notes';
        el.emptyStateDesc.textContent = 'Click the pin icon on any note card to keep it pinned at the top!';
        el.emptyStateActionBtn.style.display = 'inline-flex';
      } else {
        el.emptyStateTitle.textContent = state.category !== 'All' ? `No notes in "${state.category}" yet` : 'Your thoughts, beautifully organized.';
        el.emptyStateDesc.textContent = 'Create your first note to capture ideas, meeting points, or task lists!';
        el.emptyStateActionBtn.style.display = 'inline-flex';
      }
    } else {
      el.emptyState.style.display = 'none';
    }
  }

  // --- Note Actions ---
  function handleTogglePin(id) {
    const updated = window.storage.togglePin(id);
    if (updated) {
      showToast(updated.isPinned ? '📌 Note pinned to top' : 'Note unpinned', 'success');
      renderNotes();
    }
  }

  function handleMoveToTrash(id) {
    window.storage.moveToTrash(id);
    showToast('Note moved to Trash', 'warning');
    renderNotes();
  }

  function handleRestoreFromTrash(id) {
    window.storage.restoreFromTrash(id);
    showToast('Note restored from Trash', 'success');
    renderNotes();
  }

  function promptDeletePermanent(id) {
    showConfirmModal(
      'Delete note permanently?',
      'This note cannot be recovered once permanently deleted.',
      () => {
        window.storage.deletePermanently(id);
        showToast('Note permanently deleted', 'danger');
        renderNotes();
      }
    );
  }

  function handleDuplicateNote(id) {
    const note = window.storage.getNoteById(id);
    if (!note) return;
    const duplicated = window.storage.createNote({
      title: `${note.title} (Copy)`,
      content: note.content,
      category: note.category,
      color: note.color,
      isPinned: false,
      tags: [...(note.tags || [])]
    });
    showToast('Note duplicated', 'success');
    renderNotes();
  }

  // --- Note Editor Modal Workflow ---
  function openEditorModal(noteId = null) {
    state.activeNoteId = noteId;
    clearTimeout(state.autosaveTimer);

    if (noteId) {
      // Editing existing note
      const note = window.storage.getNoteById(noteId);
      if (!note) return;

      el.editorTitleInput.value = note.title || '';
      el.editorContentTextarea.value = note.content || '';
      el.editorCategorySelect.value = note.category || 'Personal';
      state.editorColor = note.color || 'purple';
      state.editorIsPinned = Boolean(note.isPinned);
      state.editorTags = Array.isArray(note.tags) ? [...note.tags] : [];

      el.editorDeleteBtn.style.display = 'inline-block';
      updateAutosaveStatus('saved', `Last edited ${NotesHelper.formatRelativeTime(note.updatedAt)}`);
    } else {
      // Creating brand new note
      el.editorTitleInput.value = '';
      el.editorContentTextarea.value = '';
      el.editorCategorySelect.value = state.category !== 'All' ? state.category : 'Personal';
      state.editorColor = 'purple';
      state.editorIsPinned = false;
      state.editorTags = [];

      el.editorDeleteBtn.style.display = 'none';
      updateAutosaveStatus('saved', 'Ready');
    }

    updatePinButtonState();
    renderColorPickerSwatches();
    renderEditorTags();
    updateEditorStats();

    el.editorBackdrop.classList.add('is-active');
    setTimeout(() => el.editorTitleInput.focus(), 150);
  }

  function closeEditorModal() {
    clearTimeout(state.autosaveTimer);
    el.editorBackdrop.classList.remove('is-active');
    state.activeNoteId = null;
    renderNotes();
  }

  function updatePinButtonState() {
    if (state.editorIsPinned) {
      el.editorPinBtn.classList.add('active');
      el.editorPinBtn.title = 'Unpin Note';
      el.editorPinBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
    } else {
      el.editorPinBtn.classList.remove('active');
      el.editorPinBtn.title = 'Pin Note';
      el.editorPinBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
    }
  }

  function renderEditorTags() {
    el.editorTagChipsList.innerHTML = '';
    state.editorTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'editor-tag-chip';
      chip.innerHTML = `
        <span>#${escapeHTML(tag)}</span>
        <span class="editor-tag-remove" title="Remove tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      `;
      chip.querySelector('.editor-tag-remove').addEventListener('click', () => {
        state.editorTags = state.editorTags.filter(t => t !== tag);
        renderEditorTags();
        triggerAutosave();
      });
      el.editorTagChipsList.appendChild(chip);
    });
  }

  function addEditorTag(tagString) {
    const clean = tagString.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;
    if (!state.editorTags.includes(clean)) {
      state.editorTags.push(clean);
      renderEditorTags();
      triggerAutosave();
    }
    el.editorTagsInput.value = '';
  }

  function updateEditorStats() {
    const content = el.editorContentTextarea.value || '';
    const { words, chars, readTimeMinutes } = NotesHelper.countWordsAndChars(content);
    el.editorWordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    el.editorCharCount.textContent = `${chars} chars`;
    el.editorReadTime.textContent = `${readTimeMinutes} min read`;
  }

  function updateAutosaveStatus(status, text) {
    if (status === 'saving') {
      el.autosaveDot.className = 'autosave-dot saving';
      el.autosaveText.textContent = 'Saving...';
    } else {
      el.autosaveDot.className = 'autosave-dot';
      el.autosaveText.textContent = text || 'All changes saved';
    }
  }

  function triggerAutosave() {
    updateAutosaveStatus('saving');
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(() => {
      saveActiveNote(false); // background autosave
    }, 600);
  }

  function saveActiveNote(explicit = true) {
    const title = el.editorTitleInput.value;
    const content = el.editorContentTextarea.value;
    const category = el.editorCategorySelect.value;

    // Avoid creating empty notes on accidental clicks
    if (!title.trim() && !content.trim() && !state.activeNoteId) {
      if (explicit) {
        showToast('Please enter a title or note content', 'warning');
      }
      return;
    }

    const payload = {
      title,
      content,
      category,
      color: state.editorColor,
      isPinned: state.editorIsPinned,
      tags: state.editorTags
    };

    if (state.activeNoteId) {
      // Update existing note
      window.storage.updateNote(state.activeNoteId, payload);
      updateAutosaveStatus('saved', 'Saved just now');
    } else {
      // Create new note
      const newNote = window.storage.createNote(payload);
      state.activeNoteId = newNote.id;
      el.editorDeleteBtn.style.display = 'inline-block';
      updateAutosaveStatus('saved', 'Saved just now');
    }

    if (explicit) {
      showToast('Note saved successfully', 'success');
      closeEditorModal();
    }
  }

  // --- Copy Note Content to Clipboard ---
  function copyEditorContent() {
    const title = el.editorTitleInput.value.trim();
    const content = el.editorContentTextarea.value.trim();
    const textToCopy = `${title ? `${title}\n\n` : ''}${content}`;
    if (!textToCopy) {
      showToast('No content to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Copied note to clipboard!', 'success');
    }).catch(() => {
      showToast('Clipboard access denied', 'warning');
    });
  }

  // --- Download Note as Markdown ---
  function downloadEditorMarkdown() {
    const title = el.editorTitleInput.value.trim() || 'Untitled Note';
    const content = el.editorContentTextarea.value;
    const mdContent = `# ${title}\n\n*Category: ${el.editorCategorySelect.value}*\n*Exported from NoteSpace on ${new Date().toLocaleDateString()}*\n\n---\n\n${content}`;
    
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Markdown file', 'success');
  }

  // --- Confirmation Modal Management ---
  function showConfirmModal(title, message, onProceed) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    state.confirmCallback = onProceed;
    el.confirmBackdrop.classList.add('is-active');
  }

  function hideConfirmModal() {
    el.confirmBackdrop.classList.remove('is-active');
    state.confirmCallback = null;
  }

  // --- Toast Notification Manager ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--emerald-500)"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning' || type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--rose-500)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary-500)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Helper: Safe HTML Escaping ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Mobile Sidebar Controls ---
  function openMobileSidebar() {
    el.sidebar.classList.add('is-open');
    el.sidebarOverlay.classList.add('is-active');
  }

  function closeMobileSidebar() {
    el.sidebar.classList.remove('is-open');
    el.sidebarOverlay.classList.remove('is-active');
  }

  function updateNavSelection() {
    el.navItems.forEach(item => {
      if (item.getAttribute('data-filter') === state.filter && state.category === 'All') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // --- Event Listeners Setup ---
  function attachEventListeners() {
    // Theme Toggle
    el.themeToggleBtn.addEventListener('click', toggleTheme);

    // Mobile Navigation
    el.menuToggleBtn.addEventListener('click', openMobileSidebar);
    el.sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    el.sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Nav Filter Items (All, Pinned, Recent, Trash)
    el.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const filter = item.getAttribute('data-filter');
        state.filter = filter;
        state.category = 'All';
        updateNavSelection();
        renderCategories();
        renderNotes();
        closeMobileSidebar();
      });
    });

    // Top Bar Search & Keyboard Shortcuts
    el.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      el.searchClearBtn.style.display = val ? 'flex' : 'none';
      clearTimeout(state.debounceSearchTimer);
      state.debounceSearchTimer = setTimeout(() => {
        state.searchQuery = val;
        renderNotes();
      }, 200);
    });

    el.searchClearBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      el.searchClearBtn.style.display = 'none';
      state.searchQuery = '';
      renderNotes();
      el.searchInput.focus();
    });

    // Global Keyboard Shortcuts (Ctrl+K to search, Alt+N for new note, Esc to close)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        el.searchInput.focus();
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openEditorModal();
      } else if (e.key === 'Escape') {
        if (el.editorBackdrop.classList.contains('is-active')) {
          closeEditorModal();
        } else if (el.confirmBackdrop.classList.contains('is-active')) {
          hideConfirmModal();
        } else if (el.categoryModalBackdrop.classList.contains('is-active')) {
          el.categoryModalBackdrop.classList.remove('is-active');
        } else if (el.backupModalBackdrop.classList.contains('is-active')) {
          el.backupModalBackdrop.classList.remove('is-active');
        }
      }
    });

    // Sort Dropdown
    el.sortSelect.addEventListener('change', (e) => {
      state.sortMode = e.target.value;
      window.storage.setSortMode(state.sortMode);
      renderNotes();
    });

    // View Mode Toggle
    el.viewGridBtn.addEventListener('click', () => applyViewMode('grid'));
    el.viewListBtn.addEventListener('click', () => applyViewMode('list'));

    // New Note Triggers
    el.topbarNewNoteBtn.addEventListener('click', () => openEditorModal());
    el.heroNewNoteBtn.addEventListener('click', () => openEditorModal());
    el.emptyStateActionBtn.addEventListener('click', () => openEditorModal());

    // Trash Empty Button
    el.emptyTrashBtn.addEventListener('click', () => {
      showConfirmModal(
        'Empty entire trash?',
        'All notes currently in the trash will be permanently wiped.',
        () => {
          window.storage.emptyTrash();
          showToast('Trash emptied', 'success');
          renderNotes();
        }
      );
    });

    // Editor Modal Controls
    el.editorCloseBtn.addEventListener('click', closeEditorModal);
    el.editorCancelBtn.addEventListener('click', closeEditorModal);
    el.editorSaveBtn.addEventListener('click', () => saveActiveNote(true));
    el.editorCopyBtn.addEventListener('click', copyEditorContent);
    el.editorDownloadBtn.addEventListener('click', downloadEditorMarkdown);

    el.editorTitleInput.addEventListener('input', () => {
      triggerAutosave();
    });

    el.editorContentTextarea.addEventListener('input', () => {
      updateEditorStats();
      triggerAutosave();
    });

    el.editorCategorySelect.addEventListener('change', () => {
      triggerAutosave();
    });

    el.editorPinBtn.addEventListener('click', () => {
      state.editorIsPinned = !state.editorIsPinned;
      updatePinButtonState();
      triggerAutosave();
    });

    el.editorDeleteBtn.addEventListener('click', () => {
      if (state.activeNoteId) {
        handleMoveToTrash(state.activeNoteId);
        closeEditorModal();
      }
    });

    // Editor Tags Input
    el.editorTagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addEditorTag(el.editorTagsInput.value);
      }
    });

    // Confirmation Modal Actions
    el.confirmCancelBtn.addEventListener('click', hideConfirmModal);
    el.confirmProceedBtn.addEventListener('click', () => {
      if (typeof state.confirmCallback === 'function') {
        state.confirmCallback();
      }
      hideConfirmModal();
    });

    // Add Category Dialog
    el.openAddCategoryBtn.addEventListener('click', () => {
      el.newCategoryInput.value = '';
      el.categoryModalBackdrop.classList.add('is-active');
      setTimeout(() => el.newCategoryInput.focus(), 150);
    });

    el.categoryCancelBtn.addEventListener('click', () => {
      el.categoryModalBackdrop.classList.remove('is-active');
    });

    el.categorySubmitBtn.addEventListener('click', () => {
      const val = el.newCategoryInput.value.trim();
      if (!val) {
        showToast('Please enter a category name', 'warning');
        return;
      }
      const success = window.storage.addCategory(val);
      if (success) {
        showToast(`Category "${val}" created!`, 'success');
        el.categoryModalBackdrop.classList.remove('is-active');
        renderCategories();
        selectCategory(val);
      } else {
        showToast(`Category "${val}" already exists`, 'warning');
      }
    });

    el.newCategoryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        el.categorySubmitBtn.click();
      }
    });

    // Backup & Restore Dialog
    el.openBackupModalBtn.addEventListener('click', () => {
      el.backupModalBackdrop.classList.add('is-active');
    });

    el.backupModalCloseBtn.addEventListener('click', () => {
      el.backupModalBackdrop.classList.remove('is-active');
    });

    el.exportBackupBtn.addEventListener('click', () => {
      const json = window.storage.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notespace_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported backup successfully!', 'success');
    });

    el.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.storage.importBackup(event.target.result);
        if (res.success) {
          showToast(`Imported ${res.count} notes successfully!`, 'success');
          el.backupModalBackdrop.classList.remove('is-active');
          renderCategories();
          renderNotes();
        } else {
          showToast(`Import failed: ${res.error}`, 'danger');
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // reset
    });

    // Backdrop click to close modals
    [el.editorBackdrop, el.confirmBackdrop, el.categoryModalBackdrop, el.backupModalBackdrop].forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('is-active');
          if (backdrop === el.editorBackdrop) state.activeNoteId = null;
        }
      });
    });
  }

  // Run app initialization
  initApp();
});
