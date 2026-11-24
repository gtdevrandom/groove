// Remplacez cette valeur par une clé YouTube Data API v3 si vous préférez la configurer ici.
const API_KEY = 'VOTRE_CLE_API';

const DEMO_TRACKS = [
  { id: 'K4DyBUG242c', title: 'On & On', artist: 'Cartoon feat. Daniel Levi', duration: '3:28', thumbnail: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg' },
  { id: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker', duration: '3:32', thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg' },
  { id: 'DWcJFNfaw9c', title: 'Chill music mix - calm and relaxing', artist: 'Chill Radio', duration: '1:02:14', thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg' },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', duration: '4:42', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
  { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', duration: '6:07', thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg' },
  { id: 'fRh_vgS2dFE', title: 'Sorry', artist: 'Justin Bieber', duration: '3:26', thumbnail: 'https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg' },
  { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', duration: '4:30', thumbnail: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg' },
  { id: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', duration: '5:02', thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg' },
  { id: '2vjPBrBU-TM', title: 'Chandelier', artist: 'Sia', duration: '3:52', thumbnail: 'https://i.ytimg.com/vi/2vjPBrBU-TM/hqdefault.jpg' },
  { id: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', duration: '4:44', thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg' },
  { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: '4:31', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
  { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: '4:24', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' }
];

const STORAGE_KEYS = {
  apiKey: 'groove.apiKey',
  liked: 'groove.liked',
  playlists: 'groove.playlists',
  history: 'groove.history',
  stats: 'groove.stats'
};

const state = {
  liked: loadStored(STORAGE_KEYS.liked, []),
  playlists: loadStored(STORAGE_KEYS.playlists, []),
  history: loadStored(STORAGE_KEYS.history, []),
  stats: loadStats(),
  currentTrack: null,
  currentHistoryRecorded: false,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentPlayCounted: false,
  lastStatsPosition: null,
  lastStatsTimestamp: null,
  pendingListenSeconds: 0,
  shuffle: false,
  repeat: 'off',
  volume: 70,
  libraryFilter: 'all',
  activePlaylistId: null,
  pendingPlaylistTrack: null,
  searchTimer: null,
  searchRequest: 0,
  progressTimer: null,
  ytPlayer: null,
  youtubeApiPromise: null,
  searchController: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadStored(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch (error) {
    console.error(`Impossible de lire les données locales « ${key} ».`, error);
    return fallback;
  }
}

function loadStats() {
  const stored = loadStored(STORAGE_KEYS.stats, {}) || {};
  const tracks = stored.tracks && typeof stored.tracks === 'object' && !Array.isArray(stored.tracks)
    ? stored.tracks
    : {};
  const days = stored.days && typeof stored.days === 'object' && !Array.isArray(stored.days)
    ? stored.days
    : {};
  return {
    totalSeconds: Number.isFinite(stored.totalSeconds) ? Math.max(0, stored.totalSeconds) : 0,
    plays: Number.isFinite(stored.plays) ? Math.max(0, stored.plays) : 0,
    tracks,
    days
  };
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Impossible d'enregistrer les données locales « ${key} ».`, error);
    showToast('Les données ne peuvent pas être enregistrées dans ce navigateur.', true);
    return false;
  }
}

function savedApiKey() {
  try {
    const configuredKey = localStorage.getItem(STORAGE_KEYS.apiKey);
    return configuredKey || (API_KEY !== 'VOTRE_CLE_API' ? API_KEY : '');
  } catch (error) {
    console.error('Impossible de lire la clé API locale.', error);
    return API_KEY !== 'VOTRE_CLE_API' ? API_KEY : '';
  }
}

function showToast(message, isError = false) {
  const region = $('#toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4800);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function currentTrackIsLiked() {
  return Boolean(state.currentTrack && state.liked.some(track => track.id === state.currentTrack.id));
}

function renderTrackCard(track, queue) {
  const card = document.createElement('article');
  card.className = `track-card${state.currentTrack?.id === track.id ? ' is-current' : ''}`;
  card.tabIndex = 0;
  card.setAttribute('aria-label', `${track.title}, ${track.artist}`);
  const artWrap = document.createElement('div');
  artWrap.className = 'track-art-wrap';
  const fallback = document.createElement('div');
  fallback.className = 'track-art-fallback';
  fallback.textContent = '♫';
  artWrap.append(fallback);
  if (track.thumbnail) {
    const image = new Image();
    image.className = 'track-art';
    image.alt = '';
    image.loading = 'lazy';
    image.src = track.thumbnail;
    image.addEventListener('error', () => image.remove(), { once: true });
    artWrap.prepend(image);
  }
  const duration = document.createElement('span');
  duration.className = 'card-duration';
  duration.textContent = track.duration || '—:—';
  const play = document.createElement('button');
  play.className = 'card-play';
  play.type = 'button';
  play.setAttribute('aria-label', `Lire ${track.title}`);
  play.textContent = '▶';
  play.addEventListener('click', event => {
    event.stopPropagation();
    playTrack(track, queue);
  });
  artWrap.append(duration, play);
  const title = document.createElement('h3');
  title.textContent = track.title;
  const artist = document.createElement('p');
  artist.textContent = track.artist;
  const addButton = document.createElement('button');
  addButton.className = 'track-add-button';
  addButton.type = 'button';
  addButton.textContent = '＋ Ajouter à une playlist';
  addButton.setAttribute('aria-label', `Ajouter ${track.title} à une playlist`);
  addButton.addEventListener('click', event => {
    event.stopPropagation();
    openPlaylistPicker(track);
  });
  card.append(artWrap, title, artist, addButton);
  card.addEventListener('click', () => playTrack(track, queue));
  card.addEventListener('keydown', event => {
    if (event.target !== card) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playTrack(track, queue);
    }
  });
  return card;
}

function renderTrackGrid(container, tracks, emptyTitle, emptyMessage) {
  container.replaceChildren();
  if (!tracks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = emptyTitle;
    const message = document.createElement('span');
    message.textContent = emptyMessage;
    copy.append(title, message);
    empty.append(copy);
    container.append(empty);
    return;
  }
  tracks.forEach(track => container.append(renderTrackCard(track, tracks)));
}

function renderHome() {
  renderTrackGrid($('#home-tracks'), DEMO_TRACKS.slice(0, 6), 'La sélection arrive bientôt', 'Réessayez un peu plus tard.');
  renderTrackGrid($('#recent-tracks'), state.history.slice(0, 6), 'Votre historique est encore vide', 'Les titres que vous écoutez apparaîtront ici.');
}

function renderSidebarPlaylists() {
  const list = $('#sidebar-playlists-list');
  list.replaceChildren();
  state.playlists.forEach(playlist => {
    const button = document.createElement('button');
    button.className = 'playlist-shortcut';
    button.textContent = playlist.name;
    button.title = playlist.name;
    button.addEventListener('click', () => {
      state.activePlaylistId = playlist.id;
      state.libraryFilter = 'playlists';
      showView('library');
      renderLibrary();
    });
    list.append(button);
  });
}

function showView(name) {
  $$('.view-panel').forEach(panel => {
    const active = panel.id === `view-${name}`;
    panel.hidden = !active;
    panel.classList.toggle('is-visible', active);
  });
  $$('[data-view]').forEach(button => button.classList.toggle('is-active', button.dataset.view === name));
  if (name === 'library') renderLibrary();
  if (name === 'stats') renderStats();
  if (name === 'search') $('#search-input').focus({ preventScroll: true });
  $('#content-scroll').scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLibrary() {
  $$('.filter-chip').forEach(button => {
    const selected = button.dataset.libraryFilter === state.libraryFilter;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  const content = $('#library-content');
  content.replaceChildren();
  if (state.libraryFilter === 'liked' || state.libraryFilter === 'all') {
    content.append(makeLibrarySection('Titres likés', state.liked, 'Aucun titre liké pour le moment', 'Touchez le cœur près d’un titre pour le retrouver ici.'));
  }
  if (state.libraryFilter === 'history' || state.libraryFilter === 'all') {
    content.append(makeLibrarySection('Récemment écoutés', state.history, 'Pas encore d’historique', 'Les titres que vous écoutez apparaîtront ici.'));
  }
  if (state.libraryFilter === 'playlists' || state.libraryFilter === 'all') {
    content.append(makePlaylistSection());
  }
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatListeningTime(value) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  if (minutes) return `${minutes} min`;
  return seconds ? `${seconds} s` : '0 min';
}

function renderStats() {
  const today = new Date();
  const week = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    const key = dateKey(date);
    week.push({
      key,
      date,
      seconds: Number(state.stats.days[key]) || 0
    });
  }
  const weekSeconds = week.reduce((total, day) => total + day.seconds, 0);
  const collectionCount = state.liked.length + state.playlists.length;
  $('#stats-total-time').textContent = formatListeningTime(state.stats.totalSeconds);
  $('#stats-week-time').textContent = formatListeningTime(weekSeconds);
  $('#stats-play-count').textContent = String(state.stats.plays);
  $('#stats-collection-count').textContent = String(collectionCount);
  $('#weekly-total-label').textContent = formatListeningTime(weekSeconds);

  const chart = $('#weekly-chart');
  chart.replaceChildren();
  const peak = Math.max(1, ...week.map(day => day.seconds));
  week.forEach(day => {
    const column = document.createElement('div');
    column.className = 'chart-column';
    column.title = `${day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${formatListeningTime(day.seconds)}`;
    const barTrack = document.createElement('div');
    barTrack.className = 'chart-bar-track';
    const bar = document.createElement('span');
    bar.className = 'chart-bar';
    bar.style.height = day.seconds ? `${Math.max(7, (day.seconds / peak) * 100)}%` : '3px';
    barTrack.append(bar);
    const dayLabel = document.createElement('span');
    dayLabel.className = 'chart-day-label';
    dayLabel.textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day.date).replace('.', '');
    column.append(barTrack, dayLabel);
    chart.append(column);
  });

  const topTracks = Object.values(state.stats.tracks)
    .sort((first, second) => second.seconds - first.seconds || second.plays - first.plays)
    .slice(0, 5);
  const list = $('#stats-top-tracks');
  list.replaceChildren();
  if (!topTracks.length) {
    const empty = document.createElement('li');
    empty.className = 'stats-empty';
    empty.textContent = 'Vos titres les plus écoutés apparaîtront ici.';
    list.append(empty);
    return;
  }
  topTracks.forEach((track, index) => {
    const row = document.createElement('li');
    row.className = 'top-track-row';
    const rank = document.createElement('span');
    rank.className = 'top-track-rank';
    rank.textContent = String(index + 1).padStart(2, '0');
    const copy = document.createElement('span');
    copy.className = 'top-track-copy';
    const title = document.createElement('strong');
    title.textContent = track.title;
    const artist = document.createElement('small');
    artist.textContent = track.artist;
    copy.append(title, artist);
    const listenTime = document.createElement('span');
    listenTime.className = 'top-track-time';
    listenTime.textContent = formatListeningTime(track.seconds);
    row.append(rank, copy, listenTime);
    list.append(row);
  });
}

function makeLibrarySection(titleText, tracks, emptyTitle, emptyText) {
  const section = document.createElement('section');
  section.className = 'library-section';
  const heading = document.createElement('h2');
  heading.textContent = titleText;
  const grid = document.createElement('div');
  grid.className = 'track-grid';
  section.append(heading, grid);
  renderTrackGrid(grid, tracks, emptyTitle, emptyText);
  return section;
}

function makePlaylistSection() {
  const section = document.createElement('section');
  section.className = 'library-section';
  const heading = document.createElement('h2');
  heading.textContent = 'Vos playlists';
  section.append(heading);
  if (!state.playlists.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Créez votre première playlist';
    const message = document.createElement('span');
    message.textContent = 'Rassemblez vos morceaux favoris dans une collection.';
    copy.append(title, message);
    empty.append(copy);
    section.append(empty);
    return section;
  }
  const list = document.createElement('div');
  list.className = 'playlist-list';
  state.playlists.forEach(playlist => {
    const row = document.createElement('div');
    row.className = 'playlist-row';
    const cover = document.createElement('div');
    cover.className = 'playlist-cover';
    cover.textContent = '♫';
    const copy = document.createElement('div');
    copy.className = 'playlist-row-copy';
    copy.tabIndex = 0;
    const name = document.createElement('strong');
    name.textContent = playlist.name;
    const count = document.createElement('span');
    count.textContent = `${playlist.tracks.length} titre${playlist.tracks.length === 1 ? '' : 's'}`;
    copy.append(name, count);
    copy.addEventListener('click', () => togglePlaylistDetails(playlist.id, row));
    copy.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePlaylistDetails(playlist.id, row);
      }
    });
    const play = document.createElement('button');
    play.className = 'playlist-play';
    play.type = 'button';
    play.textContent = '▶';
    play.setAttribute('aria-label', `Lire la playlist ${playlist.name}`);
    play.disabled = !playlist.tracks.length;
    play.addEventListener('click', () => playQueue(playlist.tracks, 0));
    const remove = document.createElement('button');
    remove.className = 'remove-playlist';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Supprimer la playlist ${playlist.name}`);
    remove.addEventListener('click', () => deletePlaylist(playlist.id));
    row.append(cover, copy, play, remove);
    list.append(row);
    if (state.activePlaylistId === playlist.id) renderPlaylistDetails(playlist, row);
  });
  section.append(list);
  return section;
}

function togglePlaylistDetails(id, row) {
  if (state.activePlaylistId === id) {
    state.activePlaylistId = null;
  } else {
    state.activePlaylistId = id;
  }
  renderLibrary();
}

function renderPlaylistDetails(playlist, row) {
  const detail = document.createElement('div');
  detail.className = 'playlist-detail';
  const grid = document.createElement('div');
  grid.className = 'track-grid';
  renderTrackGrid(grid, playlist.tracks, 'Cette playlist est vide', 'Ajoutez-y des titres depuis la recherche.');
  detail.append(grid);
  row.after(detail);
}

function createPlaylist(name, initialTrack = null) {
  const cleanName = name.trim();
  if (!cleanName) return false;
  if (state.playlists.some(playlist => playlist.name.toLowerCase() === cleanName.toLowerCase())) {
    showToast('Une playlist porte déjà ce nom.', true);
    return false;
  }
  const playlist = { id: createId(), name: cleanName, tracks: initialTrack ? [initialTrack] : [] };
  state.playlists.unshift(playlist);
  if (!persist(STORAGE_KEYS.playlists, state.playlists)) return false;
  state.pendingPlaylistTrack = null;
  state.activePlaylistId = playlist.id;
  state.libraryFilter = 'playlists';
  showView('library');
  renderSidebarPlaylists();
  showToast(initialTrack ? `Playlist « ${cleanName} » créée avec le titre.` : `Playlist « ${cleanName} » créée.`);
  return true;
}

function deletePlaylist(id) {
  const playlist = state.playlists.find(item => item.id === id);
  if (!playlist) return;
  state.playlists = state.playlists.filter(item => item.id !== id);
  if (state.activePlaylistId === id) state.activePlaylistId = null;
  persist(STORAGE_KEYS.playlists, state.playlists);
  renderLibrary();
  renderSidebarPlaylists();
  showToast(`Playlist « ${playlist.name} » supprimée.`);
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addToHistory(track) {
  state.history = [track, ...state.history.filter(item => item.id !== track.id)].slice(0, 30);
  persist(STORAGE_KEYS.history, state.history);
  renderHome();
  if (state.libraryFilter === 'history' || state.libraryFilter === 'all') renderLibrary();
}

function renderPlayer() {
  const track = state.currentTrack;
  $('#player-track-title').textContent = track?.title || 'Choisissez un titre';
  $('#player-track-artist').textContent = track?.artist || 'Votre prochaine découverte vous attend';
  $('#player-like').disabled = !track;
  $('#player-like').textContent = currentTrackIsLiked() ? '♥' : '♡';
  $('#player-like').classList.toggle('is-liked', currentTrackIsLiked());
  $('#player-like').setAttribute('aria-label', currentTrackIsLiked() ? 'Retirer des titres likés' : 'Ajouter aux titres likés');
  $('#player-cover').replaceChildren();
  if (track?.thumbnail) {
    const image = new Image();
    image.alt = '';
    image.src = track.thumbnail;
    image.addEventListener('error', () => {
      image.remove();
      $('#player-cover').textContent = '♫';
    }, { once: true });
    $('#player-cover').append(image);
  } else {
    $('#player-cover').textContent = '♫';
  }
  $('#play-button').disabled = !track;
  $('#play-button').textContent = state.isPlaying ? 'Ⅱ' : '▶';
  $('#play-button').setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Lecture');
  $('#shuffle-button').classList.toggle('is-active', state.shuffle);
  const repeatLabel = state.repeat === 'off' ? 'Désactiver la répétition' : state.repeat === 'all' ? 'Répéter la file' : 'Répéter le titre';
  $('#repeat-button').setAttribute('aria-label', repeatLabel);
  $('#repeat-button').classList.toggle('is-active', state.repeat !== 'off');
  $('#repeat-button').textContent = state.repeat === 'one' ? '↻¹' : '↻';
  $('#video-title').textContent = track?.title || 'Votre musique, avec son clip';
  $('#video-caption').textContent = track ? `Lecture intégrée · ${track.artist}` : 'Sélectionnez un titre pour lancer la lecture.';
}

function playTrack(track, queue = DEMO_TRACKS) {
  const foundIndex = queue.findIndex(item => item.id === track.id);
  const orderedQueue = foundIndex >= 0 ? queue : [track, ...queue];
  const index = foundIndex >= 0 ? foundIndex : 0;
  playQueue(orderedQueue, index);
}

function playQueue(tracks, index) {
  if (!tracks.length || !tracks[index]) return;
  flushListeningStats(true);
  state.pendingListenSeconds = 0;
  state.lastStatsPosition = null;
  state.lastStatsTimestamp = null;
  state.currentPlayCounted = false;
  state.currentHistoryRecorded = false;
  state.queue = [...tracks];
  state.queueIndex = index;
  state.currentTrack = tracks[index];
  state.isPlaying = true;
  renderPlayer();
  updateMediaSession();
  $('#video-placeholder').classList.add('is-hidden');
  startYouTubePlayback(state.currentTrack).catch(error => {
    state.isPlaying = false;
    renderPlayer();
    updateMediaSession();
    showToast(error.message || 'Le lecteur YouTube ne peut pas démarrer.', true);
  });
}

async function startYouTubePlayback(track) {
  const YT = await loadYouTubeApi();
  if (state.ytPlayer) {
    state.ytPlayer.loadVideoById(track.id);
    state.ytPlayer.setVolume(state.volume);
    return;
  }
  state.ytPlayer = new YT.Player('youtube-player', {
    width: '320',
    height: '200',
    videoId: track.id,
    playerVars: { playsinline: 1, rel: 0, controls: 1, origin: location.origin },
    events: {
      onReady(event) {
        state.ytPlayer = event.target;
        state.ytPlayer.setVolume(state.volume);
        state.ytPlayer.playVideo();
      },
      onStateChange: handleYouTubeState,
      onError: handleYouTubeError
    }
  });
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (state.youtubeApiPromise) return state.youtubeApiPromise;
  state.youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve(window.YT);
    };
    const existingScript = $('script[data-youtube-api]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.dataset.youtubeApi = 'true';
      script.onerror = () => reject(new Error('Impossible de charger le lecteur YouTube. Vérifiez votre connexion.'));
      document.head.append(script);
    }
  }).catch(error => {
    state.youtubeApiPromise = null;
    throw error;
  });
  return state.youtubeApiPromise;
}

function handleYouTubeState(event) {
  const states = window.YT?.PlayerState;
  if (!states) return;
  if (event.data === states.PLAYING) {
    state.isPlaying = true;
    state.lastStatsPosition = event.target.getCurrentTime() || 0;
    state.lastStatsTimestamp = Date.now();
    if (!state.currentHistoryRecorded) {
      addToHistory(state.currentTrack);
      state.currentHistoryRecorded = true;
    }
    if (!state.currentPlayCounted) recordTrackPlay(state.currentTrack);
    $('#video-placeholder').classList.add('is-hidden');
    renderPlayer();
    updateMediaSession();
    startProgressUpdates();
  } else if (event.data === states.PAUSED) {
    updateProgress();
    state.isPlaying = false;
    renderPlayer();
    flushListeningStats(true);
    state.lastStatsPosition = null;
    state.lastStatsTimestamp = null;
    stopProgressUpdates();
    updateMediaSession();
  } else if (event.data === states.BUFFERING) {
    renderPlayer();
  } else if (event.data === states.ENDED) {
    updateProgress();
    flushListeningStats(true);
    state.lastStatsPosition = null;
    state.lastStatsTimestamp = null;
    handleTrackEnded();
  }
}

function handleYouTubeError(event) {
  const messages = {
    2: 'Cet identifiant vidéo YouTube est invalide.',
    5: 'Le lecteur YouTube ne prend pas en charge cette vidéo.',
    100: 'Cette vidéo est introuvable ou privée.',
    101: 'Cette vidéo ne peut pas être lue dans un lecteur intégré.',
    150: 'Cette vidéo ne peut pas être lue dans un lecteur intégré.',
    153: 'YouTube exige un contexte d’intégration valide. Lancez l’application depuis un serveur local ou HTTPS.'
  };
  if (state.isPlaying) updateProgress();
  state.isPlaying = false;
  flushListeningStats(true);
  state.lastStatsPosition = null;
  state.lastStatsTimestamp = null;
  renderPlayer();
  stopProgressUpdates();
  updateMediaSession();
  showToast(messages[event.data] || 'La vidéo YouTube n’a pas pu être lue.', true);
}

function togglePlayback() {
  if (!state.currentTrack || !state.ytPlayer) return;
  if (state.isPlaying) state.ytPlayer.pauseVideo();
  else state.ytPlayer.playVideo();
}

function seekTo(position) {
  if (!state.ytPlayer) return;
  state.ytPlayer.seekTo(Math.max(0, position), true);
  state.lastStatsPosition = Math.max(0, position);
  state.lastStatsTimestamp = Date.now();
}

function moveQueue(direction) {
  if (!state.queue.length) return;
  if (direction < 0 && state.ytPlayer?.getCurrentTime() > 3) {
    seekTo(0);
    return;
  }
  let nextIndex;
  if (state.shuffle && state.queue.length > 1) {
    do { nextIndex = Math.floor(Math.random() * state.queue.length); }
    while (nextIndex === state.queueIndex);
  } else {
    nextIndex = state.queueIndex + direction;
  }
  if (nextIndex < 0 || nextIndex >= state.queue.length) {
    if (state.repeat === 'all') nextIndex = direction > 0 ? 0 : state.queue.length - 1;
    else return;
  }
  playQueue(state.queue, nextIndex);
}

function handleTrackEnded() {
  if (state.repeat === 'one') {
    seekTo(0);
    state.ytPlayer.playVideo();
    return;
  }
  const lastTrack = state.queueIndex === state.queue.length - 1;
  if ((!state.shuffle && lastTrack && state.repeat !== 'all') || (state.shuffle && state.queue.length === 1 && state.repeat !== 'all')) {
    state.isPlaying = false;
    stopProgressUpdates();
    renderPlayer();
    updateMediaSession();
    return;
  }
  if (state.repeat === 'all' && !state.shuffle && lastTrack) playQueue(state.queue, 0);
  else moveQueue(1);
}

function toggleLike() {
  if (!state.currentTrack) return;
  if (currentTrackIsLiked()) {
    state.liked = state.liked.filter(track => track.id !== state.currentTrack.id);
  } else {
    state.liked = [state.currentTrack, ...state.liked];
  }
  persist(STORAGE_KEYS.liked, state.liked);
  renderPlayer();
  renderLibrary();
  if (!$('#view-stats').hidden) renderStats();
}

function startProgressUpdates() {
  stopProgressUpdates();
  state.progressTimer = window.setInterval(updateProgress, 500);
}

function stopProgressUpdates() {
  if (state.progressTimer) window.clearInterval(state.progressTimer);
  state.progressTimer = null;
}

function updateProgress() {
  if (!state.ytPlayer || typeof state.ytPlayer.getDuration !== 'function') return;
  const duration = state.ytPlayer.getDuration() || 0;
  const current = state.ytPlayer.getCurrentTime() || 0;
  $('#elapsed-time').textContent = formatTime(current);
  $('#total-time').textContent = formatTime(duration);
  const slider = $('#progress-slider');
  slider.disabled = duration <= 0;
  if (!slider.matches(':active')) slider.value = String(duration ? Math.round((current / duration) * 1000) : 0);
  collectListeningTime(current);
  if (duration > 0 && navigator.mediaSession?.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: state.ytPlayer.getPlaybackRate?.() || 1,
        position: Math.min(current, duration)
      });
    } catch (error) {
      console.warn('Impossible de mettre à jour la position Media Session.', error);
    }
  }
}

function recordTrackPlay(track) {
  if (!track) return;
  const savedTrack = state.stats.tracks[track.id] || {
    id: track.id,
    title: track.title,
    artist: track.artist,
    plays: 0,
    seconds: 0
  };
  savedTrack.title = track.title;
  savedTrack.artist = track.artist;
  savedTrack.plays += 1;
  state.stats.tracks[track.id] = savedTrack;
  state.stats.plays += 1;
  state.currentPlayCounted = true;
  persist(STORAGE_KEYS.stats, state.stats);
  if (!$('#view-stats').hidden) renderStats();
}

function collectListeningTime(position) {
  const now = Date.now();
  if (state.isPlaying && state.currentTrack && state.lastStatsPosition !== null && state.lastStatsTimestamp !== null) {
    const positionDelta = position - state.lastStatsPosition;
    const elapsedWallTime = (now - state.lastStatsTimestamp) / 1000;
    if (positionDelta > 0 && positionDelta <= elapsedWallTime + 2) {
      state.pendingListenSeconds += positionDelta;
    }
  }
  state.lastStatsPosition = position;
  state.lastStatsTimestamp = now;
  if (state.pendingListenSeconds >= 5) flushListeningStats();
}

function flushListeningStats(force = false) {
  if (!state.currentTrack || state.pendingListenSeconds <= 0) return;
  const seconds = force ? Math.round(state.pendingListenSeconds) : Math.floor(state.pendingListenSeconds);
  if (seconds <= 0) return;
  state.pendingListenSeconds = Math.max(0, state.pendingListenSeconds - seconds);
  state.stats.totalSeconds += seconds;
  const key = dateKey(new Date());
  state.stats.days[key] = (Number(state.stats.days[key]) || 0) + seconds;
  const savedTrack = state.stats.tracks[state.currentTrack.id] || {
    id: state.currentTrack.id,
    title: state.currentTrack.title,
    artist: state.currentTrack.artist,
    plays: 0,
    seconds: 0
  };
  savedTrack.seconds += seconds;
  state.stats.tracks[state.currentTrack.id] = savedTrack;
  persist(STORAGE_KEYS.stats, state.stats);
  if (!$('#view-stats').hidden) renderStats();
}

function updateMediaSession() {
  if (!('mediaSession' in navigator) || !state.currentTrack) return;
  const track = state.currentTrack;
  if ('MediaMetadata' in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Groove',
      artwork: track.thumbnail ? [
        { src: track.thumbnail, sizes: '480x360', type: 'image/jpeg' }
      ] : []
    });
  }
  const actions = {
    play: () => state.ytPlayer?.playVideo(),
    pause: () => state.ytPlayer?.pauseVideo(),
    previoustrack: () => moveQueue(-1),
    nexttrack: () => moveQueue(1),
    seekto: details => {
      if (details.seekTime != null) seekTo(details.seekTime);
    },
    seekbackward: details => {
      if (state.ytPlayer) seekTo(state.ytPlayer.getCurrentTime() - (details.seekOffset || 10));
    },
    seekforward: details => {
      if (state.ytPlayer) seekTo(state.ytPlayer.getCurrentTime() + (details.seekOffset || 10));
    }
  };
  Object.entries(actions).forEach(([action, handler]) => {
    try { navigator.mediaSession.setActionHandler(action, handler); }
    catch (error) { console.warn(`Action Media Session non prise en charge : ${action}`, error); }
  });
  navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
}

async function searchYouTube(query, requestId) {
  const key = savedApiKey();
  $('#search-mode-badge').textContent = key ? 'RECHERCHE YOUTUBE' : 'SÉLECTION DÉMO';
  if (!key) {
    const normalized = query.trim().toLocaleLowerCase();
    const tracks = normalized
      ? DEMO_TRACKS.filter(track => `${track.title} ${track.artist}`.toLocaleLowerCase().includes(normalized))
      : DEMO_TRACKS;
    if (requestId === state.searchRequest) {
      $('#search-status').textContent = `${tracks.length} titre${tracks.length === 1 ? '' : 's'} dans la sélection démo`;
      renderTrackGrid($('#search-results'), tracks, 'Aucun résultat dans la démo', 'Configurez une clé API pour rechercher dans YouTube.');
    }
    return;
  }
  if (!query.trim()) {
    $('#search-status').textContent = 'Tapez un titre, un artiste ou un mot-clé.';
    renderTrackGrid($('#search-results'), DEMO_TRACKS, 'Aucune suggestion', 'Réessayez plus tard.');
    return;
  }
  if (state.searchController) state.searchController.abort();
  state.searchController = new AbortController();
  $('#search-status').textContent = 'Recherche en cours…';
  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.search = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '18',
      q: query,
      key
    });
    const response = await fetch(searchUrl, { signal: state.searchController.signal });
    const searchData = await response.json();
    if (!response.ok) throw new Error(readYouTubeApiError(searchData));
    const items = (searchData.items || []).filter(item => item.id?.videoId && item.snippet);
    const ids = items.map(item => item.id.videoId);
    let durations = new Map();
    if (ids.length) {
      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosUrl.search = new URLSearchParams({ part: 'contentDetails', id: ids.join(','), key });
      const videosResponse = await fetch(videosUrl, { signal: state.searchController.signal });
      const videosData = await videosResponse.json();
      if (!videosResponse.ok) throw new Error(readYouTubeApiError(videosData));
      durations = new Map((videosData.items || []).map(item => [item.id, parseIsoDuration(item.contentDetails?.duration)]));
    }
    if (requestId !== state.searchRequest) return;
    const tracks = items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      duration: durations.get(item.id.videoId) || '—:—',
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
    }));
    $('#search-status').textContent = `${tracks.length} résultat${tracks.length === 1 ? '' : 's'} pour « ${query.trim()} »`;
    renderTrackGrid($('#search-results'), tracks, 'Aucun résultat trouvé', 'Essayez un autre titre ou un nom d’artiste.');
  } catch (error) {
    if (error.name === 'AbortError' || requestId !== state.searchRequest) return;
    console.error('Échec de la recherche YouTube.', error);
    $('#search-status').textContent = 'La recherche YouTube a échoué.';
    const message = error.message || 'Une erreur réseau est survenue pendant la recherche.';
    renderTrackGrid($('#search-results'), [], 'Recherche indisponible', message);
    showToast(message, true);
  }
}

function readYouTubeApiError(data) {
  const reason = data?.error?.errors?.[0]?.reason;
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return 'Quota YouTube API dépassé. Réessayez demain ou utilisez le mode démo dans les paramètres.';
  }
  if (reason === 'keyInvalid' || data?.error?.code === 400) {
    return 'Clé API invalide. Vérifiez-la dans les paramètres.';
  }
  if (reason === 'accessNotConfigured') {
    return 'Activez YouTube Data API v3 pour le projet associé à cette clé.';
  }
  return data?.error?.message || 'YouTube API a renvoyé une erreur.';
}

function parseIsoDuration(value) {
  if (!value) return '—:—';
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '—:—';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function openPlaylistDialog(track = null) {
  state.pendingPlaylistTrack = track;
  $('#playlist-name-input').value = '';
  $('#playlist-dialog').showModal();
  $('#playlist-name-input').focus();
}

function openPlaylistPicker(track) {
  state.pendingPlaylistTrack = track;
  if (!state.playlists.length) {
    openPlaylistDialog(track);
    return;
  }
  const list = $('#playlist-picker-list');
  list.replaceChildren();
  state.playlists.forEach(playlist => {
    const button = document.createElement('button');
    button.className = 'playlist-picker-option';
    button.type = 'button';
    button.textContent = `${playlist.name} · ${playlist.tracks.length} titre${playlist.tracks.length === 1 ? '' : 's'}`;
    button.addEventListener('click', () => {
      addTrackToPlaylist(playlist.id, track);
      $('#playlist-picker-dialog').close();
    });
    list.append(button);
  });
  $('#playlist-picker-dialog').showModal();
}

function addTrackToPlaylist(playlistId, track) {
  const playlist = state.playlists.find(item => item.id === playlistId);
  if (!playlist) return;
  if (playlist.tracks.some(item => item.id === track.id)) {
    showToast('Ce titre est déjà dans cette playlist.');
    return;
  }
  playlist.tracks.unshift(track);
  if (persist(STORAGE_KEYS.playlists, state.playlists)) {
    state.pendingPlaylistTrack = null;
    renderLibrary();
    showToast(`Ajouté à « ${playlist.name} ».`);
  }
}

function openSettingsDialog() {
  $('#api-key-input').value = savedApiKey();
  $('#settings-dialog').showModal();
}

function configureMediaAndVolume() {
  $('#volume-slider').value = String(state.volume);
  $('#volume-slider').addEventListener('input', event => {
    state.volume = Number(event.currentTarget.value);
    state.ytPlayer?.setVolume(state.volume);
  });
  $('#progress-slider').addEventListener('input', event => {
    if (!state.ytPlayer) return;
    const duration = state.ytPlayer.getDuration();
    const seekTime = (Number(event.currentTarget.value) / 1000) * duration;
    $('#elapsed-time').textContent = formatTime(seekTime);
    seekTo(seekTime);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(error => {
      console.error('Impossible d’enregistrer le service worker.', error);
      showToast('Le mode installable n’a pas pu être activé sur cette origine.', true);
    });
  });
}

function attachEvents() {
  $$('[data-view]').forEach(button => button.addEventListener('click', event => {
    if (button.tagName === 'A') event.preventDefault();
    showView(button.dataset.view);
  }));
  $$('[data-library-filter]').forEach(button => button.addEventListener('click', () => {
    state.libraryFilter = button.dataset.libraryFilter;
    if (state.libraryFilter !== 'playlists') state.activePlaylistId = null;
    showView('library');
    renderLibrary();
  }));
  ['#settings-sidebar', '#settings-top'].forEach(selector => $(selector).addEventListener('click', openSettingsDialog));
  ['#create-playlist-sidebar', '#create-playlist'].forEach(selector => $(selector).addEventListener('click', openPlaylistDialog));
  $('#playlist-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#playlist-name-input').value;
    if (createPlaylist(name, state.pendingPlaylistTrack)) $('#playlist-dialog').close();
  });
  $('#cancel-playlist').addEventListener('click', () => {
    state.pendingPlaylistTrack = null;
    $('#playlist-dialog').close();
  });
  $('#create-playlist-from-track').addEventListener('click', () => {
    const track = state.pendingPlaylistTrack;
    $('#playlist-picker-dialog').close();
    openPlaylistDialog(track);
  });
  $('#playlist-picker-dialog').addEventListener('close', () => {
    if (!$('#playlist-dialog').open) state.pendingPlaylistTrack = null;
  });
  $('#playlist-dialog').addEventListener('close', () => {
    state.pendingPlaylistTrack = null;
  });
  $('#settings-form').addEventListener('submit', event => {
    event.preventDefault();
    const key = $('#api-key-input').value.trim();
    try {
      if (key) localStorage.setItem(STORAGE_KEYS.apiKey, key);
      else localStorage.removeItem(STORAGE_KEYS.apiKey);
      $('#settings-dialog').close();
      showToast(key ? 'Clé API enregistrée sur cet appareil.' : 'Mode démo activé.');
      $('#search-mode-badge').textContent = key ? 'RECHERCHE YOUTUBE' : 'SÉLECTION DÉMO';
      if ($('#search-input').value.trim()) scheduleSearch();
    } catch (error) {
      console.error('Impossible d’enregistrer la clé API.', error);
      showToast('La clé API n’a pas pu être enregistrée dans ce navigateur.', true);
    }
  });
  $('#clear-api-key').addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.apiKey);
      $('#api-key-input').value = '';
      $('#settings-dialog').close();
      $('#search-mode-badge').textContent = 'SÉLECTION DÉMO';
      showToast('Mode démo activé.');
      if ($('#search-input').value.trim()) scheduleSearch();
    } catch (error) {
      console.error('Impossible de supprimer la clé API.', error);
      showToast('La clé API n’a pas pu être supprimée.', true);
    }
  });
  $('#toggle-api-key').addEventListener('click', () => {
    const input = $('#api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('#toggle-api-key').textContent = input.type === 'password' ? 'Afficher' : 'Masquer';
  });
  $('#search-input').addEventListener('input', scheduleSearch);
  $('#clear-search').addEventListener('click', () => {
    $('#search-input').value = '';
    scheduleSearch();
    $('#search-input').focus();
  });
  $('#play-button').addEventListener('click', togglePlayback);
  $('#previous-button').addEventListener('click', () => moveQueue(-1));
  $('#next-button').addEventListener('click', () => moveQueue(1));
  $('#shuffle-button').addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    renderPlayer();
  });
  $('#repeat-button').addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    renderPlayer();
  });
  $('#player-like').addEventListener('click', toggleLike);
  $('#back-button').addEventListener('click', () => showView('home'));
  $('#forward-button').addEventListener('click', () => showView('library'));
  window.addEventListener('keydown', event => {
    if (event.code === 'Space' && !['INPUT', 'BUTTON'].includes(document.activeElement.tagName) && !$('#settings-dialog').open && !$('#playlist-dialog').open) {
      event.preventDefault();
      togglePlayback();
    }
  });
}

function scheduleSearch() {
  window.clearTimeout(state.searchTimer);
  const query = $('#search-input').value;
  $('#clear-search').hidden = !query;
  const requestId = ++state.searchRequest;
  state.searchTimer = window.setTimeout(() => searchYouTube(query, requestId), query.trim() ? 350 : 0);
}

function initialize() {
  attachEvents();
  configureMediaAndVolume();
  renderHome();
  renderLibrary();
  renderSidebarPlaylists();
  renderPlayer();
  if (savedApiKey()) $('#search-mode-badge').textContent = 'RECHERCHE YOUTUBE';
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.isPlaying) updateProgress();
      flushListeningStats(true);
    }
    else if (state.isPlaying) updateProgress();
  });
  window.addEventListener('pagehide', () => {
    if (state.isPlaying) updateProgress();
    flushListeningStats(true);
  });
  registerServiceWorker();
}

initialize();
