const ReactDOMGlobal = window.ReactDOM;

export const ReactDOM = ReactDOMGlobal;

export function render(element, container) {
  if (ReactDOMGlobal.createRoot) {
    const root = ReactDOMGlobal.createRoot(container);
    root.render(element);
    return root;
  }
  ReactDOMGlobal.render(element, container);
  return null;
}
