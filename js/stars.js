// Half-star rating: 5 slots, each a base outline star with a width-clipped
// filled star on top (0%, 50% or 100% depending on the value). Used both for
// static display in cards and as an interactive picker in the entry modal.
// Звёзды нарисованы в стиле «Фикса»: жёлтая заливка и тёмный контур.
window.Diary = window.Diary || {};

(function (Diary) {
  var PATH = 'M12 2.5l2.6 6 6.4.6-4.8 4.3 1.4 6.3L12 16.4 6.4 19.7l1.4-6.3L3 9.1l6.4-.6z';

  function starSvg(filled, size) {
    var std = Diary.design && Diary.design.isStandard();
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<path d="' + PATH + '" fill="' + (filled ? (std ? '#23201C' : '#FFE066') : 'none') + '" stroke="' + (std ? '#23201C' : '#1C1B3A') + '" stroke-width="' + (std ? 1.4 : 1.8) + '" stroke-linejoin="round"/></svg>';
  }

  function slotFillPercent(rating, slotIndex) {
    var frac = Diary.utils.clamp(rating - slotIndex, 0, 1);
    return Math.round(frac * 100) + '%';
  }

  function slotHtml(size, fill, extra) {
    return '<span class="star-slot" style="--size:' + size + 'px">' +
      '<span class="star-base">' + starSvg(false, size) + '</span>' +
      '<span class="star-fill" style="width:' + fill + '">' + starSvg(true, size) + '</span>' +
      (extra || '') +
      '</span>';
  }

  function staticStarsHtml(rating, size) {
    size = size || 15;
    var label = String(rating).replace('.', ',');
    var out = '<span class="stars-static" aria-label="Оценка ' + label + ' из 5">';
    for (var i = 0; i < 5; i++) out += slotHtml(size, slotFillPercent(rating, i));
    return out + '</span>';
  }

  // Renders an interactive picker into `container` and calls onChange(value)
  // whenever the user sets a new rating (0, 0.5, 1, ... 5). Click the
  // currently-set half again to clear the rating back to 0.
  function renderPicker(container, initialValue, onChange) {
    var value = initialValue || 0;
    var size = 32;
    container.innerHTML = '';
    container.classList.add('star-picker');
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Оценка');

    var html = '';
    for (var i = 0; i < 5; i++) {
      html += slotHtml(size, '0%',
        '<button type="button" class="star-hit star-hit-left" data-index="' + i + '" data-half="0.5" aria-label="' + (i + 0.5).toString().replace('.', ',') + ' из 5"></button>' +
        '<button type="button" class="star-hit star-hit-right" data-index="' + i + '" data-half="1" aria-label="' + (i + 1) + ' из 5"></button>');
    }
    container.innerHTML = html;
    var slots = container.querySelectorAll('.star-slot');

    function candidateOf(hit) {
      return parseInt(hit.getAttribute('data-index'), 10) + parseFloat(hit.getAttribute('data-half'));
    }

    container.querySelectorAll('.star-hit').forEach(function (hit) {
      hit.addEventListener('click', function () {
        var candidate = candidateOf(hit);
        value = (value === candidate) ? 0 : candidate;
        paint();
        onChange(value);
      });
      hit.addEventListener('mouseenter', function () { paint(candidateOf(hit)); });
    });
    container.addEventListener('mouseleave', function () { paint(); });

    function paint(previewValue) {
      var v = (typeof previewValue === 'number') ? previewValue : value;
      Array.prototype.forEach.call(slots, function (slot, i) {
        slot.querySelector('.star-fill').style.width = slotFillPercent(v, i);
      });
    }

    paint();
    return {
      getValue: function () { return value; },
      setValue: function (v) { value = v || 0; paint(); }
    };
  }

  Diary.stars = {
    staticStarsHtml: staticStarsHtml,
    renderPicker: renderPicker
  };
})(window.Diary);
