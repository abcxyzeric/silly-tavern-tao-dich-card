/**
 * Theme Service - manages UI theme customization.
 * Stores settings in localStorage and applies them via CSS custom properties.
 */

const STORAGE_KEY = 'tavern-ui-theme';

export interface ThemeSettings {/** Background overlay opacity (0-100) */
 bgOverlayOpacity: number;
 /** Primary accent color (hex) */
 primaryColor: string;
 /** Surface/card background opacity (0-100) */
 surfaceOpacity: number;
 /** Blur intensity (0-20px) */
 blurIntensity: number;
 /** Text color (hex) */
 textColor: string;
 /** Text shadow intensity (0-10) */
 textShadow: number;
 /** Text shadow color (hex) */
 textShadowColor: string;
 /** Card shadow intensity (0-20) */
 cardShadow: number;
 /** Input field background color (hex) */
 inputBgColor: string;
 /** Input field border color (hex) */
 inputBorderColor: string;}

export const DEFAULT_THEME: ThemeSettings = {bgOverlayOpacity: 23,
 primaryColor: '#10b981', // emerald-500
 surfaceOpacity: 27,
 blurIntensity: 3,
 textColor: '#f1f5f9', // slate-100
 textShadow: 0,
 textShadowColor: '#000000', // black
 cardShadow: 4,
 inputBgColor: '#0f172a', // slate-900
 inputBorderColor: '#475569', // slate-600
};

/**
 * Predefined accent color presets
 */
export const COLOR_PRESETS = [{name: "màu chàm", value: '#6366f1'},
 {name: "màu tím", value: '#8b5cf6'},
 {name: "hoa hồng đỏ", value: '#ec4899'},
 {name: "xanh tươi", value: '#10b981'},
 {name: "hổ phách", value: '#f59e0b'},
 {name: "trời xanh", value: '#06b6d4'},
 {name: "san hô", value: '#f97316'},
 {name: "đá phiến", value: '#64748b'},];

/**
 * Text color presets — designed to be visually distinct on dark backgrounds
 */
export const TEXT_COLOR_PRESETS = [{name: "màu trắng bạc", value: '#e2e8f0'},
 {name: "màu trắng tinh khiết", value: '#ffffff'},
 {name: "vàng ấm áp", value: '#fde68a'},
 {name: "trời xanh", value: '#7dd3fc'},
 {name: "màu tím", value: '#c4b5fd'},
 {name: "bạc hà", value: '#6ee7b7'},
 {name: "hồng san hô", value: '#fda4af'},
 {name: "hổ phách", value: '#fcd34d'},];

/**
 * Text shadow color presets
 */
export const TEXT_SHADOW_COLOR_PRESETS = [{name: "đen", value: '#000000'},
 {name: "màu xám đen", value: '#1e293b'},
 {name: "màu chàm", value: '#312e81'},
 {name: "màu tím", value: '#4c1d95'},
 {name: "màu đỏ đậm", value: '#7f1d1d'},
 {name: "màu xanh đậm", value: '#14532d'},];

/**
 * Input background color presets - diverse color options
 */
export const INPUT_BG_PRESETS = [{name: "màu đen sâu", value: '#0f172a'},
 {name: "màu xám đen", value: '#1e293b'},
 {name: "đá phiến", value: '#475569'},
 {name: "màu trắng tinh khiết", value: '#ffffff'},
 {name: "Trắng nhạt", value: '#fef3c7'},
 {name: "trời xanh", value: '#dbeafe'},
 {name: "màu xanh da trời", value: '#cffafe'},
 {name: "bạc hà", value: '#d1fae5'},
 {name: "trong suốt", value: 'transparent'},];

/**
 * Input border color presets
 */
export const INPUT_BORDER_PRESETS = [{name: "theo dõi chủ đề", value: 'auto'},
 {name: "đá phiến xám", value: '#475569'},
 {name: "màu xám đen", value: '#334155'},
 {name: "màu chàm", value: '#6366f1'},
 {name: "màu tím", value: '#8b5cf6'},
 {name: "xanh tươi", value: '#10b981'},
 {name: "trời xanh", value: '#0ea5e9'},
 {name: "hổ phách", value: '#f59e0b'},];

/**
 * Get current theme settings from localStorage.
 */
export function getThemeSettings(): ThemeSettings {try {const stored = localStorage.getItem(STORAGE_KEY);
 if (stored) {return {...DEFAULT_THEME,...JSON.parse(stored)};}} catch {
  // ignore parse errors
}
 return {...DEFAULT_THEME};}

/**
 * Save theme settings to localStorage and apply them.
 */
export function saveThemeSettings(settings: Partial<ThemeSettings>): ThemeSettings {const current = getThemeSettings();
 const updated = {...current,...settings};
 localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
 applyTheme(updated);
 return updated;}

/**
 * Reset theme to defaults.
 */
export function resetTheme(): ThemeSettings {localStorage.removeItem(STORAGE_KEY);
 applyTheme(DEFAULT_THEME);
 return {...DEFAULT_THEME};}

/**
 * Convert hex color to rgba with alpha.
 */
function hexToRgba(hex: string, alpha: number): string {const r = parseInt(hex.slice(1, 3), 16);
 const g = parseInt(hex.slice(3, 5), 16);
 const b = parseInt(hex.slice(5, 7), 16);
 return `rgba(${r}, ${g}, ${b}, ${alpha})`;}

/**
 * Apply theme settings to the document.
 */
export function applyTheme(settings: ThemeSettings): void {const root = document.documentElement;

 // Apply primary color
 root.style.setProperty('--color-primary', settings.primaryColor);

 // Apply surface opacity
 const surfaceOpacity = settings.surfaceOpacity / 100;
 root.style.setProperty('--surface-opacity', surfaceOpacity.toString());

 // Apply blur intensity
 root.style.setProperty('--blur-intensity', `${settings.blurIntensity} px`);

 // Apply background overlay opacity
 const overlayOpacity = settings.bgOverlayOpacity / 100;
 root.style.setProperty('--bg-overlay-opacity', overlayOpacity.toString());

 // Apply text color
 root.style.setProperty('--color-text', settings.textColor);
 root.style.setProperty('--text-color', settings.textColor);

 // Apply text shadow
 if (settings.textShadow > 0) {root.style.setProperty('--text-shadow', `0 1px ${settings.textShadow} px ${settings.textShadowColor}`);} else {root.style.setProperty('--text-shadow', 'none');}

 // Apply card shadow
 if (settings.cardShadow > 0) {const shadowColor = hexToRgba(settings.primaryColor, 0.15);
 root.style.setProperty('--card-shadow', `0 4px ${settings.cardShadow * 2} px rgba(0,0,0,0.3), 0 0 ${settings.cardShadow} px ${shadowColor}`);} else {root.style.setProperty('--card-shadow', 'none');}

 // Apply input background color
 root.style.setProperty('--input-bg', settings.inputBgColor);

 // Apply input border color (auto = use primary color)
 if (settings.inputBorderColor === 'auto') {root.style.setProperty('--input-border', settings.primaryColor);} else {root.style.setProperty('--input-border', settings.inputBorderColor);}}

/**
 * Initialize theme on app load.
 */
export function initTheme(): void {const settings = getThemeSettings();
 applyTheme(settings);}
