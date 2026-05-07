/**
 * ModForge Guide Renderer
 * Parses a superset of Markdown with custom block and inline tags.
 *
 * ── BLOCK TAGS ────────────────────────────────────────────────────────────
 *
 *   :::tip / :::info / :::warning / :::danger
 *   :::collapse Title text
 *   :::steps
 *     Step Title :: Step description text
 *   :::
 *   :::filetree
 *     romfs/
 *       Actor/Pack/
 *         MyActor.pack
 *   :::
 *   :::compare
 *     left: path/to/a.png | Label A
 *     right: path/to/b.png | Label B
 *   :::
 *   :::credit
 *     Guide by Lintenso
 *   :::
 *
 * ── INLINE TAGS ───────────────────────────────────────────────────────────
 *
 *   [color=#ff4444]red text[/color]
 *   [key]Ctrl+S[/key]
 *   [key]A[/key]
 *   [mark]highlighted text[/mark]
 *   [file]path/to/file.txt[/file]
 *
 * ── IMAGES ────────────────────────────────────────────────────────────────
 *
 *   ![Alt text](image.png){width=600 align=center caption="The dialog"}
 *   align: left | center | right   (default: center)
 *   width: number in px
 *
 * ── STANDARD MARKDOWN ─────────────────────────────────────────────────────
 *
 *   # H1  ## H2  ### H3  #### H4
 *   **bold**  *italic*  ~~strikethrough~~
 *   `inline code`
 *   ```lang \n code block \n ```
 *   > blockquote
 *   - unordered list  /  1. ordered list
 *   --- horizontal rule
 *   [link text](url)
 *   ---
 */

const ModForgeRenderer = (() => {

    // ── Escape HTML ──────────────────────────────────────────
    function esc(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Inline transforms ────────────────────────────────────
    function parseInline(text) {
        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Strikethrough
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        // [color=#xxx]...[/color]
        text = text.replace(/\[color=([^\]]+)\]([\s\S]+?)\[\/color\]/g,
            (_, col, inner) => `<span style="color:${esc(col)}">${inner}</span>`);
        // [key]...[/key]
        text = text.replace(/\[key\]([\s\S]+?)\[\/key\]/g,
            (_, k) => `<kbd class="key-chip">${esc(k)}</kbd>`);
        // [mark]...[/mark]
        text = text.replace(/\[mark\]([\s\S]+?)\[\/mark\]/g,
            (_, m) => `<mark class="guide-mark">${m}</mark>`);
        // [file]...[/file]
        text = text.replace(/\[file\]([\s\S]+?)\[\/file\]/g,
            (_, f) => `<span class="file-chip">${esc(f)}</span>`);
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            (_, label, href) => `<a href="${esc(href)}" class="guide-link" target="_blank">${label}</a>`);
        return text;
    }

    // ── Image with optional attributes ──────────────────────
    // ![alt](src){width=600 align=center caption="..."}
    function parseImage(alt, src, attrStr) {
        let width = null, align = 'center', caption = null;
        if (attrStr) {
            const wm = attrStr.match(/width=(\d+)/);
            if (wm) width = wm[1];
            const am = attrStr.match(/align=(left|center|right)/);
            if (am) align = am[1];
            const cm = attrStr.match(/caption="([^"]+)"/);
            if (cm) caption = cm[1];
        }
        const styleW = width ? `max-width:${width}px;` : '';
        const imgTag = `<img src="${esc(src)}" alt="${esc(alt)}" style="${styleW}width:100%;" loading="lazy">`;
        const capTag = caption ? `<figcaption class="guide-caption">${esc(caption)}</figcaption>` : '';
        return `<figure class="guide-figure align-${align}">${imgTag}${capTag}</figure>`;
    }

    // ── Block parsers ────────────────────────────────────────

    function parseCallout(type, inner) {
        const icons = { tip: '💡', info: 'ℹ', warning: '⚠', danger: '✕' };
        const labels = { tip: 'Tip', info: 'Info', warning: 'Warning', danger: 'Danger' };
        const icon = icons[type] || 'ℹ';
        const label = labels[type] || type;
        return `<div class="callout callout-${type}">
            <div class="callout-header"><span class="callout-icon">${icon}</span><span class="callout-label">${label}</span></div>
            <div class="callout-body">${parseInline(inner.trim())}</div>
        </div>`;
    }

    function parseCollapse(title, inner) {
        return `<details class="guide-collapse">
            <summary class="guide-collapse-title">${esc(title.trim())}</summary>
            <div class="guide-collapse-body">${renderBlocks(inner.trim())}</div>
        </details>`;
    }

    function parseSteps(inner) {
        const lines = inner.trim().split('\n').filter(l => l.trim());
        const items = lines.map((line, i) => {
            const parts = line.split('::');
            const title = parts[0] ? parts[0].trim() : '';
            const desc  = parts[1] ? parseInline(parts[1].trim()) : '';
            return `<div class="step-item">
                <div class="step-number">${i + 1}</div>
                <div class="step-content">
                    ${title ? `<div class="step-title">${esc(title)}</div>` : ''}
                    ${desc  ? `<div class="step-desc">${desc}</div>` : ''}
                </div>
            </div>`;
        }).join('');
        return `<div class="steps-block">${items}</div>`;
    }

    function parseFileTree(inner) {
        const lines = inner.split('\n').filter(l => l.trim() !== '');
        const rows = lines.map(line => {
            const indent = line.match(/^(\s*)/)[1].length;
            const name   = line.trim();
            const isDir  = name.endsWith('/');
            const depth  = Math.floor(indent / 2);
            const icon   = isDir ? '📁' : '📄';
            return `<div class="ft-row" style="padding-left:${depth * 20}px">
                <span class="ft-icon">${icon}</span><span class="ft-name">${esc(name)}</span>
            </div>`;
        }).join('');
        return `<div class="filetree-block">${rows}</div>`;
    }

    function parseCompare(inner) {
        let leftSrc = '', leftLabel = '', rightSrc = '', rightLabel = '';
        inner.trim().split('\n').forEach(line => {
            const lm = line.match(/^left:\s*(.+?)\s*\|\s*(.+)$/);
            const rm = line.match(/^right:\s*(.+?)\s*\|\s*(.+)$/);
            if (lm) { leftSrc = lm[1].trim(); leftLabel = lm[2].trim(); }
            if (rm) { rightSrc = rm[1].trim(); rightLabel = rm[2].trim(); }
        });
        return `<div class="compare-block">
            <div class="compare-side">
                <img src="${esc(leftSrc)}" alt="${esc(leftLabel)}" loading="lazy">
                <div class="compare-label">${esc(leftLabel)}</div>
            </div>
            <div class="compare-divider"></div>
            <div class="compare-side">
                <img src="${esc(rightSrc)}" alt="${esc(rightLabel)}" loading="lazy">
                <div class="compare-label">${esc(rightLabel)}</div>
            </div>
        </div>`;
    }

    function parseCredit(inner) {
        return `<div class="credit-block">${parseInline(inner.trim())}</div>`;
    }

    // ── Code block ───────────────────────────────────────────
    function parseCodeBlock(lang, code) {
        const langLabel = lang ? `<span class="code-lang">${esc(lang)}</span>` : '';
        const copyBtn = `<button class="code-copy" onclick="copyCode(this)" title="Copy">Copy</button>`;
        return `<div class="code-block-wrap">
            <div class="code-block-header">${langLabel}${copyBtn}</div>
            <pre class="code-block"><code>${esc(code)}</code></pre>
        </div>`;
    }

    // ── List parser ──────────────────────────────────────────
    function parseList(lines) {
        const isOrdered = /^\d+\./.test(lines[0].trim());
        const tag = isOrdered ? 'ol' : 'ul';
        const items = lines.map(l => {
            const text = l.replace(/^(\s*(\d+\.|[-*+]))\s+/, '');
            return `<li>${parseInline(text)}</li>`;
        }).join('');
        return `<${tag} class="guide-list">${items}</${tag}>`;
    }

    // ── Main block renderer ──────────────────────────────────
    function renderBlocks(md) {
        const lines = md.split('\n');
        let html = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Fenced code block
            const codeFence = line.match(/^```(\w*)$/);
            if (codeFence) {
                const lang = codeFence[1];
                const codeLines = [];
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                html += parseCodeBlock(lang, codeLines.join('\n'));
                i++;
                continue;
            }

            // Custom block :::type
            const blockOpen = line.match(/^:::(tip|info|warning|danger|steps|filetree|compare|credit)(\s.*)?$/);
            if (blockOpen) {
                const type = blockOpen[1];
                const inner = [];
                i++;
                while (i < lines.length && lines[i].trim() !== ':::') {
                    inner.push(lines[i]);
                    i++;
                }
                const innerText = inner.join('\n');
                if      (type === 'tip'      || type === 'info' ||
                         type === 'warning'  || type === 'danger') html += parseCallout(type, innerText);
                else if (type === 'steps')     html += parseSteps(innerText);
                else if (type === 'filetree')  html += parseFileTree(innerText);
                else if (type === 'compare')   html += parseCompare(innerText);
                else if (type === 'credit')    html += parseCredit(innerText);
                i++;
                continue;
            }

            // :::collapse Title
            const collapseOpen = line.match(/^:::collapse\s+(.+)$/);
            if (collapseOpen) {
                const title = collapseOpen[1];
                const inner = [];
                i++;
                while (i < lines.length && lines[i].trim() !== ':::') {
                    inner.push(lines[i]);
                    i++;
                }
                html += parseCollapse(title, inner.join('\n'));
                i++;
                continue;
            }

            // Horizontal rule
            if (/^---+$/.test(line.trim())) {
                html += '<hr class="guide-hr">';
                i++;
                continue;
            }

            // Headings
            const heading = line.match(/^(#{1,4})\s+(.+)$/);
            if (heading) {
                const level = heading[1].length;
                const text  = heading[2];
                const id    = text.toLowerCase().replace(/[^\w]+/g, '-');
                html += `<h${level} class="guide-h${level}" id="${id}">${parseInline(text)}</h${level}>`;
                i++;
                continue;
            }

            // Blockquote
            if (line.startsWith('> ')) {
                const quoteLines = [];
                while (i < lines.length && lines[i].startsWith('> ')) {
                    quoteLines.push(lines[i].slice(2));
                    i++;
                }
                html += `<blockquote class="guide-blockquote">${parseInline(quoteLines.join(' '))}</blockquote>`;
                continue;
            }

            // Lists
            if (/^\s*([-*+]|\d+\.)\s/.test(line)) {
                const listLines = [];
                while (i < lines.length && /^\s*([-*+]|\d+\.)\s/.test(lines[i])) {
                    listLines.push(lines[i]);
                    i++;
                }
                html += parseList(listLines);
                continue;
            }

            // Image with optional attrs: ![alt](src){...}
            const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?$/);
            if (imgMatch) {
                const attrStr = imgMatch[3] ? imgMatch[3].slice(1, -1) : null;
                html += parseImage(imgMatch[1], imgMatch[2], attrStr);
                i++;
                continue;
            }

            // Paragraph (collect consecutive non-empty lines)
            if (line.trim() !== '') {
                const paraLines = [];
                while (i < lines.length && lines[i].trim() !== '' &&
                       !lines[i].match(/^(#{1,4}\s|:::|-{3,}|```|>\s)/) &&
                       !/^\s*([-*+]|\d+\.)\s/.test(lines[i])) {
                    paraLines.push(lines[i]);
                    i++;
                }
                if (paraLines.length) {
                    html += `<p class="guide-p">${parseInline(paraLines.join(' '))}</p>`;
                }
                continue;
            }

            i++;
        }

        return html;
    }

    // ── Build table of contents ──────────────────────────────
    function buildTOC(md) {
        const stripped = md.replace(/^```[\s\S]*?^```/gm, '');
        const entries = [];
        for (const m of stripped.matchAll(/^(#{1,3})\s+(.+)$/gm)) {
            const level = m[1].length;
            const text  = m[2];
            const id    = text.toLowerCase().replace(/[^\w]+/g, '-');
            entries.push({ level, text, id });
        }
        if (entries.length < 2) return '';
        const items = entries.map(e => {
            const indent = (e.level - 1) * 14;
            return `<li style="padding-left:${indent}px">
                <a href="#${e.id}" class="toc-link">${esc(e.text)}</a>
            </li>`;
        }).join('');
        return `<nav class="guide-toc"><div class="toc-title">Contents</div><ul>${items}</ul></nav>`;
    }

    // ── Public API ───────────────────────────────────────────
    function render(md) {
        return renderBlocks(md);
    }

    function renderWithTOC(md) {
        const toc  = buildTOC(md);
        const body = renderBlocks(md);
        return { toc, body };
    }

    return { render, renderWithTOC };

})();

// ── Copy button helper (global) ──────────────────────────────
function copyCode(btn) {
    const code = btn.closest('.code-block-wrap').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1800);
    });
}
