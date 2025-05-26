function Login() {
    const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
    const REDIRECT_URI = encodeURIComponent(
        'http://localhost:5173/auth/callback'
    );

    const discordLoginUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify+guilds`;

    return (
        <div className='flex items-center justify-center h-screen'>
            <a
                href={discordLoginUrl}
                className='bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-semibold'
            >
                Login with Discord
            </a>
        </div>
    );
}

export default Login;
