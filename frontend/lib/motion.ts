export const lux = [0.22, 1, 0.36, 1] as const; // soft expo-out, used everywhere
export const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.5, ease: lux } };
export const slideIn = { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.6, ease: lux } };
