
exports.createContext = (config) => {
  const values = new Map();
  return {
    getConfig: () => config,
    setValue: (key, value) => values.set(key, value),
    getValue: (key) => values.get(key),
    hasValue: (key) => values.has(key),
  };
};
