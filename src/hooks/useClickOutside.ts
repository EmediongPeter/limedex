import { useEffect, RefObject } from 'react';

/**
 * A hook that handles clicks outside of the referenced element
 * @param ref - Reference to the element to detect clicks outside of
 * @param handler - Function to call when a click outside is detected
 */
function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // Add event listeners for both mouse and touch events for mobile support
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Only re-run if ref or handler changes
}

export default useClickOutside;
