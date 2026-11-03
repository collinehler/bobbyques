/* Bobby-Ques website script.
   1. The open/closed sign at the top. It reads the Hours table in index.html,
      so hours only ever need to be changed there.
   2. The hours Google reads, built from the same table.
   3. The catering request form, which opens an email with the answers filled in.
   4. The notice line, hidden when it's empty. */
(function () {
  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first, for listing days in order

  // "Saturday" or "Sat" -> 6
  function dayIndex(word) {
    word = word.trim().toLowerCase();
    if (word.length < 3) return -1;
    for (var i = 0; i < 7; i++) if (DAYS[i].indexOf(word.slice(0, 3)) === 0) return i;
    return -1;
  }

  // "Saturday" -> [6], "Monday to Friday" -> [1,2,3,4,5], "Saturday and Sunday" -> [6,0]
  function parseDays(label) {
    label = label.toLowerCase().trim();
    var range = label.split(/\s+(?:to|through|thru)\s+|\s*[-–]\s*/);
    if (range.length === 2) {
      var a = dayIndex(range[0]), b = dayIndex(range[1]);
      if (a < 0 || b < 0) return [];
      var out = [a];
      while (a !== b) { a = (a + 1) % 7; out.push(a); }
      return out;
    }
    return label.split(/\s*(?:,|&|\band\b)\s*/).map(dayIndex).filter(function (d) { return d >= 0; });
  }

  // "11 AM" -> 660, "6:30 PM" -> 1110, "Noon" -> 720, "Midnight" -> 1440 (as a closing time)
  function parseTime(text, isClose) {
    var t = text.trim().toLowerCase().replace(/\./g, '');
    if (t === 'noon') return 720;
    if (t === 'midnight') return isClose ? 1440 : 0;
    var m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (!m) return null;
    return (parseInt(m[1], 10) % 12 + (m[3] === 'pm' ? 12 : 0)) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
  }

  // "11 AM to 6 PM" -> [660, 1080]; "Closed" or anything unreadable -> null
  function parseHours(text) {
    var parts = text.toLowerCase().split(/\s+to\s+|\s*[-–]\s*/);
    if (parts.length !== 2) return null;
    var open = parseTime(parts[0], false), close = parseTime(parts[1], true);
    if (open === null || close === null) return null;
    if (close <= open) close = 1440; // runs past midnight: count it as open until midnight
    return [open, close];
  }

  var hours = {};         // day number -> [open, close] in minutes after midnight
  var unreadable = false; // a time we can't read: show a neutral sign instead of guessing
  var rows = [];          // [table row, day numbers] for the "Today" tag
  var table = document.getElementById('hours-table');
  if (table) {
    var trs = table.querySelectorAll('tbody tr');
    for (var r = 0; r < trs.length; r++) {
      var th = trs[r].querySelector('th'), td = trs[r].querySelector('td');
      if (!th || !td) continue;
      var days = parseDays(th.textContent), span = parseHours(td.textContent);
      rows.push([trs[r], days]);
      if (!span) {
        if (/closed/i.test(td.textContent)) trs[r].classList.add('closed'); else unreadable = true;
        continue;
      }
      for (var k = 0; k < days.length; k++) hours[days[k]] = span;
    }
  }

  // Parts of the date and time right now in Waterloo, whatever time zone the visitor is in
  function waterloo(options) {
    var o = { timeZone: 'America/Chicago' };
    for (var key in options) o[key] = options[key];
    var parts = new Intl.DateTimeFormat('en-US', o).formatToParts(new Date()), out = {};
    for (var i = 0; i < parts.length; i++) out[parts[i].type] = parts[i].value;
    return out;
  }
  function now() {
    var p = waterloo({ weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
      min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10)
    };
  }

  function fmt(m) {
    if (m === 1440 || m === 0) return 'midnight';
    if (m === 720) return 'noon';
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap;
  }

  // Days with the same hours, grouped: [{span: [660, 1080], days: [6, 0]}], Monday first
  function groupByHours() {
    var groups = [];
    WEEK.forEach(function (d) {
      var h = hours[d];
      if (!h) return;
      var g = groups.filter(function (x) { return x.span[0] === h[0] && x.span[1] === h[1]; })[0];
      if (!g) { g = { span: h, days: [] }; groups.push(g); }
      g.days.push(d);
    });
    return groups;
  }

  // [6, 0] -> "Saturday and Sunday", [1, 2, 3, 4, 5] -> "Monday to Friday"
  function dayList(days) {
    var idx = days.map(function (d) { return WEEK.indexOf(d); }), runs = [], start = idx[0], prev = idx[0];
    for (var i = 1; i <= idx.length; i++) {
      if (i < idx.length && idx[i] === prev + 1) { prev = idx[i]; continue; }
      runs.push([start, prev]);
      if (i < idx.length) start = prev = idx[i];
    }
    var parts = runs.map(function (run) {
      var a = NAMES[WEEK[run[0]]], b = NAMES[WEEK[run[1]]];
      return run[0] === run[1] ? a : run[1] - run[0] === 1 ? a + ' and ' + b : a + ' to ' + b;
    });
    return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  // 1. The sign
  function render() {
    var sign = document.getElementById('sign');
    if (!sign) return;
    var t = now(), today = hours[t.day];
    var title = 'Hours', detail = 'See our hours below', open = false;
    if (unreadable) {
      // leave the neutral "Hours / See our hours below"
    } else if (today && t.min >= today[0] && t.min < today[1]) {
      open = true; title = 'Open now'; detail = 'Today until ' + fmt(today[1]);
    } else {
      for (var i = 0; i < 8; i++) {
        var d = (t.day + i) % 7, h = hours[d];
        if (!h || (i === 0 && t.min >= h[0])) continue;
        title = 'Closed right now';
        detail = 'Opens ' + (i === 0 ? 'today' : i === 1 ? 'tomorrow' : NAMES[d]) + ' at ' + fmt(h[0]);
        break;
      }
    }
    sign.classList.toggle('is-open', open);
    document.getElementById('status-title').textContent = title;
    document.getElementById('status-detail').textContent = detail;
    for (var j = 0; j < rows.length; j++) rows[j][0].classList.toggle('today', rows[j][1].indexOf(t.day) > -1);
  }
  render();
  setInterval(render, 60000);

  // The week's hours on the sign, like "Saturday and Sunday, 11 AM to 6 PM"
  try {
    var week = document.getElementById('sign-week'), groups = groupByHours();
    if (week && !unreadable && groups.length) {
      week.textContent = groups.map(function (g) { return dayList(g.days) + ', ' + fmt(g.span[0]) + ' to ' + fmt(g.span[1]); }).join(' · ');
      week.hidden = false;
    }
  } catch (e) {}

  // 2. Hours and web address for Google, added to the business details in index.html
  try {
    var data = document.getElementById('business-data');
    if (data) {
      var info = JSON.parse(data.textContent);
      var hhmm = function (m) { m = Math.min(m, 1439); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
      info.url = location.href.split('#')[0];
      info.logo = info.image = new URL('images/logo.png', location.href).href;
      if (!unreadable) {
        info.openingHoursSpecification = groupByHours().map(function (g) {
          return { '@type': 'OpeningHoursSpecification', dayOfWeek: g.days.map(function (d) { return NAMES[d]; }), opens: hhmm(g.span[0]), closes: hhmm(g.span[1]) };
        });
      }
      data.textContent = JSON.stringify(info);
    }
  } catch (e) {}

  // 3. Catering request form
  try {
    var form = document.getElementById('cater-form');
    if (form) {
      var field = function (id) { return document.getElementById(id); };
      var date = field('c-date');
      // The earliest date we can take: 72 hours (3 days) from today in Waterloo
      var p = waterloo({ year: 'numeric', month: '2-digit', day: '2-digit' });
      var first = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + 3));
      date.min = first.toISOString().slice(0, 10);
      date.addEventListener('invalid', function () {
        if (date.validity.rangeUnderflow) date.setCustomValidity('Catering needs at least 72 hours of notice. Please pick a later date.');
      });
      date.addEventListener('input', function () { date.setCustomValidity(''); });

      var pretty = function (value, opts) {
        opts.timeZone = 'UTC';
        return new Intl.DateTimeFormat('en-US', opts).format(new Date(value + 'T12:00:00Z'));
      };
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var lines = ['Catering request from the website', '',
          'Name: ' + field('c-name').value.trim(),
          'Phone: ' + field('c-phone').value.trim()];
        if (field('c-email').value.trim()) lines.push('Email: ' + field('c-email').value.trim());
        lines.push('Event date: ' + pretty(date.value, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
        lines.push('Number of people: ' + field('c-people').value);
        if (field('c-where').value.trim()) lines.push('Where: ' + field('c-where').value.trim());
        if (field('c-what').value.trim()) lines.push('', "What we'd like:", field('c-what').value.trim());
        var subject = 'Catering request: ' + pretty(date.value, { month: 'short', day: 'numeric' }) + ', ' + field('c-people').value + ' people';
        window.location.href = 'mailto:' + form.getAttribute('data-email') +
          '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      });
    }
  } catch (e) {}

  // 4. Hide the notice line when nothing is typed in it
  var notice = document.getElementById('notice');
  if (notice && !notice.textContent.trim()) notice.hidden = true;
})();
