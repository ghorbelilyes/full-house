import React from 'react';
declare global {
    interface Window {
        __translations__?: Record<string, string>;
        __currentLanguage__?: string;
    }
}
interface LanguageSwitcherProps {
    switchLanguageApi: string;
    currentLanguage: string;
    translations: string;
    supportedLanguages: Array<{
        code: string;
        label: string;
    }>;
}
export default function LanguageSwitcher({ switchLanguageApi, currentLanguage, translations: translationsJson, supportedLanguages }: LanguageSwitcherProps): React.JSX.Element;
export declare const layout: {
    areaId: string;
    sortOrder: number;
};
export declare const query = "\n  query Query {\n    switchLanguageApi: url(routeId: \"switchLanguage\")\n    currentLanguage\n    translations\n    supportedLanguages {\n      code\n      label\n    }\n  }\n";
export {};
