const getDefaultSocketUrl = () => {
  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}:3001`;
};

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? getDefaultSocketUrl();
