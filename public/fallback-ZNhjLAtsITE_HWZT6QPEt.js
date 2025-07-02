'use strict'

self.fallback = async request => {
  switch (request.destination) {
    case 'document':
      return caches.match('/_offline', { ignoreSearch: true })
    default:
      return Response.error()
  }
}
