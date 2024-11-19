import { mergeIntoObservable } from '@legendapp/state'
import { useEffect } from 'react'

import { store$ } from './config'

const isMobile =
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

/**
 * @param {*} props
 */
export default function InitializeFloatingReact(props) {
  const { options } = props

  useEffect(() => {
    mergeIntoObservable(store$, {
      ...options,
      themes: {
        twoslash: {
          $extend: 'dropdown',
          triggers: isMobile ? ['touch'] : ['hover', 'touch'],
          popperTriggers: isMobile ? ['touch'] : ['hover', 'touch'],
          placement: 'bottom-start',
          overflowPadding: 10,
          delay: 0,
          handleResize: false,
          autoHide: true,
          instantMove: true,
          flip: false,
          arrowPadding: 8,
          autoBoundaryMaxSize: true,
        },
        'twoslash-query': {
          $extend: 'twoslash',
          triggers: ['click'],
          popperTriggers: ['click'],
          autoHide: false,
        },
        'twoslash-completion': {
          $extend: 'twoslash-query',
          triggers: ['click'],
          popperTriggers: ['click'],
          autoHide: false,
          distance: 0,
          arrowOverflow: true,
        },
        ...options?.theme,
      },
    })
  }, [options])
}
