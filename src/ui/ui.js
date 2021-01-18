import "core-js/shim"; // included < Stage 4 proposals
import "regenerator-runtime/runtime";

window.sayHello = async () => {
  const res = await fetch('/hello');
  const text = await res.text();
  return text;
};

window.collectUiCoverage = () => {
  return window.__coverage__;
}

window.collectApiCoverage = async () => {
  const res = await fetch('/coverage');
  console.log(res.status);
  const coverage = await res.json();
  return coverage;
}
