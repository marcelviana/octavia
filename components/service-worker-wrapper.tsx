"use client"

import { useServiceWorker } from "@/hooks/use-service-worker"

export default function ServiceWorkerWrapper() {
  useServiceWorker()
  return null
}
