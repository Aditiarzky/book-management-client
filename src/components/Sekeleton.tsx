import type { PropsWithChildren } from 'react';

interface SkeletonBaseProps {
  width?: string;
  height?: string;
  className?: string;
  borderRadius?: string;
  count?: number;
}

type SkeletonProps = PropsWithChildren<SkeletonBaseProps>;

const Sekeleton = ({
  width = '100%',
  height = '1rem',
  className = '',
  borderRadius = '0.5rem',
  count = 1,
  children,
}: SkeletonProps) => {
  const style = {
    width,
    height,
    borderRadius,
  };

  if (children) {
    return (
      <div className={`skeleton ${className}`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={style}
        ></div>
      ))}
    </>
  );
};

export default Sekeleton;
