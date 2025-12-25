'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { consultantsApi, bookingsApi, availabilitiesApi } from '@/lib/api';
import { Consultant, Booking, Availability } from '@/lib/api';
import { Skill, SKILLS } from '../../../shared-config';
import { format, startOfWeek, addWeeks, subWeeks, endOfWeek, parseISO } from 'date-fns';
import Link from 'next/link';
import WeekCalendar from '@/components/WeekCalendar';
import AvailabilityModal from '@/components/AvailabilityModal';
import SetUnavailableModal from '@/components/SetUnavailableModal';
import Toast from '@/components/Toast';

export default function HomePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showBecomeConsultant, setShowBecomeConsultant] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | ''>('');
  const [selectedConsultantForAvailability, setSelectedConsultantForAvailability] = useState<Consultant | null>(null);
  const [consultantsWithAvailability, setConsultantsWithAvailability] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDateForUnavailable, setSelectedDateForUnavailable] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, currentWeek]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [consultantsRes, bookingsRes] = await Promise.all([
        consultantsApi.get({ user_id: user.id }),
        bookingsApi.get(),
      ]);
      setConsultants(consultantsRes.data);
      setBookings(bookingsRes.data);
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

  const handleBecomeConsultant = async () => {
    if (!selectedSkill || !user) return;
    try {
      await consultantsApi.create({ skill: selectedSkill as Skill });
      await loadData();
      setShowBecomeConsultant(false);
      setSelectedSkill('');
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.message || 'Failed to create consultant role', 
        type: 'error' 
      });
    }
  };

  // Check which consultants have availability set
  useEffect(() => {
    const checkAvailabilities = async () => {
      const withAvail = new Set<string>();
      for (const consultant of consultants) {
        try {
          const response = await availabilitiesApi.get(consultant.id);
          if (response.data?.availabilities && response.data.availabilities.length > 0) {
            withAvail.add(consultant.id);
          }
        } catch (error) {
          // No availability set
        }
      }
      setConsultantsWithAvailability(withAvail);
    };

    if (consultants.length > 0) {
      checkAvailabilities();
    }
  }, [consultants]);

  const availableSkills = SKILLS.filter(
    (skill) => !consultants.some((c) => c.skill === skill),
  );

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Welcome back, {user.first_name}! 👋</h1>
          <p className="text-secondary">Here's what's happening with your bookings</p>
        </div>
        <button className="btn-secondary btn-small" onClick={logout}>
          Logout
        </button>
      </div>
      
      <div className="nav">
        <Link href="/calendar" className="nav-link">
          📅 Calendar
        </Link>
        <Link href="/booking" className="nav-link">
          ➕ Book Consultation
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Profile Information</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</div>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user.first_name} {user.last_name}</div>
          </div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</div>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Consultant Roles</h2>
              <p className="card-description">Manage your consultant specializations</p>
            </div>
            <button
              className="btn-outline btn-small"
              onClick={() => setShowBecomeConsultant(!showBecomeConsultant)}
              disabled={availableSkills.length === 0}
            >
              + Add Role
            </button>
          </div>
        </div>
        
        {consultants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">No Consultant Roles</div>
            <p className="empty-state-description">Add your first role to start offering consultations!</p>
          </div>
        ) : (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {consultants.map((consultant) => {
              const hasAvailability = consultantsWithAvailability.has(consultant.id);
              return (
                <button
                  key={consultant.id}
                  onClick={() => setSelectedConsultantForAvailability(consultant)}
                  className={hasAvailability ? 'badge badge-success' : 'badge badge-primary'}
                  style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all var(--transition-base)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={hasAvailability ? 'Click to edit availability' : 'Click to set availability'}
                >
                  {consultant.skill.replace(/_/g, ' ').replace(/\b\w/g, (l:any) => l.toUpperCase())}
                  {hasAvailability && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Click on a consultant role to set or edit availability
          </p>
          </>
        )}
        
        {showBecomeConsultant && availableSkills.length > 0 && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.5rem', 
            background: 'var(--gray-50)', 
            border: '2px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <label style={{ marginBottom: '1rem', display: 'block' }}>
              Select a skill to add
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                style={{ marginTop: '0.5rem' }}
              >
                <option value="">Choose a skill...</option>
                {availableSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                onClick={handleBecomeConsultant}
                disabled={!selectedSkill}
              >
                Add Role
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBecomeConsultant(false);
                  setSelectedSkill('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="card-title">Week View</h2>
              <p className="card-description">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                ← Previous
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </button>
              <button 
                className="btn-secondary btn-small"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
        <WeekCalendar
          weekStart={weekStart}
          consultants={consultants}
          bookings={bookings}
          availabilities={availabilities}
          onBookingClick={(booking) => setSelectedBooking(booking)}
          onSetUnavailable={(date) => setSelectedDateForUnavailable(date)}
        />
      </div>

      {selectedConsultantForAvailability && (
        <AvailabilityModal
          consultant={selectedConsultantForAvailability}
          isOpen={!!selectedConsultantForAvailability}
          onClose={() => setSelectedConsultantForAvailability(null)}
          onSuccess={() => {
            loadData();
            setSelectedConsultantForAvailability(null);
            setToast({ message: 'Availability updated successfully', type: 'success' });
          }}
        />
      )}

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
