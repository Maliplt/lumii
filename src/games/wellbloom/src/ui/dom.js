// finds the element marked data-slot="name" inside root
export function slot(root, name) {
  return root.querySelector(`[data-slot="${name}"]`);
}

// small element factory
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else if (key in element && key !== 'role') element[key] = value;
    else element.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

// restarts a one-shot CSS animation class
export function replay(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

export function starRow(lit, total = 3) {
  const row = h('span', { className: 'stars', 'aria-hidden': 'true' });
  for (let i = 0; i < total; i++) row.append(h('span', { className: i < lit ? 'star is-lit' : 'star' }));
  return row;
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function vibrate(pattern) {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // some browsers throw when vibration is blocked; it is only a nicety
  }
}
