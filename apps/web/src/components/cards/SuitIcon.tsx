import { Suit, SUIT_COLORS } from '@bhabhi/shared';

interface SuitIconProps {
  suit: Suit;
  className?: string;
  size?: number;
}

export function SuitIcon({ suit, className = '', size = 16 }: SuitIconProps) {
  const isRed = SUIT_COLORS[suit] === 'red';
  const fill = isRed ? '#C5221F' : '#1A1C23';

  switch (suit) {
    case 'spades':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={fill}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C12 2 5 10 5 15C5 18.5 7.5 21 11 20.5C10.5 22 9 23 7 23H17C15 23 13.5 22 13 20.5C16.5 21 19 18.5 19 15C19 10 12 2 12 2Z" />
        </svg>
      );
    case 'hearts':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={fill}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={fill}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L3 12L12 22L21 12L12 2Z" />
        </svg>
      );
    case 'clubs':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={fill}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 3C10.07 3 8.5 4.57 8.5 6.5C8.5 7.42 8.86 8.26 9.46 8.88C7.54 9.17 6 10.82 6 12.82C6 15.03 7.79 16.82 10 16.82C10.74 16.82 11.43 16.61 12 16.27C12.57 16.61 13.26 16.82 14 16.82C16.21 16.82 18 15.03 18 12.82C18 10.82 16.46 9.17 14.54 8.88C15.14 8.26 15.5 7.42 15.5 6.5C15.5 4.57 13.93 3 12 3ZM10.5 19H13.5C13.5 19 13.2 21 15 22H9C10.8 21 10.5 19 10.5 19Z" />
        </svg>
      );
  }
}
