import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import DateRangeFilter from '../components/timeline/DateRangeFilter';
import EventTypeFilter from '../components/timeline/EventTypeFilter';
import ExportButton from '../components/timeline/ExportButton';
import SearchBar from '../components/timeline/SearchBar';
import TimelineEvent from '../components/timeline/TimelineEvent';
import api from '../lib/api';

interface TimelineEvent {
    id: string;
    type: 'presence' | 'message' | 'typing' | 'role' | 'join' | 'deleted_message';
    userId: string;
    username: string;
    timestamp: string;
    metadata: Record<string, unknown>;
    isAnomalous?: boolean;
    anomalyReason?: string;
}

interface TimelineResponse {
    events: TimelineEvent[];
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
}

const EVENT_TYPE_OPTIONS = [
    { value: 'presence', label: 'Presence', color: 'bg-purple-500' },
    { value: 'message', label: 'Messages', color: 'bg-blue-500' },
    { value: 'typing', label: 'Typing', color: 'bg-yellow-500' },
    { value: 'role', label: 'Roles', color: 'bg-green-500' },
    { value: 'join', label: 'Joins', color: 'bg-pink-500' },
    { value: 'deleted_message', label: 'Deleted', color: 'bg-red-500' },
];

function UserTimeline() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [username, setUsername] = useState<string>('');

    // Filters
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
        'presence',
        'message',
        'typing',
        'role',
        'join',
        'deleted_message',
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Infinite scroll
    const observerTarget = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(
        async (cursor?: string | null, resetEvents = false) => {
            if (!userId) return;

            try {
                if (resetEvents) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const params: Record<string, string> = {
                    eventTypes: selectedEventTypes.join(','),
                };

                if (cursor) {
                    params.cursor = cursor;
                }

                if (searchQuery) {
                    params.search = searchQuery;
                }

                if (startDate) {
                    const startDateObj = new Date(startDate);
                    if (!isNaN(startDateObj.getTime())) {
                        params.startDate = startDateObj.toISOString();
                    }
                }

                if (endDate) {
                    const endDateObj = new Date(endDate);
                    if (!isNaN(endDateObj.getTime())) {
                        params.endDate = endDateObj.toISOString();
                    }
                }

                const response = await api.get<TimelineResponse>(
                    `/timeline/${userId}`,
                    { params }
                );

                const newEvents = response.data.events;

                if (resetEvents) {
                    setEvents(newEvents);
                } else {
                    setEvents((prev) => [...prev, ...newEvents]);
                }

                setNextCursor(response.data.nextCursor);
                setHasMore(response.data.hasMore);
                setTotalCount(response.data.totalCount);

                // Set username from first event
                if (newEvents.length > 0 && !username) {
                    setUsername(newEvents[0].username);
                }
            } catch (error) {
                console.error('Error fetching timeline:', error);
                toast.error('Failed to fetch timeline');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [userId, selectedEventTypes, searchQuery, startDate, endDate, username]
    );

    // Initial fetch
    useEffect(() => {
        fetchTimeline(null, true);
    }, [selectedEventTypes, fetchTimeline]); // Re-fetch when filters change

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    fetchTimeline(nextCursor, false);
                }
            },
            { threshold: 0.5 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loadingMore, nextCursor, fetchTimeline]);

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading timeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </button>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Activity Timeline
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {username || userId}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total Events</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalCount.toLocaleString()}
                                </p>
                            </div>
                            <ExportButton
                                events={events}
                                username={username || userId || 'user'}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                {/* Search Bar */}
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by username, channel, or message content..."
                />

                {/* Event Type Filter */}
                <EventTypeFilter
                    options={EVENT_TYPE_OPTIONS}
                    selected={selectedEventTypes}
                    onChange={setSelectedEventTypes}
                />

                {/* Date Range Filter */}
                <DateRangeFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClear={() => {
                        setStartDate('');
                        setEndDate('');
                    }}
                />
            </div>

            {/* Timeline */}
            <div className="max-w-4xl mx-auto px-4">
                {events.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No events found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {events.map((event) => (
                            <TimelineEvent key={event.id} event={event} />
                        ))}
                    </div>
                )}

                {/* Loading more indicator */}
                {loadingMore && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                )}

                {/* Infinite scroll trigger */}
                {hasMore && <div ref={observerTarget} className="h-10" />}

                {/* End of timeline */}
                {!hasMore && events.length > 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">
                            End of timeline
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserTimeline;
