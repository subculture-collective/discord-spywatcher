import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import api from '../../lib/api';
import type { SuspicionResult } from '../../types/suspicion';

function SuspicionDetail() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [suspicion, setSuspicion] = useState<SuspicionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setError('No user ID provided');
            setLoading(false);
            return;
        }

        setLoading(true);
        api.get(`/suspicion/${userId}`)
            .then((res) => {
                setSuspicion(res.data);
                setError(null);
            })
            .catch((err) => {
                console.error('Error fetching suspicion details:', err);
                setError('Failed to load suspicion details');
                toast.error('Failed to load suspicion details');
            })
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading suspicion analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !suspicion) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'No data available'}</p>
                    <button
                        onClick={() => navigate('/suspicion')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Back to Suspicion List
                    </button>
                </div>
            </div>
        );
    }

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high':
                return 'text-red-600 bg-red-100';
            case 'medium':
                return 'text-yellow-600 bg-yellow-100';
            case 'low':
                return 'text-green-600 bg-green-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getScoreColor = (score: number) => {
        if (score > 75) return 'text-red-600';
        if (score > 50) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getProgressBarColor = (value: number) => {
        if (value > 70) return 'bg-red-500';
        if (value > 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatFactorName = (key: string): string => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleBanUser = () => {
        if (!confirm(`Are you sure you want to ban ${suspicion.username}?`)) {
            return;
        }

        api.post('/userban', {
            userId: suspicion.userId,
            username: suspicion.username,
            reason: 'High suspicion score - automated detection',
        })
            .then(() => {
                toast.success(`Banned ${suspicion.username}`);
                navigate('/suspicion');
            })
            .catch((err) => {
                console.error('Error banning user:', err);
                toast.error('Failed to ban user');
            });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/suspicion')}
                            className="text-blue-600 hover:text-blue-800 mb-2"
                        >
                            ← Back to Suspicion List
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Suspicion Analysis
                        </h1>
                        <p className="text-gray-600 mt-1">{suspicion.username}</p>
                    </div>
                    <span
                        className={`px-4 py-2 rounded-full font-semibold uppercase text-sm ${getConfidenceColor(suspicion.confidence)}`}
                    >
                        {suspicion.confidence} Confidence
                    </span>
                </div>

                {/* Overall Score */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Overall Suspicion Score
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* Circular progress */}
                        <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(suspicion.totalScore / 100) * 351.86} 351.86`}
                                    className={getScoreColor(suspicion.totalScore)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-3xl font-bold ${getScoreColor(suspicion.totalScore)}`}>
                                    {suspicion.totalScore}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-3xl font-bold text-gray-900">
                                {suspicion.totalScore}/100
                            </p>
                            <p className="text-gray-600 mt-2">
                                {suspicion.recommendedAction}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contributing Factors */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Contributing Factors
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(suspicion.factors).map(([key, value]) => {
                            const displayValue = key === 'accountAge' ? value : Math.round(value as number);
                            const barValue = key === 'accountAge' 
                                ? Math.max(0, 100 - (value / 365) * 100)
                                : value as number;

                            return (
                                <div key={key} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">
                                            {formatFactorName(key)}
                                        </span>
                                        <span className="text-gray-600">
                                            {key === 'accountAge' 
                                                ? `${displayValue} days` 
                                                : displayValue}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${getProgressBarColor(barValue)}`}
                                            style={{ width: `${Math.min(100, barValue)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Reasons */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Suspicious Behaviors Detected
                    </h2>
                    <ul className="space-y-3">
                        {suspicion.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <svg
                                    className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <span className="text-gray-700">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Recommended Actions
                    </h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleBanUser}
                            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                            Ban User
                        </button>
                        <button
                            onClick={() => toast('Watch list feature coming soon!')}
                            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                        >
                            Add to Watch List
                        </button>
                        <button
                            onClick={() => toast('False positive reporting coming soon!')}
                            className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
                        >
                            Mark as False Positive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuspicionDetail;
