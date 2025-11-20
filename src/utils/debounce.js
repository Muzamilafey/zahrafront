// zahrafront/src/utils/debounce.js
const debounce = (func, delay) => {
  let timeout;
  return function executed(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
};

export default debounce;
