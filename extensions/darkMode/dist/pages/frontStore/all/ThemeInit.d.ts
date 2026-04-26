import React from 'react';
/**
 * Inline script to prevent flash of wrong theme on page load.
 * Must be placed in the <head> area and execute before body renders.
 */
export default function ThemeInit(): React.JSX.Element;
export declare const layout: {
    areaId: string;
    sortOrder: number;
};
