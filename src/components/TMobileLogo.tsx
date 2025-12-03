'use client';

interface TMobileLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'fiber';
  color?: 'white' | 'magenta' | 'dark';
}

export function TMobileLogo({
  className = '',
  size = 'md',
  variant = 'full',
  color = 'magenta'
}: TMobileLogoProps) {
  const sizeConfig = {
    sm: { scale: 0.7 },
    md: { scale: 1 },
    lg: { scale: 1.3 },
    xl: { scale: 1.8 },
  };

  const scale = sizeConfig[size].scale;
  const fillColor = color === 'white' ? '#FFFFFF' : '#E20074';
  const textColor = color === 'dark' ? '#000000' : fillColor;

  if (variant === 'icon') {
    return (
      <span
        className={className}
        style={{
          color: fillColor,
          fontSize: 24 * scale,
          fontWeight: 900,
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}
      >
        T
      </span>
    );
  }

  if (variant === 'fiber') {
    return (
      <div className={`flex items-center ${className}`} style={{ gap: 8 * scale }}>
        {/* T */}
        <span style={{
          color: fillColor,
          fontSize: 28 * scale,
          fontWeight: 900,
          fontFamily: 'Arial Black, Arial, sans-serif',
          lineHeight: 1,
        }}>
          T
        </span>
        {/* Divider */}
        <div style={{
          width: 2 * scale,
          height: 24 * scale,
          backgroundColor: fillColor,
        }} />
        {/* FIBER */}
        <span style={{
          color: textColor,
          fontSize: 22 * scale,
          fontWeight: 900,
          fontFamily: 'Arial Black, Arial, sans-serif',
          letterSpacing: 1,
          lineHeight: 1,
        }}>
          FIBER
        </span>
        {/* WiFi Icon */}
        <svg
          width={24 * scale}
          height={24 * scale}
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginLeft: 2 * scale }}
        >
          <path
            d="M12 20.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
            fill={fillColor}
          />
          <path
            d="M8.5 16.5a5 5 0 017 0"
            stroke={fillColor}
            strokeWidth={2.5 * scale}
            strokeLinecap="round"
          />
          <path
            d="M5 13a9 9 0 0114 0"
            stroke={fillColor}
            strokeWidth={2.5 * scale}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Full T-Mobile variant
  return (
    <div className={`flex items-center ${className}`} style={{ gap: 6 * scale }}>
      <span style={{
        color: fillColor,
        fontSize: 28 * scale,
        fontWeight: 900,
        fontFamily: 'Arial Black, Arial, sans-serif',
        lineHeight: 1,
      }}>
        T
      </span>
      <span style={{
        color: textColor,
        fontSize: 22 * scale,
        fontWeight: 900,
        fontFamily: 'Arial Black, Arial, sans-serif',
        lineHeight: 1,
      }}>
        T-Mobile
      </span>
    </div>
  );
}

export function TIcon({
  className = '',
  size = 24,
  color = '#E20074'
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <span
      className={className}
      style={{
        color,
        fontSize: size,
        fontWeight: 900,
        fontFamily: 'Arial Black, Arial, sans-serif',
      }}
    >
      T
    </span>
  );
}
