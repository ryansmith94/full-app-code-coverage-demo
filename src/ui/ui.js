import "core-js/shim"; // included < Stage 4 proposals
import "regenerator-runtime/runtime";

window.sayHello = async () => {
  const res = await fetch('/hello');
  const text = await res.text();
  return text;
};
