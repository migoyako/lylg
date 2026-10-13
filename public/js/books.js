document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!window.confirm(form.dataset.confirm)) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll('[data-auto-dismiss]').forEach((notice) => {
  window.setTimeout(() => notice.classList.add('notice-hidden'), 3500);
});

document.querySelectorAll('form[data-book-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
    }
  });
});
