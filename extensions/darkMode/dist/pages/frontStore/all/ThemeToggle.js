import React, { useState, useEffect, useCallback } from 'react';
function getSystemTheme() {
    if (typeof window === 'undefined')
        return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}
function applyTheme(theme) {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', resolved);
}
export default function ThemeToggle() {
    const [theme, setTheme] = useState('system');
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // Read stored preference
        const stored = localStorage.getItem('evershop_theme');
        const initial = stored || 'system';
        setTheme(initial);
        applyTheme(initial);
        setMounted(true);
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const current = localStorage.getItem('evershop_theme');
            if (!current || current === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    const cycleTheme = useCallback(() => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
        localStorage.setItem('evershop_theme', next);
        applyTheme(next);
    }, [theme]);
    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (React.createElement("button", { type: "button", className: "theme-toggle p-1 rounded transition-colors text-muted-foreground hover:text-foreground cursor-pointer", "aria-label": "Toggle theme", style: { width: 28, height: 28 } }));
    }
    return (React.createElement("button", { type: "button", onClick: cycleTheme, className: "theme-toggle p-1 rounded transition-colors text-muted-foreground hover:text-foreground cursor-pointer", "aria-label": `Current theme: ${theme}. Click to switch.`, title: `Theme: ${theme}` },
        theme === 'light' && (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
            React.createElement("path", { d: "M12 2v2" }),
            React.createElement("path", { d: "M12 20v2" }),
            React.createElement("path", { d: "m4.93 4.93 1.41 1.41" }),
            React.createElement("path", { d: "m17.66 17.66 1.41 1.41" }),
            React.createElement("path", { d: "M2 12h2" }),
            React.createElement("path", { d: "M20 12h2" }),
            React.createElement("path", { d: "m6.34 17.66-1.41 1.41" }),
            React.createElement("path", { d: "m19.07 4.93-1.41 1.41" }))),
        theme === 'dark' && (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }))),
        theme === 'system' && (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
            React.createElement("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
            React.createElement("line", { x1: "12", y1: "17", x2: "12", y2: "21" })))));
}
export const layout = {
    areaId: 'headerMiddleRight',
    sortOrder: 4
};
//# sourceMappingURL=ThemeToggle.js.map