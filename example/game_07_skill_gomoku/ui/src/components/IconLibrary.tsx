import React from 'react';

export interface IconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

// Game Stats Icons
export const HandIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z"/>
  </svg>
);

export const MoveIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M13 5L11 5V12H4V14H11V21H13V14H20V12H13V5Z"/>
  </svg>
);

export const StoneIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.25 5 13.17 5H10.83C9.75 5 8.76 5.06 7.83 5.17L10.5 2.5L9 1L3 7V9C3 10.66 4.34 12 6 12L9 12V22H15V12L18 12C19.66 12 21 10.66 21 9Z"/>
  </svg>
);

export const GraveIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M5 21Q4.175 21 3.588 20.413Q3 19.825 3 19V7Q3 6.175 3.588 5.588Q4.175 5 5 5H6V3Q6 2.175 6.588 1.588Q7.175 1 8 1H16Q16.825 1 17.413 1.588Q18 2.175 18 3V5H19Q19.825 5 20.413 5.588Q21 6.175 21 7V19Q21 19.825 20.413 20.413Q19.825 21 19 21H5ZM8 5H16V3H8V5ZM8 17H10V8H8V17ZM12 17H14V8H12V17ZM16 17H18V8H16V17Z"/>
  </svg>
);

export const SeaIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2ZM4 14L6 16L10 12L6 8L4 10L6 12L4 14ZM20 10L18 8L14 12L18 16L20 14L18 12L20 10ZM12 18L14 20L18 16L14 12L12 14L14 16L12 18ZM12 6L10 4L6 8L10 12L12 10L10 8L12 6Z"/>
  </svg>
);

// Status Effect Icons
export const FreezeIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M22 11H18.5L21.38 8.12L19.97 6.71L16.5 10.18V6.5H14.5V10.18L11.03 6.71L9.62 8.12L12.5 11H9V13H12.5L9.62 15.88L11.03 17.29L14.5 13.82V17.5H16.5V13.82L19.97 17.29L21.38 15.88L18.5 13H22V11ZM5.15 5.15C4.36 5.95 3.95 7.05 3.95 8.15S4.36 10.35 5.15 11.15C5.95 11.95 7.05 12.35 8.15 12.35S10.35 11.95 11.15 11.15C11.95 10.35 12.35 9.25 12.35 8.15S11.95 5.95 11.15 5.15C10.35 4.35 9.25 3.95 8.15 3.95S5.95 4.35 5.15 5.15Z"/>
  </svg>
);

export const SkipIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M4 18L8.5 12L4 6V18ZM13 6V18L17.5 12L13 6Z"/>
  </svg>
);

// Action Icons
export const CurrentTurnIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M8 5V19L19 12L8 5Z"/>
  </svg>
);

// Log Type Icons
export const StartIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
  </svg>
);

export const CardIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM11 17H13V16H14C14.55 16 15 15.55 15 15V12C15 11.45 14.55 11 14 11H11V9H15V7H13V6H11V7H10C9.45 7 9 7.45 9 8V10C9 10.55 9.45 11 10 11H13V13H9V15H11V17Z"/>
  </svg>
);

export const EffectIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M7 21Q6.175 21 5.588 20.413Q5 19.825 5 19V5Q5 4.175 5.588 3.588Q6.175 3 7 3H8.5V1H10.5V3H13.5V1H15.5V3H17Q17.825 3 18.413 3.588Q19 4.175 19 5V8H17V5H7V19H11V21H7ZM16.75 23L15.15 21.4L16.9 19.65L15.15 17.9L16.75 16.3L18.5 18.05L20.25 16.3L21.85 17.9L20.1 19.65L21.85 21.4L20.25 23L18.5 21.25L16.75 23Z"/>
  </svg>
);

export const CounterIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2L4 7V17L12 22L20 17V7L12 2ZM12 4.3L17.5 7.8L12 11.3L6.5 7.8L12 4.3ZM6 9.8L11 12.3V18.8L6 16.3V9.8ZM13 18.8V12.3L18 9.8V16.3L13 18.8Z"/>
  </svg>
);

export const DrawIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10V12H17V10H7ZM7 13V15H14V13H7Z"/>
  </svg>
);

export const SummonIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2ZM12 6.1L10.7 8.9L8 9.2L10.2 10.8L9.4 13.4L12 11.9L14.6 13.4L13.8 10.8L16 9.2L13.3 8.9L12 6.1Z"/>
  </svg>
);

export const WinIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19V21H5V19H19Z"/>
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ className = '', size = 'sm' }) => (
  <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${className}`} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
  </svg>
);

// Icon mapping for easy lookup
export const GAME_ICONS = {
  hand: HandIcon,
  move: MoveIcon,
  stones: StoneIcon,
  grave: GraveIcon,
  sea: SeaIcon,
  freeze: FreezeIcon,
  skip: SkipIcon,
  current: CurrentTurnIcon,
  play: PlayIcon,
  start: StartIcon,
  card: CardIcon,
  effect: EffectIcon,
  counter: CounterIcon,
  draw: DrawIcon,
  summon: SummonIcon,
  win: WinIcon,
  error: ErrorIcon
} as const;

export type IconName = keyof typeof GAME_ICONS;

export interface GameIconProps extends IconProps {
  name: IconName;
}

export const GameIcon: React.FC<GameIconProps> = ({ name, ...props }) => {
  const IconComponent = GAME_ICONS[name];
  return <IconComponent {...props} />;
};