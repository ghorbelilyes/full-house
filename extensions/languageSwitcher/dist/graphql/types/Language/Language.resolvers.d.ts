declare const _default: {
    Query: {
        currentLanguage: (root: any, args: any, context: any) => any;
        translations: (root: any, args: any, context: any) => string;
        supportedLanguages: () => {
            code: string;
            label: string;
        }[];
    };
};
export default _default;
