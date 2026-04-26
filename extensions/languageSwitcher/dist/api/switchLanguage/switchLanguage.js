export default async function switchLanguage(request, response) {
    const { language } = request.body;
    const supportedLanguages = ['en', 'fr'];
    if (!language || !supportedLanguages.includes(language)) {
        response.status(400).json({
            success: false,
            message: 'Invalid language. Supported: en, fr'
        });
        return;
    }
    // Set language cookie - 1 year expiry
    response.cookie('evershop_language', language, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax',
        path: '/'
    });
    response.json({
        success: true,
        language
    });
}
//# sourceMappingURL=switchLanguage.js.map