import { useState, useEffect, memo } from 'react';

/**
 * Format duration between start and end timestamps into standard Field Manual HH:MM:SS
 * @param {number|string} openedAt - Epoch timestamp in milliseconds
 * @param {number|string|null} [endedAt=null] - Epoch timestamp in milliseconds (if resolved/stopped)
 * @returns {string} Formatted duration string 'HH:MM:SS'
 */
function formatTimer(openedAt, endedAt = null) {
  const start = Number(openedAt);
  if (!start || isNaN(start)) return '00:00:00';
  const end = endedAt ? Number(endedAt) : Date.now();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  if (isNaN(diffSec)) return '00:00:00';

  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

/**
 * Custom shallow comparison for React.memo to prevent re-renders when parent
 * re-renders with identical primitive values or style definitions.
 */
function areTimerPropsEqual(prevProps, nextProps) {
  if (
    prevProps.openedAt !== nextProps.openedAt ||
    prevProps.endedAt !== nextProps.endedAt ||
    prevProps.className !== nextProps.className ||
    prevProps.as !== nextProps.as
  ) {
    return false;
  }

  if (prevProps.style === nextProps.style) {
    return true;
  }
  if (!prevProps.style || !nextProps.style) {
    return false;
  }

  const prevKeys = Object.keys(prevProps.style);
  const nextKeys = Object.keys(nextProps.style);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  return prevKeys.every((key) => prevProps.style[key] === nextProps.style[key]);
}

/**
 * IncidentTimer
 *
 * Isolated high-precision 1-second incident ticker for Field Manual dispatch boards.
 * Confines 1000ms re-render cycles to this leaf node so parent boards and card
 * lists avoid continuous re-rendering.
 *
 * @param {Object} props
 * @param {number|string} props.openedAt - Epoch timestamp when incident opened
 * @param {number|string|null} [props.endedAt=null] - Optional epoch timestamp when resolved
 * @param {string} [props.className=''] - Optional CSS class
 * @param {Object} [props.style] - Optional CSS style
 * @param {string|React.Component} [props.as='span'] - Element or component to render
 */
const IncidentTimer = memo(function IncidentTimer({
  openedAt,
  endedAt = null,
  className = '',
  style = undefined,
  as: Component = 'span',
}) {
  const isStatic = Boolean(endedAt);

  // Tick state triggers local re-renders once per second without affecting parent components
  const [, setTick] = useState(0);

  useEffect(() => {
    // If endedAt is set, incident is resolved: do not spin an interval
    if (isStatic) return;

    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [openedAt, isStatic]);

  const displayTime = isStatic
    ? formatTimer(openedAt, endedAt)
    : formatTimer(openedAt, null);

  return (
    <Component className={className} style={style}>
      {displayTime}
    </Component>
  );
}, areTimerPropsEqual);

export default IncidentTimer;
