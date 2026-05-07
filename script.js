/**
 * ModForge — Content Loader
 *
 * Folder structure:
 *   content/
 *     news/
 *       manifest.json          ← lists filenames: ["site-update.json", "revamp.json"]
 *       site-update.json
 *       revamp.json
 *     guides/
 *       manifest.json
 *       model-swapping.json
 *       ...
 *     information/
 *       manifest.json
 *       material-calculator.json
 *       ...
 *
 * Entry JSON schema:
 * {
 *   "title":       "Model Swapping",
 *   "date":        "2024-03-15",          ← ISO format, used for sorting
 *   "type":        "article",             ← "article" | "announcement"
 *   "image":       "Assets/HomeImages/modelswappingbanner.jpg",  ← omit for announcements
 *   "description": "Full model swapping guide! Credit: Lintenso",
 *   "url":         "Guides/ModelSwapping/index.html",            ← omit if no link
 *   "tags":        ["wip"],               ← optional: "wip", "update-soon", or any string
 *   "credit":      "Lintenso"             ← optional
 * }
 */

const TABS = ['news', 'guides', 'information'];

// ── Date formatter ────────────────────────────────────────
function formatDate(iso) {
    if (!iso) return '';
    const [year, month, day] = iso.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Build a single entry card ─────────────────────────────
function buildCard(entry) {
    const isArticle = entry.type === 'article';

    const card = document.createElement('div');
    card.className = `entry type-${isArticle ? 'article' : 'announcement'}`;

    // Image (articles only)
    if (entry.image) {
        card.innerHTML += `
            <div class="entry-image-wrap">
                <img src="${entry.image}" alt="${entry.title}" loading="lazy">
            </div>`;
    }

    // Body
    const tagsHTML = (entry.tags || []).map(tag => {
        const cls = tag === 'wip' ? 'wip' : tag === 'update-soon' ? 'update-soon' : '';
        const label = tag === 'wip' ? 'WIP' : tag === 'update-soon' ? 'Update Soon' : tag;
        return `<span class="entry-tag ${cls}">${label}</span>`;
    }).join('');

    card.innerHTML += `
        <div class="entry-body">
            <div class="entry-meta">
                <span class="entry-type-badge">${isArticle ? 'Article' : 'Announcement'}</span>
                ${tagsHTML}
                ${entry.date ? `<span class="entry-date">${formatDate(entry.date)}</span>` : ''}
            </div>
            <div class="entry-title">${entry.title}</div>
            ${entry.description ? `<div class="entry-description">${entry.description}</div>` : ''}
        </div>`;

    if (entry.url) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            // Remember which tab we're leaving from so the hub can restore it
            const activeTab = document.querySelector('nav ul li.active')?.dataset.tab;
            if (activeTab) localStorage.setItem('modforge_last_tab', activeTab);
            window.location.href = entry.url;
        });
    }

    return card;
}

// ── Fetch a single JSON file ──────────────────────────────
async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
}

// ── Load all entries for a tab from its manifest ──────────
async function loadTab(tab) {
    const section = document.getElementById(tab);
    section.innerHTML = `<p class="state-message">Loading…</p>`;

    let filenames;
    try {
        filenames = await fetchJSON(`content/${tab}/manifest.json`);
    } catch (e) {
        section.innerHTML = `<p class="state-message error">Could not load manifest for "${tab}".<br>Make sure content/${tab}/manifest.json exists.</p>`;
        return;
    }

    // Fetch all entry JSONs in parallel
    const results = await Promise.allSettled(
        filenames.map(name => fetchJSON(`content/${tab}/${name}`))
    );

    const entries = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            entries.push(r.value);
        } else {
            console.warn(`Failed to load content/${tab}/${filenames[i]}:`, r.reason);
        }
    });

    // Sort by date descending (newest first), undated entries go to bottom
    entries.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
    });

    section.innerHTML = '';

    if (entries.length === 0) {
        section.innerHTML = `<p class="state-message">No entries yet.</p>`;
        return;
    }

    entries.forEach(entry => section.appendChild(buildCard(entry)));
}

// ── Tab switching ─────────────────────────────────────────
const loadedTabs = new Set();

function switchTab(tab) {
    document.querySelectorAll('nav ul li').forEach(li => {
        li.classList.toggle('active', li.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(s => {
        s.classList.toggle('active', s.id === tab);
    });

    // Remember the selected tab in the URL hash so Back navigation restores it
    history.replaceState(null, '', `#${tab}`);

    if (!loadedTabs.has(tab)) {
        loadedTabs.add(tab);
        loadTab(tab);
    }
}

// ── Background: grab frame at 2s then freeze ──────────────
(function () {
    const video  = document.getElementById('background-video');
    const canvas = document.getElementById('background-canvas');
    const ctx    = canvas.getContext('2d');

    function grabFrame() {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        video.pause();
        video.src = ''; // release decode resources entirely
    }

    video.addEventListener('loadedmetadata', () => {
        video.currentTime = 2; // seek to exactly 2s
    });

    // 'seeked' fires once the frame at currentTime is ready
    video.addEventListener('seeked', grabFrame, { once: true });

    video.load();
})();

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav ul li').forEach(li => {
        li.addEventListener('click', () => switchTab(li.dataset.tab));
    });

    // Restore tab: localStorage wins (set when clicking into an article),
    // then fall back to URL hash, then default to 'news'
    const savedTab = localStorage.getItem('modforge_last_tab');
    localStorage.removeItem('modforge_last_tab'); // consume it — one-time restore
    const hashTab = window.location.hash.slice(1);
    const defaultTab = TABS.includes(savedTab) ? savedTab
                     : TABS.includes(hashTab)  ? hashTab
                     : 'news';
    loadedTabs.add(defaultTab);
    loadTab(defaultTab);
    switchTab(defaultTab);
});
