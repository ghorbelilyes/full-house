import React, { useEffect } from 'react';
export default function LanguageSwitcher({ switchLanguageApi, currentLanguage, translations: translationsJson, supportedLanguages }) {
    // Parse and set global translations for _() function
    useEffect(()=>{
        if (currentLanguage !== 'en' && translationsJson) {
            try {
                const parsed = JSON.parse(translationsJson);
                window.__translations__ = parsed;
                window.__currentLanguage__ = currentLanguage;
            } catch (e) {
            // Ignore parse errors
            }
        } else {
            window.__translations__ = undefined;
            window.__currentLanguage__ = 'en';
        }
    }, [
        currentLanguage,
        translationsJson
    ]);
    const handleSwitch = async (lang)=>{
        if (lang === currentLanguage) return;
        try {
            const response = await fetch(switchLanguageApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    language: lang
                })
            });
            const data = await response.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to switch language:', err);
        }
    };
    return /*#__PURE__*/ React.createElement("div", {
        className: "language-switcher flex items-center gap-1"
    }, supportedLanguages.map((lang, index)=>/*#__PURE__*/ React.createElement(React.Fragment, {
            key: lang.code
        }, index > 0 && /*#__PURE__*/ React.createElement("span", {
            className: "text-muted-foreground text-xs select-none"
        }, "/"), /*#__PURE__*/ React.createElement("button", {
            type: "button",
            onClick: ()=>handleSwitch(lang.code),
            className: `text-xs font-medium px-1 py-0.5 rounded transition-colors cursor-pointer ${lang.code === currentLanguage ? 'text-primary font-bold underline underline-offset-2' : 'text-muted-foreground hover:text-foreground'}`,
            "aria-label": `Switch to ${lang.label}`,
            "aria-current": lang.code === currentLanguage ? 'true' : undefined
        }, lang.label))));
}
export const layout = {
    areaId: 'headerMiddleRight',
    sortOrder: 5
};
export const query = `
  query Query {
    switchLanguageApi: url(routeId: "switchLanguage")
    currentLanguage
    translations
    supportedLanguages {
      code
      label
    }
  }
`;
