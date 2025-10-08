const ReactGlobal = window.React;

export const React = ReactGlobal;
export const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef
} = ReactGlobal;

export const Fragment = ReactGlobal.Fragment;
export const createElement = ReactGlobal.createElement;

export function h(type, props, ...children) {
  if (children.length === 1 && Array.isArray(children[0])) {
    return ReactGlobal.createElement(type, props, ...children[0]);
  }
  return ReactGlobal.createElement(type, props, ...children);
}
