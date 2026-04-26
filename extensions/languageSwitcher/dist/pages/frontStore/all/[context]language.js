import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function parseCsv(content) {
    const result = {};
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const commaIndex = trimmed.indexOf(',');
        if (commaIndex === -1)
            continue;
        const key = trimmed.substring(0, commaIndex).trim();
        const value = trimmed.substring(commaIndex + 1).trim();
        if (key && value) {
            result[key] = value;
        }
    }
    return result;
}
// Cache translations in memory
const translationCache = {};
function loadTranslations(lang) {
    if (lang === 'en')
        return {};
    if (translationCache[lang])
        return translationCache[lang];
    // Find project root
    const rootPath = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
    const translationsDir = path.join(rootPath, 'translations', lang);
    if (!fs.existsSync(translationsDir))
        return {};
    const translations = {};
    const files = fs.readdirSync(translationsDir);
    for (const file of files) {
        if (!file.endsWith('.csv'))
            continue;
        const content = fs.readFileSync(path.join(translationsDir, file), 'utf8');
        Object.assign(translations, parseCsv(content));
    }
    translationCache[lang] = translations;
    return translations;
}
export default async function languageContext(request, response, next) {
    const language = (request.cookies && request.cookies.evershop_language) || 'en';
    const supportedLanguages = ['en', 'fr'];
    const currentLanguage = supportedLanguages.includes(language)
        ? language
        : 'en';
    const translations = loadTranslations(currentLanguage);
    // Set context values for GraphQL resolvers
    request.locals = request.locals || {};
    request.locals.context = request.locals.context || {};
    request.locals.context.currentLanguage = currentLanguage;
    request.locals.context.translations = translations;
    next();
}
//# sourceMappingURL=%5Bcontext%5Dlanguage.js.map