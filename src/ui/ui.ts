import 'core-js/stable';
import 'regenerator-runtime/runtime';

(window as any).sayHello = async () => {
  const res = await fetch('/hello');
  const text = await res.text();
  return text;
};

window.addEventListener('beforeunload', () => {
  const coverage = (window as any).__coverage__;
  navigator.sendBeacon('/coverage', JSON.stringify(coverage));
});
