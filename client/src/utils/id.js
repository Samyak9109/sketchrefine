export const createDrawableId = () =>
  crypto.randomUUID?.() ??
  `drawable-${Array.from(crypto.getRandomValues(new Uint32Array(4)))
    .map((value) => value.toString(16))
    .join("-")}`;
