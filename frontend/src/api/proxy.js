// Simple proxy function to bypass CORS
export const proxyRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
  return response;
};
