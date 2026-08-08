import { useEffect } from 'react'

/**
 * Fades/slides elements with class "reveal" into view as they enter the
 * viewport. A MutationObserver keeps watching for ".reveal" elements added
 * or newly-classed after the initial render (e.g. service/doctor/offer
 * cards - or empty-state messages - that only exist once a loading state
 * resolves), so those get the same entrance treatment instead of appearing
 * instantly, or worse, never appearing at all.
 *
 * Important: this watches `attributes` (specifically `class`) as well as
 * `childList`. React frequently reuses an existing DOM node across a
 * re-render and only changes its className/children in place rather than
 * removing and re-inserting it - a childList-only observer misses that
 * node entirely, leaving it stuck at opacity: 0 forever.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('reveal-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll('.reveal:not(.reveal-visible)').forEach((el) => io.observe(el))
    }

    observeAll(document)

    // Defensive fallback: don't rely solely on IntersectionObserver callback
    // timing. On scroll/resize, directly check any not-yet-revealed elements'
    // bounding rects and reveal them if they're actually in view. This
    // guards against edge cases (fast programmatic scrolls, some headless/
    // automated browsers, rare real-world IO batching quirks) where an IO
    // callback might not fire even though the element is clearly visible -
    // better an occasional redundant check than content that never appears.
    let ticking = false
    const checkVisible = () => {
      ticking = false
      const vh = window.innerHeight || document.documentElement.clientHeight
      document.querySelectorAll('.reveal:not(.reveal-visible)').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < vh - 40 && rect.bottom > 0) {
          el.classList.add('reveal-visible')
          io.unobserve(el)
        }
      })
    }
    const onScrollOrResize = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(checkVisible)
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    checkVisible()

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const el = mutation.target as Element
          if (el.classList?.contains('reveal') && !el.classList.contains('reveal-visible')) {
            io.observe(el)
          }
          continue
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return
          const el = node as Element
          if (el.classList?.contains('reveal')) io.observe(el)
          observeAll(el)
        })
      }
      // New content may have appeared already in view (e.g. an empty-state
      // message swapped in while the user was already scrolled past it).
      onScrollOrResize()
    })
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [])
}
