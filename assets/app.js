/* EmailCheck site — language toggle + live tool widgets.
   The widgets call the real EmailCheck API at emailcheck-api.pages.dev. */
(function () {
  var API = 'https://emailcheck-api.pages.dev';

  /* ---------- language ---------- */
  var root = document.documentElement;
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    try { localStorage.setItem('ec-lang', l); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('ec-lang'); } catch (e) {}
  if (saved === 'zh' || saved === 'en') setLang(saved);
  document.querySelectorAll('[data-setlang]').forEach(function (b) {
    b.addEventListener('click', function () {
      setLang(root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh');
    });
  });
  function lang() { return root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en'; }
  var T = {
    en: { valid: 'Valid', risky: 'Risky', invalid: 'Invalid', score: 'Score', suggestion: 'Did you mean',
      syntax: 'Syntax', domain: 'Domain exists', mx: 'MX found', disposable: 'Disposable domain',
      role: 'Role account', free: 'Free provider', catchall: 'Catch-all risk', age: 'Domain age (days)',
      yes: 'yes', no: 'no', checking: 'Checking…', check: 'Check this address',
      failed: 'The check did not complete. The API may be unreachable from this browser right now — try again in a moment, or run the same check from the RapidAPI listing.' },
    zh: { valid: '有效', risky: '有风险', invalid: '无效', score: '分数', suggestion: '你是不是指',
      syntax: '格式', domain: '域名存在', mx: '有 MX 记录', disposable: '一次性域名',
      role: '角色账号', free: '免费邮箱服务商', catchall: 'Catch-all 风险', age: '域名年龄（天）',
      yes: '是', no: '否', checking: '检查中…', check: '检查这个地址',
      failed: '这次检查没跑完。当前浏览器可能连不上 API——稍后再试，或去 RapidAPI 产品页里跑同样的检查。' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- single check ---------- */
  var form = document.getElementById('ec-form');
  if (form) {
    var input = document.getElementById('ec-email');
    var btn = document.getElementById('ec-btn');
    var box = document.getElementById('ec-result');
    var err = document.getElementById('ec-error');
    document.querySelectorAll('[data-sample]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.getAttribute('data-sample');
        form.requestSubmit();
      });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = input.value.trim();
      if (!email) return;
      var t = T[lang()];
      btn.disabled = true; btn.textContent = t.checking;
      err.className = 'err'; box.className = 'result';
      fetch(API + '/validate?email=' + encodeURIComponent(email))
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (d) {
          var v = (d.verdict || 'invalid').toLowerCase();
          var rows = [
            [t.score, esc(d.score) + ' / 100'],
            [t.syntax, d.checks.syntax ? t.yes : t.no],
            [t.domain, d.checks.domainExists ? t.yes : t.no],
            [t.mx, d.checks.mxFound ? t.yes : t.no],
            [t.disposable, d.checks.disposable ? t.yes : t.no],
            [t.role, d.checks.roleAccount ? t.yes : t.no],
            [t.free, d.checks.freeProvider ? t.yes : t.no],
            [t.catchall, esc(d.catchAllRisk)],
            [t.age, d.domainAgeDays == null ? '—' : esc(d.domainAgeDays)]
          ];
          if (d.suggestion) rows.unshift([t.suggestion, esc(d.suggestion)]);
          box.innerHTML =
            '<span class="stamp ' + esc(v) + '">' + esc(t[v] || v) + '</span>' +
            '<div class="kv">' + rows.map(function (r) {
              return '<div>' + r[0] + ': <b>' + r[1] + '</b></div>';
            }).join('') + '</div>' +
            '<p class="note">' + esc(d.note || '') + '</p>';
          box.className = 'result on';
        })
        .catch(function () { err.textContent = T[lang()].failed; err.className = 'err on'; })
        .finally(function () { btn.disabled = false; btn.textContent = T[lang()].check; });
    });
  }

  /* ---------- batch check ---------- */
  var bform = document.getElementById('ecb-form');
  if (bform) {
    var binput = document.getElementById('ecb-input');
    var bbtn = document.getElementById('ecb-btn');
    var bbox = document.getElementById('ecb-result');
    var berr = document.getElementById('ecb-error');
    bform.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var emails = binput.value.split(/[\s,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!emails.length) return;
      if (emails.length > 100) emails = emails.slice(0, 100);
      bbtn.disabled = true;
      berr.className = 'err'; bbox.className = 'result';
      fetch(API + '/validate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emails })
      })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (d) {
          var res = d.results || [];
          var c = { valid: 0, risky: 0, invalid: 0, disposable: 0, typoLikely: 0 };
          res.forEach(function (r) {
            if (c.hasOwnProperty(r.verdict)) c[r.verdict]++;
            if (r.checks && r.checks.disposable) c.disposable++;
            if (r.typoLikely) c.typoLikely++;
          });
          var head = '<div class="kv">' +
            '<div>Total: <b>' + res.length + '</b></div>' +
            '<div>Valid: <b>' + c.valid + '</b></div>' +
            '<div>Risky: <b>' + c.risky + '</b></div>' +
            '<div>Invalid: <b>' + c.invalid + '</b></div>' +
            '<div>Disposable: <b>' + c.disposable + '</b></div>' +
            '<div>Likely typos: <b>' + c.typoLikely + '</b></div></div>';
          var rows = res.map(function (r) {
            return '<div>' + esc(r.email) + ' → <b>' + esc(r.verdict) + '</b> (' + esc(r.score) + ')' +
              (r.suggestion ? ' · ' + esc(T[lang()].suggestion) + ': ' + esc(r.suggestion) : '') + '</div>';
          }).join('');
          bbox.innerHTML = head + '<div class="kv" style="grid-template-columns:1fr">' + rows + '</div>' +
            '<p class="note">' + esc(d.note || '') + '</p>';
          bbox.className = 'result on';
        })
        .catch(function () { berr.textContent = T[lang()].failed; berr.className = 'err on'; })
        .finally(function () { bbtn.disabled = false; });
    });
  }
})();
