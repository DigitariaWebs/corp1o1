"use client"

import React, { useState, useEffect } from 'react';
import { IntelligentSignup } from './intelligent-signup';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export function OnboardingWrapper() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasCompletedOnboarding = data.data?.user?.profile?.onboardingCompleted;
        setNeedsOnboarding(!hasCompletedOnboarding);
      } else {
        // If profile doesn't exist or error, assume needs onboarding
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      const token = await getToken();
      
      // Send onboarding data to AI personalization service
      const response = await fetch('/api/personalization/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ onboardingData })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Personalized experience generated:', result.data.personalization);
        
        // Redirect to dashboard with personalized experience
        router.push('/dashboard?welcome=true');
      } else {
        console.error('Failed to generate personalized experience');
        // Still redirect to dashboard, but without personalization
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error generating personalized experience:', error);
      router.push('/dashboard');
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      const token = await getToken();
      
      // Mark onboarding as skipped but completed
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'profile.onboardingCompleted': true,
          'profile.onboardingSkipped': true
        })
      });
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
    
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!needsOnboarding) {
    return null; // User has already completed onboarding
  }

  return (
    <IntelligentSignup
      onComplete={handleOnboardingComplete}
      onSkip={handleSkipOnboarding}
    />
  );
}