/* Bobby-Ques open/closed sign.
   It reads the Hours table in index.html, so hours only ever need to be changed there. */
(function () {
  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  var hours = {};   // day number -> [open, close] in minutes after midnight
  var unreadable = false; // a time we can't read: show a neutral sign instead of guessing
  var rows = [];    // [table row, day numbers] for the "Today" tag
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

  // Day and minute right now in Waterloo, whatever time zone the visitor is in
  function now() {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (type) { for (var i = 0; i < p.length; i++) if (p[i].type === type) return p[i].value; };
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
      min: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10)
    };
  }

  function fmt(m) {
    if (m === 1440 || m === 0) return 'midnight';
    if (m === 720) return 'noon';
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap;
  }

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
})();
