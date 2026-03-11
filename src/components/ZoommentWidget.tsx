import { useEffect } from 'react'

const ZOOMMENT_SCRIPT_ID = 'zoomment-widget-script'

const ZoommentWidget = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (document.getElementById(ZOOMMENT_SCRIPT_ID)) {
      return
    }

    const script = document.createElement('script')
    script.id = ZOOMMENT_SCRIPT_ID
    script.src = 'https://cdn.zoomment.com/zoomment.min.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  return (
    <div
      id="zoomment"
      data-theme="light"
      data-language="en"
      data-gravatar="monsterid"
      data-emotions="❤️,😀,🪄,🥸,💡,🤔,💩,😢"
      data-visitors="true"
      className="w-full min-h-[300px]"
    />
  )
}

export default ZoommentWidget
