import 'core-js/stable';
import 'regenerator-runtime/runtime';

window.sayHello = async () => {
  const res = await fetch('/hello');
  const text = await res.text();
  return text;
};
