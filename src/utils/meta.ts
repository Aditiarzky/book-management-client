// src/utils/meta.ts
interface MetaTags {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function setMetaTags({
  title,
  description,
  image,
  url,
}: MetaTags) {
  if (title) document.title = title

  updateMeta('name', 'description', description)
  updateMeta('property', 'og:title', title)
  updateMeta('property', 'og:description', description)
  updateMeta('property', 'og:image', image)
  updateMeta('property', 'og:url', url)
  updateMeta('name', 'twitter:title', title)
  updateMeta('name', 'twitter:description', description)
  updateMeta('name', 'twitter:image', image)
  updateMeta('name', 'twitter:url', url)
}

function updateMeta(type: 'name' | 'property', key: string, content?: string) {
  if (!content) return
  let element = document.querySelector(`meta[${type}="${key}"]`) as HTMLMetaElement
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(type, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}
