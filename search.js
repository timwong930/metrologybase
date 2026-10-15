(() => {
  const header = document.querySelector('.site-header');
  if (!header || document.querySelector('.global-search')) return;

  const search = document.createElement('div');
  search.className = 'global-search';
  search.innerHTML =
    '<div class="global-search-input-wrap">' +
      '<svg class="global-search-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input class="global-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search MetrologyBase…" aria-label="Search all MetrologyBase content" aria-expanded="false" aria-controls="global-search-results">' +
      '<kbd class="global-search-kbd">⌘K</kbd>' +
    '</div>' +
    '<div class="global-search-results" id="global-search-results" role="listbox" hidden></div>';

  const cta = header.querySelector('.nav-cta');
  if (cta) header.insertBefore(search, cta);
  else header.appendChild(search);
  header.classList.add('has-global-search');

  const input = search.querySelector('.global-search-input');
  const results = search.querySelector('.global-search-results');
  const kbd = search.querySelector('.global-search-kbd');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  kbd.textContent = isMac ? '⌘K' : 'Ctrl K';

  let index = null;
  let indexPromise = null;
  let selected = -1;
  let currentMatches = [];
  let expanded = false;
  const INITIAL_LIMIT = 10;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/×/g,'x')
      .replace(/[^a-z0-9.%+\-\/\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function tokens(query) {
    return normalize(query).split(' ').filter(Boolean);
  }

  function frequency(text, term) {
    if (!term || !text) return 0;
    let count = 0;
    let start = 0;
    while ((start = text.indexOf(term, start)) !== -1) {
      count++;
      start += term.length;
      if (count >= 8) break;
    }
    return count;
  }

  function scoreDoc(doc, query, terms) {
    const title = doc._title || normalize(doc.title);
    const description = doc._description || normalize(doc.description);
    const keywords = doc._keywords || normalize(doc.keywords);
    const body = doc._body || normalize(doc.text);
    const normalizedQuery = normalize(query);
    const compactQuery = normalizedQuery.replace(/[^a-z0-9]/g,'');
    let score = 0;

    // Individual fittings should only appear when somebody is searching a
    // concrete part number. Generic "Additel" searches belong to the directory.
    if (doc.type === 'Adapter') {
      if (!compactQuery.startsWith('adt100') || compactQuery.length < 8) return 0;
      const compactSku = normalize(doc.partNumber).replace(/[^a-z0-9]/g,'');
      if (compactSku === compactQuery) score += 400;
      else if (compactSku.startsWith(compactQuery)) score += 170;
    }

    if (title === normalizedQuery) score += 180;
    else if (title.startsWith(normalizedQuery)) score += 120;
    else if (title.includes(normalizedQuery)) score += 90;

    if (description.includes(normalizedQuery)) score += 45;
    if (keywords.includes(normalizedQuery)) score += 65;
    if (body.includes(normalizedQuery)) score += 30;

    terms.forEach(function(term) {
      if (title.includes(term)) score += 32;
      if (description.includes(term)) score += 14;
      if (keywords.includes(term)) score += 36;
      score += Math.min(20, frequency(body, term) * 4);
    });

    const allTerms = terms.every(function(term) {
      return title.includes(term) || description.includes(term) ||
        keywords.includes(term) || body.includes(term);
    });
    if (!allTerms) return 0;

    if (doc.type === 'Directory') score += 14;
    if (doc.type === 'Product') score += 2;
    if (doc.url === location.pathname) score -= 3;
    return score;
  }

  function makeSnippet(doc, terms) {
    const text = String(doc.text || '').replace(/\s+/g,' ').trim();
    if (!text) return doc.description || '';

    const lower = text.toLowerCase();
    let hit = -1;
    let hitTerm = '';

    terms.forEach(function(term) {
      const i = lower.indexOf(term.toLowerCase());
      if (i !== -1 && (hit === -1 || i < hit)) {
        hit = i;
        hitTerm = term;
      }
    });

    if (hit === -1) return doc.description || text.slice(0,190);

    const start = Math.max(0, hit - 78);
    const end = Math.min(text.length, hit + Math.max(110, hitTerm.length + 105));
    let snippet = text.slice(start,end).trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet += '…';
    return snippet;
  }

  function regexEscape(value) {
    return String(value).replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');
  }

  function highlight(value, terms) {
    let html = escapeHtml(value);
    const escaped = terms.slice().sort(function(a,b){ return b.length-a.length; })
      .map(regexEscape).filter(Boolean);
    if (!escaped.length) return html;
    const re = new RegExp('(' + escaped.join('|') + ')','ig');
    return html.replace(re,'<mark>$1</mark>');
  }

  async function ensureIndex() {
    if (index) return index;
    if (!indexPromise) {
      // The catalog is rebuilt at deployment. Never reuse a stale index
      // from a previous site version in the same browser.
      indexPromise = fetch('/search-index.json', {cache:'no-store'})
        .then(function(response) {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        })
        .then(function(raw) {
          index = raw.map(function(doc) {
            doc._title = normalize(doc.title);
            doc._description = normalize(doc.description);
            doc._keywords = normalize(doc.keywords);
            doc._body = normalize(doc.text);
            return doc;
          });
          return index;
        })
        .catch(function(error) {
          indexPromise = null;
          throw error;
        });
    }
    return indexPromise;
  }

  function closeResults() {
    results.hidden = true;
    input.setAttribute('aria-expanded','false');
    selected = -1;
  }

  function choose(value) {
    selected = value;
    const options = Array.from(results.querySelectorAll('.global-search-result'));
    options.forEach(function(el,i) {
      const active = i === selected;
      el.classList.toggle('active',active);
      el.setAttribute('aria-selected',active ? 'true' : 'false');
      if (active) el.scrollIntoView({block:'nearest'});
    });
  }

  function render(query, docs) {
    const terms = tokens(query);
    selected = -1;

    if (!query.trim()) {
      results.innerHTML = '<div class="global-search-empty"><strong>Search all pages and products</strong><span>Try “Additel adapters”, “Autoclave”, “ADT100-HPM-HPM”, “IP67”, or “TUR”.</span></div>';
      results.hidden = false;
      input.setAttribute('aria-expanded','true');
      return;
    }

    if (!docs.length) {
      results.innerHTML = '<div class="global-search-empty"><strong>No matching pages or parts</strong><span>Try a broader keyword, alternate product name or exact part number.</span></div>';
      results.hidden = false;
      input.setAttribute('aria-expanded','true');
      return;
    }

    const visible = expanded ? docs : docs.slice(0, INITIAL_LIMIT);
    results.innerHTML = '<div class="global-search-count">' +
      'Found ' + docs.length + ' matching pages or parts' +
      (docs.length > INITIAL_LIMIT && !expanded ? ' · showing first ' + INITIAL_LIMIT : '') +
      '</div>' +
      visible.map(function(doc,i) {
        const snippet = makeSnippet(doc,terms);
        return '<a class="global-search-result" role="option" aria-selected="false" data-index="' + i + '" href="' + escapeHtml(doc.url) + '">' +
          '<div class="global-search-result-top">' +
            '<span class="global-search-type">' + escapeHtml(doc.type) + '</span>' +
            '<span class="global-search-path">' + escapeHtml(doc.url) + '</span>' +
          '</div>' +
          '<strong>' + highlight(doc.title,terms) + '</strong>' +
          '<p>' + highlight(snippet,terms) + '</p>' +
        '</a>';
      }).join('') +
      (docs.length > INITIAL_LIMIT && !expanded
        ? '<button class="global-search-more" type="button">Show all ' + docs.length + ' results ↓</button>'
        : '');

    results.hidden = false;
    input.setAttribute('aria-expanded','true');
  }

  let timer;
  function runSearch() {
    const query = input.value;
    clearTimeout(timer);
    timer = setTimeout(async function() {
      try {
        const docs = await ensureIndex();
        if (input.value !== query) return;
        if (!query.trim()) {
          render('',[]);
          return;
        }
        const terms = tokens(query);
        currentMatches = docs
          .map(function(doc){ return {doc:doc,score:scoreDoc(doc,query,terms)}; })
          .filter(function(item){ return item.score > 0; })
          .sort(function(a,b){ return b.score-a.score || a.doc.title.localeCompare(b.doc.title); })
          .map(function(item){ return item.doc; });
        expanded = false;
        render(query,currentMatches);
      } catch (error) {
        results.innerHTML = '<div class="global-search-empty"><strong>Search is temporarily unavailable</strong><span>Please try again in a moment.</span></div>';
        results.hidden = false;
      }
    },70);
  }

  results.addEventListener('click',function(event) {
    const button = event.target.closest('.global-search-more');
    if (!button) return;
    expanded = true;
    render(input.value,currentMatches);
    results.scrollTop = 0;
  });

  input.addEventListener('focus',function(){
    if (!input.value.trim()) render('',[]);
    else runSearch();
    ensureIndex().catch(function(){});
  });

  input.addEventListener('input',runSearch);

  input.addEventListener('keydown',function(event){
    const options = Array.from(results.querySelectorAll('.global-search-result'));
    if (event.key === 'ArrowDown' && options.length) {
      event.preventDefault();
      choose(Math.min(selected+1,options.length-1));
    } else if (event.key === 'ArrowUp' && options.length) {
      event.preventDefault();
      choose(Math.max(selected-1,0));
    } else if (event.key === 'Enter' && selected >= 0 && options[selected]) {
      event.preventDefault();
      options[selected].click();
    } else if (event.key === 'Escape') {
      closeResults();
      input.blur();
    }
  });

  document.addEventListener('keydown',function(event){
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
      input.select();
    }
    if (event.key === '/' && !/input|textarea|select/i.test((document.activeElement && document.activeElement.tagName) || '')) {
      event.preventDefault();
      input.focus();
    }
  });

  document.addEventListener('click',function(event){
    if (!search.contains(event.target)) closeResults();
  });
})();