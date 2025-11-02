import { motion } from 'framer-motion';
import { LogIn, Shield, Activity, TrendingUp } from 'lucide-react';

import { ThemeToggle } from '../components/ui/ThemeToggle';
import { config } from '../config/env';

function Login() {
    const REDIRECT_URI = encodeURIComponent(
        `${window.location.origin}/auth/callback`
    );

    const discordLoginUrl = `https://discord.com/oauth2/authorize?client_id=${config.discordClientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify+guilds`;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-ctp-base via-ctp-mantle to-ctp-crust relative">
            {/* Theme Toggle in top-right corner */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full mx-4"
                role="main"
                aria-labelledby="login-heading"
            >
                <div className="bg-ctp-surface0 rounded-2xl shadow-2xl p-8 border border-ctp-surface1">
                    {/* Logo/Header */}
                    <header className="text-center mb-8">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-ctp-blue/20 rounded-full mb-4"
                            aria-hidden="true"
                        >
                            <Shield className="w-8 h-8 text-ctp-blue" />
                        </motion.div>
                        <motion.h1
                            id="login-heading"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-bold text-ctp-text mb-2"
                        >
                            Discord Spywatcher
                        </motion.h1>
                        <motion.p
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-ctp-subtext0"
                        >
                            Advanced user behavior analytics
                        </motion.p>
                    </header>

                    {/* Features */}
                    <motion.ul
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3 mb-8"
                        aria-label="Features"
                    >
                        <li className="flex items-center gap-3 text-ctp-subtext1">
                            <Activity className="w-5 h-5 text-ctp-green" aria-hidden="true" />
                            <span className="text-sm">Real-time monitoring</span>
                        </li>
                        <li className="flex items-center gap-3 text-ctp-subtext1">
                            <Shield className="w-5 h-5 text-ctp-blue" aria-hidden="true" />
                            <span className="text-sm">Ghost detection</span>
                        </li>
                        <li className="flex items-center gap-3 text-ctp-subtext1">
                            <TrendingUp className="w-5 h-5 text-ctp-pink" aria-hidden="true" />
                            <span className="text-sm">Advanced analytics</span>
                        </li>
                    </motion.ul>

                    {/* Login Button */}
                    <motion.a
                        href={discordLoginUrl}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 w-full bg-ctp-blue hover:bg-ctp-blue/90 text-ctp-base px-6 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-ctp-blue focus:ring-offset-2"
                        aria-label="Login with Discord"
                    >
                        <LogIn className="w-5 h-5" aria-hidden="true" />
                        Login with Discord
                    </motion.a>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-xs text-ctp-overlay0 mt-6"
                    >
                        By logging in, you agree to our terms of service
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;
