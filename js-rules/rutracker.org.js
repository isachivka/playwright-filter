const th = document.querySelector(
  'th[aria-controls="tor-tbl"][data-column="6"][role="columnheader"]',
);

if (!th) {
  console.warn('Не нашёл целевой <th>. Проверьте селектор.');
  return;
}

th.scrollIntoView({ block: 'center', inline: 'center' });

const rect = th.getBoundingClientRect();
const clientX = rect.left + rect.width / 2;
const clientY = rect.top + rect.height / 2;

const makeMouseEvent = type =>
  new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    button: 0,
    buttons: 1,
    clientX,
    clientY,
  });

th.dispatchEvent(makeMouseEvent('mousedown'));
th.dispatchEvent(makeMouseEvent('mouseup'));
th.dispatchEvent(makeMouseEvent('click'));
