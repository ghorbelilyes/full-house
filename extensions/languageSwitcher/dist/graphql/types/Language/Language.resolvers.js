export default {
    Query: {
        currentLanguage: (root, args, context)=>{
            return context.currentLanguage || 'en';
        },
        translations: (root, args, context)=>{
            const translations = context.translations || {};
            return JSON.stringify(translations);
        },
        supportedLanguages: ()=>{
            return [
                {
                    code: 'en',
                    label: 'EN'
                },
                {
                    code: 'fr',
                    label: 'FR'
                }
            ];
        }
    }
};
