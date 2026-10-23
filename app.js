/* 灵飞经字帖 · 前端逻辑 */
(function () {
  'use strict';

  var D = window.LFJ;
  var IMG = function (id) { return 'chars/' + id + '.webp'; };

  /* ---------- 简 → 繁（本帖用字） ---------- */
  var S2T = {
    '灵': '靈', '当': '當', '于': '於', '为': '為', '经': '經', '妇': '婦', '宫': '宮',
    '游': '遊', '赵': '趙', '寝': '寢', '对': '對', '极': '極', '诚': '誠', '积': '積',
    '将': '將', '变': '變', '伟': '偉', '远': '遠', '飞': '飛', '数': '數', '处': '處',
    '药': '藥', '爱': '愛', '儿': '兒', '鲁': '魯', '连': '連', '复': '復', '东': '東',
    '阳': '陽', '书': '書', '师': '師', '两': '兩', '丧': '喪', '与': '與', '灾': '災',
    '烧': '燒', '琼': '瓊', '须': '須', '洁': '潔', '遗': '遺', '秽': '穢', '尘': '塵',
    '浊': '濁', '烟': '煙', '竞': '競', '辈': '輩', '没': '沒', '虚': '虛', '气': '氣',
    '发': '發', '长': '長', '视': '視', '万': '萬', '厨': '廚', '韩': '韓', '时': '時',
    '鸟': '鳥', '兽': '獸', '随': '隨', '并': '並', '华': '華', '诸': '諸', '台': '臺',
    '见': '見', '汉': '漢', '辽': '遼', '军': '軍', '骞': '騫', '刘': '劉', '别': '別',
    '驾': '駕', '渔': '漁', '该': '該', '后': '後', '门': '門', '绀': '紺', '学': '學',
    '婿': '壻', '陆': '陸', '浑': '渾', '隐': '隱', '传': '傳', '内': '內', '启': '啟',
    '过': '過', '斋': '齋', '双': '雙', '丝': '絲', '缯': '繒', '坛': '壇', '违': '違',
    '负': '負', '获': '獲', '风': '風', '诣': '詣', '损': '損', '赆': '贐', '环': '鐶',
    '镮': '鐶', '污': '汙', '岳': '岳', '群': '群', '众': '眾', '历': '歷', '尽': '盡',
    '归': '歸', '无': '無', '处': '處', '众': '眾', '灵': '靈', '经': '經'
  };
  function norm(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) { var c = s[i]; out += (S2T[c] || c); }
    return out;
  }

  /* ---------- 索引 ---------- */
  var chars = D.chars;
  var byChar = new Map();       // 字 -> [entry,...]
  var order = [];               // 按出现次数排序的字
  chars.forEach(function (e) {
    if (!byChar.has(e.c)) { byChar.set(e.c, []); order.push(e.c); }
    byChar.get(e.c).push(e);
  });
  order.sort(function (a, b) {
    var d = byChar.get(b).length - byChar.get(a).length;
    return d !== 0 ? d : (byChar.get(a)[0].i < byChar.get(b)[0].i ? -1 : 1);
  });
  var firstEnc = new Map();     // 字 -> 全篇第几个字
  chars.forEach(function (e, i) { if (!firstEnc.has(e.c)) firstEnc.set(e.c, i); });

  function glyphHTML(id, cls) {
    return '<img class="glyph ' + (cls || '') + '" src="' + IMG(id) + '" alt="">';
  }
  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- 视图切换 ---------- */
  var curView = 'search';
  function showView(name) {
    curView = name;
    $$('#tabs button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.view === name);
    });
    $$('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'view-' + name); });
    if (name === 'full') renderFull();
    if (name === 'sheet') renderSheet();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-view]');
    if (b) showView(b.dataset.view);
  });

  /* ---------- 字库索引 ---------- */
  function renderIndex() {
    var wrap = $('#index');
    var frag = document.createDocumentFragment();
    order.forEach(function (c) {
      var n = byChar.get(c).length;
      var d = el('<div class="ci" title="' + c + ' · 出现 ' + n + ' 次" data-c="' + c + '">' +
        glyphHTML(byChar.get(c)[0].i) + (n > 1 ? '<em>' + n + '</em>' : '') + '</div>');
      frag.appendChild(d);
    });
    wrap.innerHTML = '';
    wrap.appendChild(frag);
    $('#nUniq').textContent = order.length;
  }
  $('#index').addEventListener('click', function (e) {
    var d = e.target.closest('.ci');
    if (d) openDetail(d.dataset.c);
  });

  /* ---------- 单字详情 ---------- */
  var detailChar = null, detailIdx = 0;
  function openDetail(c, idx, scroll) {
    if (!byChar.has(c)) return;
    detailChar = c;
    detailIdx = idx || 0;
    showView('search');
    renderDetail();
    if (scroll !== false) {
      var box = $('#detail');
      var r = box.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.45) {
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function renderDetail() {
    var list = byChar.get(detailChar);
    var e = list[detailIdx] || list[0];
    var posInText = firstEnc.get(detailChar) + 1;
    var html =
      '<div class="bigcell tian" id="bigcell">' + glyphHTML(e.i) + '</div>' +
      '<div class="detail-info">' +
      '<h3>' + detailChar + ' <em>本处写法 ' + (detailIdx + 1) + ' / ' + list.length + '</em></h3>' +
      '<p class="stats">全篇出现 <b>' + list.length + '</b> 次 · 首见于第 ' + posInText + ' 字 · 此处：第 ' + e.l + ' 行第 ' + e.k + ' 字</p>' +
      '<div class="ctrl">' +
      '<button id="bTrace">描红</button>' +
      '<button id="bGrid" class="on">米字格</button>' +
      '<button id="bInvert">反白</button>' +
      '<button class="btn primary" id="bAdd">加入临摹纸</button>' +
      '</div>' +
      '<p class="tip" style="margin:0 0 6px">全部 ' + list.length + ' 处写法（点选切换）</p>' +
      '<div class="occur" id="occur">' + list.map(function (x, i) {
        return '<div class="o' + (i === detailIdx ? ' on' : '') + '" data-i="' + i + '" title="第' + x.l + '行第' + x.k + '字">' + glyphHTML(x.i) + '<i>' + (i + 1) + '</i></div>';
      }).join('') + '</div>' +
      '</div>';
    var d = $('#detail');
    d.classList.remove('hidden');
    d.innerHTML = html;

    // 描红状态：默认浅朱红
    var traced = false, grid = true, invert = false;
    function apply() {
      var bc = $('#bigcell');
      bc.classList.toggle('tian', grid);
      bc.classList.toggle('plain', !grid);
      bc.style.backgroundColor = invert ? '#25221e' : '#fff';
      bc.classList.toggle('tracing', traced && !invert);
      bc.classList.toggle('inverted', invert);
      $('#bTrace').classList.toggle('on', traced);
      $('#bGrid').classList.toggle('on', grid);
      $('#bInvert').classList.toggle('on', invert);
    }
    apply();
    $('#bTrace').onclick = function () { traced = !traced; apply(); };
    $('#bGrid').onclick = function () { grid = !grid; apply(); };
    $('#bInvert').onclick = function () { invert = !invert; apply(); };
    $('#bAdd').onclick = function () { addToSheet(detailChar); };
    $('#occur').addEventListener('click', function (ev) {
      var o = ev.target.closest('.o');
      if (!o) return;
      detailIdx = +o.dataset.i;
      renderDetail();
    });
  }

  function fmtPos(n) { return String(n); }

  /* ---------- 搜索 ---------- */
  var qEl = $('#q');
  qEl.addEventListener('input', function () {
    var raw = qEl.value.trim();
    var box = $('#detail');
    if (!raw) { box.classList.add('hidden'); return; }
    var s = norm(raw);
    if (s.length === 1) {
      if (byChar.has(s)) { detailChar = s; detailIdx = 0; renderDetail(); }
      else {
        box.classList.remove('hidden');
        box.innerHTML = '<div style="grid-column:1/-1;color:#8d8577">帖中没有「' + raw + '」' +
          (s !== raw ? '（按繁体「' + s + '」查也没有）' : '') + '。换个字试试，或点下方字库。</div>';
      }
      return;
    }
    // 多字：全文检索
    var hits = [];
    var from = 0;
    while (from < D.text.length) {
      var p = D.text.indexOf(s, from);
      if (p < 0) break;
      hits.push(p);
      from = p + 1;
      if (hits.length > 50) break;
    }
    box.classList.remove('hidden');
    if (!hits.length) {
      box.innerHTML = '<div style="grid-column:1/-1;color:#8d8577">没有找到「' + raw + '」。</div>';
      return;
    }
    box.innerHTML = '<div style="grid-column:1/-1">' +
      '<p class="stats" style="margin-bottom:14px">找到 <b>' + hits.length + '</b> 处「' + raw + '」</p>' +
      '<div class="hit-list">' + hits.map(function (p) {
        var a = Math.max(0, p - 4), b = Math.min(chars.length, p + s.length + 4);
        var seg = chars.slice(a, b).map(function (x, i) {
          var on = (a + i) >= p && (a + i) < p + s.length;
          return '<div class="o' + (on ? ' on' : '') + '" data-c="' + x.c + '">' + glyphHTML(x.i) + '</div>';
        }).join('');
        return '<div class="hit"><div class="ctx">' + seg + '</div></div>';
      }).join('') + '</div></div>';
  });
  $('#detail').addEventListener('click', function (e) {
    var o = e.target.closest('.o[data-c]');
    if (o) openDetail(o.dataset.c);
  });

  /* ---------- 全篇 ---------- */
  var fullMode = 'char', fullRendered = false, zoomSize = 60;
  function renderFull() {
    var box = $('#fulltext');
    if (fullMode === 'scan') {
      var h = '';
      D.pages.forEach(function (p, pi) {
        h += '<figure><img src="pages/' + p + '.webp" alt="第' + (pi + 1) + '页" loading="lazy">' +
             '<figcaption>第 ' + (pi + 1) + ' 页 · 原帖影印</figcaption></figure>';
      });
      box.className = 'fulltext scan-list';
      box.innerHTML = h;
      fullRendered = true;
      return;
    }
    box.className = 'fulltext';
    var size = zoomSize;
    if (fullRendered && box.dataset.size === String(size) && box.dataset.mode === 'char') return;
    var idx = 0, html = '';
    D.pages.forEach(function (p, pi) {
      var lines = D.lines[p];
      var cols = lines.map(function (line) {
        var cells = '';
        for (var i = 0; i < line.length; i++) {
          var e = chars[idx];
          cells += '<div class="c" data-c="' + (e ? e.c : '') + '" title="' + (e ? e.c : '') + '" style="width:' + size + 'px;height:' + size + 'px">' +
            (e ? glyphHTML(e.i) : '') + '</div>';
          idx++;
        }
        return '<div class="col">' + cells + '</div>';
      }).join('');
      html += '<div class="paper-block">' +
        '<div class="page-label">第 ' + (pi + 1) + ' 页</div>' +
        '<div class="page-cols">' + cols + '</div>' +
        '<p class="page-text">' + lines.join('，') + '</p></div>';
    });
    box.innerHTML = html;
    box.dataset.size = String(size);
    box.dataset.mode = 'char';
    fullRendered = true;
  }
  $('#fullMode').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (!b) return;
    fullMode = b.dataset.mode;
    Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
      x.classList.toggle('on', x === b);
    });
    $('#zoomWrap').style.display = (fullMode === 'char') ? '' : 'none';
    $('#fullTip').textContent = (fullMode === 'char') ? '右键/点击字可查看单字' : '影印自大都会博物馆藏墨迹本高清扫描';
    renderFull();
  });
  $('#zoom').addEventListener('input', function () {
    zoomSize = +this.value;
    fullRendered = false;
    renderFull();
  });
  $('#showText').addEventListener('change', function () {
    document.body.classList.toggle('show-text', this.checked);
  });
  $('#fulltext').addEventListener('click', function (e) {
    var c = e.target.closest('.c');
    if (c && c.dataset.c) openDetail(c.dataset.c);
  });

  /* ---------- 临摹纸 ---------- */
  var STORE = 'lfj.sheet.v1';
  var sheet = [];
  try { sheet = JSON.parse(localStorage.getItem(STORE) || '[]') || []; } catch (e) { sheet = []; }
  sheet = sheet.filter(function (c) { return byChar.has(c); });

  function saveSheet() {
    try { localStorage.setItem(STORE, JSON.stringify(sheet)); } catch (e) {}
    var b = $('#sheetCount');
    b.textContent = sheet.length;
    b.classList.toggle('zero', sheet.length === 0);
    $('#sheetN').textContent = sheet.length;
  }
  function addToSheet(c) {
    if (!sheet.includes(c)) sheet.push(c);
    saveSheet();
    var btn = $('#bAdd');
    if (btn) { btn.textContent = '已加入 ✓'; setTimeout(function () { btn.textContent = '加入临摹纸'; }, 1200); }
  }

  function cellHTML(id, kind, ch) {
    var rm = kind === 'sample' ? '<span class="rm" title="移除">×</span>' : '';
    return '<div class="cell ' + kind + (kind === 'blank' ? ' tian' : '') + '" data-c="' + ch + '">' +
      (kind === 'blank' ? '' : glyphHTML(id)) + rm + '</div>';
  }

  function renderSheet() {
    var wrap = $('#sheet');
    var traceN = +$('#traceN').value || 0;
    var blankN = +$('#blankN').value || 0;
    var gridOn = $('#gridOn').checked;
    var traceOn = $('#traceOn').checked;
    saveSheet();
    if (!sheet.length) {
      wrap.innerHTML = '';
      $('#sheetEmpty').classList.remove('hidden');
      return;
    }
    $('#sheetEmpty').classList.add('hidden');
    wrap.innerHTML = sheet.map(function (c, si) {
      var e = byChar.get(c)[0];
      var cells = cellHTML(e.i, 'sample', c);
      for (var i = 0; i < traceN; i++) cells += cellHTML(e.i, traceOn ? 'trace' : 'blank', c);
      for (var j = 0; j < blankN; j++) cells += cellHTML(e.i, 'blank', c);
      return '<div class="sheet-row" data-c="' + c + '">' +
        '<span class="lead">' + (si + 1) + '</span>' + cells + '</div>';
    }).join('');
    // 米字格开关
    $$('#sheet .cell').forEach(function (cell) {
      cell.classList.toggle('tian', gridOn);
    });
  }

  $('#sheet').addEventListener('click', function (e) {
    var rm = e.target.closest('.rm');
    if (rm) {
      var row = rm.closest('.sheet-row');
      var c = row.dataset.c;
      sheet = sheet.filter(function (x) { return x !== c; });
      saveSheet(); renderSheet();
    }
  });
  ['traceN', 'blankN', 'gridOn', 'traceOn'].forEach(function (id) {
    $('#' + id).addEventListener('change', renderSheet);
    $('#' + id).addEventListener('input', renderSheet);
  });
  $('#clearSheet').onclick = function () {
    if (!sheet.length) return;
    if (confirm('清空已选的 ' + sheet.length + ' 个字？')) { sheet = []; saveSheet(); renderSheet(); }
  };
  $('#printBtn').onclick = function () { window.print(); };
  $('#sheetEmpty').addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    location.hash = a.getAttribute('href');
  });

  /* ---------- 初始化 ---------- */
  renderIndex();
  saveSheet();

  // 加深墨色（记住开关）
  var DEEP_KEY = 'lfj.deepen.v1';
  function applyDeepen(on) {
    document.body.classList.toggle('deepen', !!on);
    var b = $('#deepenBtn');
    if (b) b.classList.toggle('deep-on', !!on);
  }
  var forcedDeep = /[?&]deep=(1|on)/.test(location.search);
  if (forcedDeep) applyDeepen(true);
  else { try { applyDeepen(localStorage.getItem(DEEP_KEY) === '1'); } catch (e) {} }
  $('#deepenBtn').addEventListener('click', function () {
    var on = !document.body.classList.contains('deepen');
    applyDeepen(on);
    try { localStorage.setItem(DEEP_KEY, on ? '1' : '0'); } catch (e) {}
  });

  // 深链接：#full / #sheet / #c/字
  function route() {
    var h = decodeURIComponent(location.hash || '');
    if (h === '#about') showView('about');
    else if (h === '#full' || h === '#full-scan') {
      if (h === '#full-scan' && fullMode !== 'scan') {
        fullMode = 'scan';
        Array.prototype.forEach.call($('#fullMode').querySelectorAll('button'), function (x) {
          x.classList.toggle('on', x.dataset.mode === 'scan');
        });
        $('#zoomWrap').style.display = 'none';
        $('#fullTip').textContent = '影印自大都会博物馆藏墨迹本高清扫描';
      }
      showView('full');
    }
    else if (h === '#sheet') showView('sheet');
    else if (h.indexOf('#sheet/') === 0) {
      var pick = h.slice(7).split('');
      sheet = pick.filter(function (c) { return byChar.has(c); });
      saveSheet();
      showView('sheet');
    }
    else if (h.indexOf('#c/') === 0) openDetail(h.slice(3), 0, false);
    else showView('search');
  }
  window.addEventListener('hashchange', route);
  document.body.classList.toggle('show-text', $('#showText').checked);
  route();
})();