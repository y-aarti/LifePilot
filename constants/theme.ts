export const colors = { ink: '#16325C', muted: '#7D91AE', paper: '#F3F8FF', white: '#FFFFFF', line: '#DCE8F8', navy: '#0753C7', blue: '#086BFA', magenta: '#D817D6', paleBlue: '#E8F2FF' };
export const areas = ['Health', 'Wealth', 'Career', 'Personal', 'Events'] as const;
export type AreaName = typeof areas[number];
