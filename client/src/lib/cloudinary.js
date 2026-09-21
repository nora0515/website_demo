const SCRIPT_SRC = 'https://upload-widget.cloudinary.com/global/all.js'

export const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
export const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
export const isConfigured = Boolean(cloudName && uploadPreset)

let pending

// Loads the widget script once and reuses it for every later call.
export function loadCloudinary() {
  if (window.cloudinary) return Promise.resolve(window.cloudinary)
  pending ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.cloudinary)
    script.onerror = () => {
      // Let a later attempt retry instead of caching the failure forever.
      pending = undefined
      reject(new Error('Cloudinary widget failed to load.'))
    }
    document.head.appendChild(script)
  })
  return pending
}
