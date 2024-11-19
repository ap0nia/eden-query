// @ts-check

import {
  arrow,
  FloatingPortal,
  offset,
  size,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react'
import { useClick } from '@floating-ui/react'
import { useTransitionStyles } from '@floating-ui/react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { getDefaultConfig, getThemeClasses, store$ } from './config'

/**
 * @param {*} props
 */
export function Menu(props) {
  const config = store$.get()

  const { theme, shown, children } = props

  const [trigger, content] = children

  const [open, onOpenChange] = useState(Boolean(shown))

  const arrowRef = useRef(null)

  const [maxHeight, setMaxHeight] = useState(undefined)

  const [maxWidth, setMaxWidth] = useState(undefined)

  const themeClass = getThemeClasses(theme, config)

  const triggers = getDefaultConfig(theme, 'triggers', config) ?? []

  const { refs, floatingStyles, context, middlewareData, placement } = useFloating({
    open,
    onOpenChange,
    placement: 'bottom-start',
    middleware: [
      offset({
        mainAxis: 5,
        crossAxis: 0,
      }),
      arrow({ element: arrowRef }),
      size({
        padding: 10,
        apply({ availableWidth, availableHeight }) {
          flushSync(() => {
            setMaxHeight(availableHeight)
            setMaxWidth(availableWidth)
          })
        },
      }),
    ],
  })

  // Hot fix...
  useEffect(() => {
    const nodes = refs.floating.current?.querySelectorAll('.v-popper__inner > ul')

    nodes?.forEach((node) => {
      node.classList.add('twoslash-completion-list')
      node.classList.remove('my-4')
    })
  }, [refs.floating.current])

  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 200,
    initial: {
      opacity: 0,
    },
  })

  const hover = useHover(context, {
    delay: 100,
    enabled: triggers.includes('hover'),
  })

  const click = useClick(context, {
    enabled: triggers.includes('click') || triggers.includes('touch'),
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click])

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className={props.className}>
        {trigger}
      </span>

      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 1,
            }}
            data-popper-placement={placement.split(' ')[0]}
            className={`${themeClass.join(' ')} v-popper__popper ${props['popper-class']} ${
              isMounted ? 'v-popper__popper--shown' : 'v-popper__popper--hidden'
            }`}
            {...getFloatingProps()}
          >
            <div
              className="v-popper__wrapper"
              style={{
                ...styles,
              }}
            >
              <div className="v-popper__inner" style={{ maxWidth, maxHeight, overflowY: 'auto' }}>
                {content}
              </div>
              <div
                ref={arrowRef}
                style={{
                  position: 'absolute',
                  left: middlewareData.arrow?.x,
                  top: middlewareData.arrow?.y,
                }}
                className="v-popper__arrow-container"
              >
                <div className="v-popper__arrow-outer"></div>
                <div className="v-popper__arrow-inner"></div>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
