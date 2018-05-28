export function normalizePreferences({login, password}) {
    return {
        login: login.trim(),
        password,
    };
}
