export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status : 500;
  if (status >= 500) console.error('Request failed:', err.name);

  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : 'Invalid request',
  });
}
