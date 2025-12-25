'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, consultantsApi, availabilitiesApi } from '@/lib/api';
import { Booking, Consultant, Availability } from '@/lib/api';
import SetUnavailableModal from '@/components/SetUnavailableModal';
import Toast from '@/components/Toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfDay,
} from 'date-fns';
import { calculateEventPositions } from '@/utils/calendarLayout';
import Link from 'next/link';

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDateForUnavailable, setSelectedDateForUnavailable] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, currentDate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bookingsRes, consultantsRes] = await Promise.all([
        bookingsApi.get(),
        consultantsApi.get({ user_id: user.id }),
      ]);
      setBookings(bookingsRes.data);
      setConsultants(consultantsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load availabilities when consultants change
  useEffect(() => {
    const loadAvailabilities = async () => {
      if (consultants.length === 0) {
        setAvailabilities([]);
        return;
      }
      const allAvailabilities: Availability[] = [];
      
      for (const consultant of consultants) {
        try {
          const availResponse = await availabilitiesApi.get(consultant.id);
          if (availResponse.data?.availabilities) {
            allAvailabilities.push(...availResponse.data.availabilities);
          }
        } catch (error) {
          // No availability set for this consultant
        }
      }
      setAvailabilities(allAvailabilities);
    };
    loadAvailabilities();
  }, [consultants]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateJump = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
      setShowDatePicker(false);
    }
  };

  // Get all events (bookings + availabilities) for a day
  const getDayEvents = (day: Date) => {
    const dayBookings = bookings.filter((booking) =>
      isSameDay(parseISO(booking.start), day),
    );
    
    const dayName = format(day, 'EEEE').toLowerCase();
    const dayAvailabilities = availabilities.filter((avail) => {
      if (avail.day !== dayName) return false;
      
      const availStart = startOfDay(parseISO(avail.start));
      const availEnd = startOfDay(parseISO(avail.end));
      const dayStart = startOfDay(day);
      
      return dayStart >= availStart && dayStart <= availEnd;
    });
    
    return { bookings: dayBookings, availabilities: dayAvailabilities };
  };

  // Get display times for an availability
  const getAvailabilityDisplayTimes = (avail: Availability, day: Date) => {
    return {
      startTime: avail.start_time.substring(0, 5),
      endTime: avail.end_time.substring(0, 5),
    };
  };

  if (authLoading || loading) {
    return (
      <div className="container">
        <div className="loading">
          <span className="spinner"></span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Calendar View 📅</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>View your bookings and availability</p>
        </div>
        <Link 
          href="/home" 
          className="btn-outline btn-small"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="card-title">{format(currentDate, 'MMMM yyyy')}</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                ← Previous
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                Next →
              </button>
              <button 
                className="btn-outline btn-small"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                📍 Jump to Date
              </button>
            </div>
          </div>
          {showDatePicker && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
              <input
                type="date"
                onChange={handleDateJump}
                style={{ maxWidth: '200px' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div 
              key={day} 
              style={{ 
                fontWeight: 700, 
                textAlign: 'center', 
                padding: '1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {day}
            </div>
          ))}
          
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayKey = day.toISOString();
            const isHovered = hoveredDay === dayKey;
            
            return (
              <div
                key={dayKey}
                style={{
                  background: isToday 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : isCurrentMonth ? 'var(--bg-primary)' : 'var(--gray-50)',
                  border: `2px solid ${isToday ? 'var(--primary)' : isCurrentMonth ? 'var(--gray-200)' : 'var(--gray-200)'}`,
                  padding: '0.75rem',
                  minHeight: '300px',
                  borderRadius: 'var(--radius-lg)',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  transition: 'all var(--transition-base)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (isCurrentMonth && !isToday) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                  if (isCurrentMonth && consultants.length > 0) {
                    setHoveredDay(dayKey);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isCurrentMonth && !isToday) {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                  setHoveredDay(null);
                }}
              >
                {isHovered && isCurrentMonth && consultants.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDateForUnavailable(day);
                    }}
                    className="btn-secondary btn-small"
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      zIndex: 10,
                      fontSize: '0.7rem',
                      padding: '0.3rem 0.6rem',
                    }}
                  >
                    Set as unavailable
                  </button>
                )}
                <div style={{ 
                  fontWeight: isToday ? 700 : 600, 
                  marginBottom: '0.5rem',
                  color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                  fontSize: '1.125rem'
                }}>
                  {format(day, 'd')}
                </div>
                <div style={{ position: 'relative', marginTop: '0.25rem', minHeight: '60px' }}>
                  {(() => {
                    const { bookings: dayBookings, availabilities: dayAvailabilities } = getDayEvents(day);
                    const { positions: eventPositions, timeRange } = calculateEventPositions(dayBookings, dayAvailabilities, day);
                    
                    // Calculate container height based on time range
                    // Use a scale: 1 hour = 40px, minimum 60px
                    const containerHeight = timeRange 
                      ? Math.max(60, (timeRange.totalMinutes / 60) * 40)
                      : 60;
                    
                    return (
                      <div style={{ height: `${containerHeight}px`, position: 'relative' }}>
                        {dayAvailabilities.map((avail) => {
                          const consultant = consultants.find(c => c.id === avail.consultant_id);
                          const displayTimes = getAvailabilityDisplayTimes(avail, day);
                          // Generate event ID using the display times to match what calendarLayout creates
                          const eventId = avail.id || `avail-${format(day, 'yyyy-MM-dd')}-${displayTimes.startTime}`;
                          const position = eventPositions.get(eventId);
                          if (!position || !displayTimes.startTime) return null;
                          
                          return (
                            <div
                              key={eventId}
                              style={{
                                position: 'absolute',
                                top: `${position.top}%`,
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                height: `${position.height}%`,
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
                                border: '1px dashed rgba(99, 102, 241, 0.5)',
                                padding: '0.2rem 0.3rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.6rem',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                marginLeft: '0.1rem',
                                marginRight: '0.1rem',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                {displayTimes.startTime} - {displayTimes.endTime}
                              </div>
                              <div style={{ 
                                fontSize: '0.55rem',
                                color: 'var(--text-secondary)',
                                marginTop: '0.1rem',
                                textTransform: 'capitalize',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {consultant?.skill?.replace(/_/g, ' ') || 'Available'}
                              </div>
                            </div>
                          );
                        })}
                        {dayBookings.map((booking) => {
                          const position = eventPositions.get(booking.id);
                          if (!position) return null;
                          
                          return (
                            <div
                              key={booking.id}
                              style={{
                                position: 'absolute',
                                top: `${position.top}%`,
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                height: `${position.height}%`,
                                background: booking.status === 'confirmed' 
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)'
                                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
                                border: `1px solid ${booking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                                padding: '0.2rem 0.3rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.6rem',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                marginLeft: '0.1rem',
                                marginRight: '0.1rem',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(booking);
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                {format(parseISO(booking.start), 'HH:mm')}
                              </div>
                              <div style={{ 
                                fontSize: '0.55rem',
                                color: 'var(--text-secondary)',
                                marginTop: '0.1rem',
                                textTransform: 'capitalize',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {booking.consultant?.skill?.replace(/_/g, ' ') || 'Booking'}
                              </div>
                              <span className={booking.status === 'confirmed' ? 'badge badge-success' : 'badge badge-warning'} style={{ 
                                marginTop: '0.1rem', 
                                display: 'inline-block',
                                fontSize: '0.5rem',
                                padding: '0.1rem 0.2rem'
                              }}>
                                {booking.status}
                              </span>
                            </div>
                          );
                        })}
                        {dayBookings.length === 0 && dayAvailabilities.length === 0 && isCurrentMonth && (
                          <div style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '0.65rem', 
                            color: 'var(--text-tertiary)',
                            fontStyle: 'italic',
                            textAlign: 'center',
                          }}>
                            No events
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDateForUnavailable && (
        <SetUnavailableModal
          userId={user.id}
          consultants={consultants}
          date={selectedDateForUnavailable}
          isOpen={!!selectedDateForUnavailable}
          onClose={() => setSelectedDateForUnavailable(null)}
          onSuccess={() => {
            loadData();
            setSelectedDateForUnavailable(null);
            setToast({ message: 'Unavailable time set successfully', type: 'success' });
          }}
        />
      )}

      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title">Delete Booking</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => setSelectedBooking(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!selectedBooking) return;
                  try {
                    await bookingsApi.delete(selectedBooking.id);
                    setToast({ message: 'Booking deleted successfully', type: 'success' });
                    setSelectedBooking(null);
                    loadData();
                  } catch (error: any) {
                    setToast({
                      message: error.response?.data?.message || 'Failed to delete booking',
                      type: 'error',
                    });
                  }
                }}
                style={{ background: 'var(--error)' }}
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
