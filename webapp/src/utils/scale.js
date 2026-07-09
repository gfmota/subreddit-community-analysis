export function createSizeScale(
  values,
  { minSize = 4, maxSize = 20, transform = Math.log1p } = {},
) {
  const transformed = values.map(transform);
  const min = Math.min(...transformed);
  const max = Math.max(...transformed);

  return (value) => {
    if (min === max) return (minSize + maxSize) / 2;

    const t = transform(value);

    return minSize + ((t - min) / (max - min)) * (maxSize - minSize);
  };
}
