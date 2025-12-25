'use client';

import { useState } from 'react';
import { Consultant, Booking, Availability } from '@/lib/api';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { eachDayOfInterval, endOfWeek } from 'date-fns';
import { calculateEventPositions } from '@/utils/calendarLayout';

interface WeekCalendarProps {
  weekStart: Date;
  consultants: Consultant[];
  bookings: Booking[];
  availabilities: Availability[];
  onBookingClick?: (booking: Booking) => void;
  onAvailabilityClick?: (availability: Availability, date: Date) => void;
  onSetUnavailable?: (date: Date) => void;
}

export default function WeekCalendar({ 
  weekStart, 
  consultants, 
  bookings, 
  availabilities,
  onBookingClick,
  onAvailabilityClick,
  onSetUnavailable,
}: WeekCalendarProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Get bookings for the current week
  const weekBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.start);
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  // Get all events (bookings + availabilities) for a day
  const getDayEvents = (day: Date) => {
    const dayBookings = weekBookings.filter((booking) =>
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

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(7, 1fr)', 
      gap: '0.75rem',
      marginTop: '1rem'
    }}>
      {weekDays.map((day) => {
        const isToday = isSameDay(day, new Date());
        const dayKey = day.toISOString();
        const isHovered = hoveredDay === dayKey;
        
        return (
          <div
            key={dayKey}
            style={{
              background: isToday ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' : 'var(--bg-primary)',
              border: `2px solid ${isToday ? 'var(--primary)' : 'var(--gray-200)'}`,
              padding: '1rem',
              minHeight: '500px',
              borderRadius: 'var(--radius-lg)',
              transition: 'all var(--transition-base)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isToday) {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
              if (onSetUnavailable) {
                setHoveredDay(dayKey);
              }
            }}
            onMouseLeave={(e) => {
              if (!isToday) {
                e.currentTarget.style.borderColor = 'var(--gray-200)';
                e.currentTarget.style.boxShadow = 'none';
              }
              setHoveredDay(null);
            }}
          >
            {isHovered && onSetUnavailable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetUnavailable(day);
                }}
                className="btn-secondary btn-small"
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  zIndex: 10,
                  fontSize: '0.75rem',
                  padding: '0.375rem 0.75rem',
                }}
              >
                Set as unavailable
              </button>
            )}
            <div style={{ 
              fontWeight: isToday ? 700 : 600, 
              marginBottom: '0.75rem',
              color: isToday ? 'var(--primary)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {format(day, 'EEE')}
            </div>
            <div style={{ 
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}>
              {format(day, 'd')}
            </div>
            <div style={{ position: 'relative', marginTop: '0.5rem', minHeight: '80px' }}>
              {(() => {
                const { bookings: dayBookings, availabilities: dayAvailabilities } = getDayEvents(day);
                const { positions: eventPositions, timeRange } = calculateEventPositions(dayBookings, dayAvailabilities, day);
                
                // Calculate container height based on time range
                // Use a scale: 1 hour = 60px, minimum 80px
                const containerHeight = timeRange 
                  ? Math.max(80, (timeRange.totalMinutes / 60) * 60)
                  : 80;
                
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
                            padding: '0.25rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            marginLeft: '0.125rem',
                            marginRight: '0.125rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAvailabilityClick?.(avail, day);
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {displayTimes.startTime} - {displayTimes.endTime}
                          </div>
                          <div style={{ 
                            fontSize: '0.6rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.125rem',
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
                            padding: '0.25rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            marginLeft: '0.125rem',
                            marginRight: '0.125rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick?.(booking);
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {format(parseISO(booking.start), 'HH:mm')} - {format(parseISO(booking.end), 'HH:mm')}
                          </div>
                          <div style={{ 
                            fontSize: '0.6rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.125rem',
                            textTransform: 'capitalize',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {booking.consultant?.skill?.replace(/_/g, ' ')}
                          </div>
                          <span className={booking.status === 'confirmed' ? 'badge badge-success' : 'badge badge-warning'} style={{ 
                            marginTop: '0.125rem', 
                            display: 'inline-block',
                            fontSize: '0.55rem',
                            padding: '0.125rem 0.25rem'
                          }}>
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}
                    {dayBookings.length === 0 && dayAvailabilities.length === 0 && (
                      <div style={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.75rem', 
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
  );
}
