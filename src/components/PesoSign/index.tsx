import React, { forwardRef } from 'react';

/**
 * PesoSign Icon Component
 *
 * Philippine Peso (₱) symbol icon that matches react-feather icon styling.
 * Used as a replacement for DollarSign in currency input fields.
 *
 * Follows Feather Icons design principles:
 * - 24x24 grid
 * - Stroke-based design
 * - Round line caps and joins
 * - Default stroke width of 2
 *
 * @param size - Icon size in pixels (default: 24)
 * @param color - Icon color (default: currentColor)
 * @param className - Additional CSS classes
 * @param rest - Any other props passed to the SVG element
 */
interface PesoSignProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const PesoSign = forwardRef<SVGSVGElement, PesoSignProps>(
  ({ size = 24, color = 'currentColor', ...rest }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 119.43 122.88"
        fill={color}
        {...rest}
      >
        {/* Authentic Philippine Peso symbol */}
        <path d="M118.45,51l1,1-.74,9.11H99A40.52,40.52,0,0,1,81.88,78.43q-11.44,6.28-27.71,7h-15l.5,37.43H21.42l.74-36.94-.24-24.87H1L0,59.84.74,51H21.92l-.25-15.26H1l-1-1,.74-9.11H21.67L21.42.25,63.29,0Q78.8,0,88.65,6.53T102,25.61h16.5l1,1.23-.74,8.87h-15v3.94A53.17,53.17,0,0,1,102.44,51ZM39.65,25.61H81.26Q74.85,14,58.61,13.3L39.89,14l-.24,11.57ZM39.4,51H83.23a39.51,39.51,0,0,0,1.23-9.6,46.17,46.17,0,0,0-.24-5.66H39.65L39.4,51ZM58.61,71.91q12.56-2.72,19.21-10.84H39.4l-.25,10.1,19.46.74Z"/>
      </svg>
    );
  }
);

PesoSign.displayName = 'PesoSign';

export default PesoSign;
