// Резервная копия: выгрузка всех записей и подборок в один файл и загрузка его
// обратно — в том числе на другом компьютере, чтобы перенести туда дневник.
//
// Импорт не заменяет данные, а сливает их с тем, что уже есть (см. importItems
// в репозиториях): так загрузка старой копии не затирает свежие правки, а
// перенос в пустой браузер работает как обычное восстановление.
window.Diary = window.Diary || {};

(function (Diary) {
  var FORMAT = 'fix';
  var VERSION = 1;

  function pad(n) { return String(n).padStart(2, '0'); }

  function fileName() {
    var d = new Date();
    return 'fix-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
  }

  function entriesWord(n) {
    return n + ' ' + Diary.utils.plural(n, ['запись', 'записи', 'записей']);
  }

  // «3 записи, 1 подборка» — перечислением, а не общим числом: записи и
  // подборки складывать в одну цифру нельзя, получается непонятно.
  function itemsList(entriesCount, collectionsCount) {
    var parts = [];
    if (entriesCount) parts.push(entriesWord(entriesCount));
    if (collectionsCount) {
      parts.push(collectionsCount + ' ' + Diary.utils.plural(collectionsCount, ['подборка', 'подборки', 'подборок']));
    }
    return parts.join(', ');
  }

  function exportAll() {
    // В копию идут и записи из корзины — иначе восстановление потеряло бы то,
    // что ещё можно вернуть.
    var payload = {
      app: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      entries: Diary.repository.getAll(),
      collections: Diary.collectionsRepo.getAll()
    };

    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Diary.toast('Копия скачана — ' + entriesWord(payload.entries.length));
  }

  function applyImport(data) {
    if (!data || data.app !== FORMAT || !Array.isArray(data.entries)) {
      Diary.toast('Это не похоже на копию «фикса» — выберите другой файл');
      return;
    }
    var entries = Diary.repository.importItems(data.entries);
    var collections = Diary.collectionsRepo.importItems(data.collections);

    var added = itemsList(entries.added, collections.added);
    var updated = itemsList(entries.updated, collections.updated);
    if (!added && !updated) {
      Diary.toast('Всё из копии уже здесь — ничего не изменилось');
      return;
    }
    var parts = [];
    if (added) parts.push('добавлено: ' + added);
    if (updated) parts.push('обновлено: ' + updated);
    Diary.toast('Из копии ' + parts.join(', '));
  }

  function importFrom(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data = null;
      try { data = JSON.parse(reader.result); } catch (e) { data = null; }
      applyImport(data);
    };
    reader.onerror = function () { Diary.toast('Не удалось прочитать файл'); };
    reader.readAsText(file);
  }

  function setup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      input.value = ''; // иначе повторный выбор того же файла не вызовет change
      if (file) importFrom(file);
    });

    // Футер перерисовывается на каждое изменение данных, поэтому слушаем
    // клики на документе, а не вешаем обработчики на сами кнопки.
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-backup]');
      if (!btn) return;
      if (btn.getAttribute('data-backup') === 'export') exportAll();
      else input.click();
    });
  }

  Diary.backup = { setup: setup };
})(window.Diary);
