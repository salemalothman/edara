/**
 * Centralized color palette for the application
 * These colors are used across charts, visualizations, and UI elements
 */

export const getThemeColors = (theme: string | undefined) => {
  const isDark = theme === "dark"

  return {
    // Primary colors
    primary: isDark ? "#60A5FA" : "#3B82F6", // Blue
    secondary: isDark ? "#FB7185" : "#F43F5E", // Red

    // Status colors
    success: isDark ? "#4ADE80" : "#22C55E", // Green
    warning: isDark ? "#FBBF24" : "#F59E0B", // Amber
    danger: isDark ? "#FB7185" : "#F43F5E", // Red
    info: isDark ? "#60A5FA" : "#3B82F6", // Blue

    // Neutral colors
    background: isDark ? "#1E293B" : "#FFFFFF",
    foreground: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#334155" : "#E2E8F0",
    mutedForeground: isDark ? "#94A3B8" : "#64748B",

    // Chart-specific colors
    chartColors: [
      isDark ? "#60A5FA" : "#3B82F6", // Blue
      isDark ? "#FB7185" : "#F43F5E", // Red
      isDark ? "#4ADE80" : "#22C55E", // Green
      isDark ? "#FBBF24" : "#F59E0B", // Amber
      isDark ? "#A78BFA" : "#8B5CF6", // Purple
      isDark ? "#38BDF8" : "#0EA5E9", // Light Blue
      isDark ? "#FB923C" : "#F97316", // Orange
      isDark ? "#94A3B8" : "#64748B", // Slate
    ],

    // UI element colors
    border: isDark ? "#334155" : "#E2E8F0",
    input: isDark ? "#334155" : "#E2E8F0",
    ring: isDark ? "#60A5FA" : "#3B82F6",
  }
}
