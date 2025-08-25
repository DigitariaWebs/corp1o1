import { dark } from '@clerk/themes'
import type { Appearance } from '@clerk/types'

export const clerkTheme: Appearance = {
  baseTheme: dark,
  variables: {
    // Revolutionary Corp1o1 color palette
    colorPrimary: '#22d3ee', // revolutionary-cyan
    colorBackground: '#0f172a', // slate-900
    colorInputBackground: '#1e293b', // slate-800
    colorInputText: '#f8fafc', // slate-50
    colorText: '#f8fafc', // slate-50
    colorTextSecondary: '#94a3b8', // slate-400
    colorSuccess: '#10b981', // emerald-500
    colorDanger: '#ef4444', // red-500
    colorWarning: '#f59e0b', // revolutionary-amber
    borderRadius: '0.75rem', // rounded-xl
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    // Main card styling
    card: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 with opacity
      border: '1px solid rgba(34, 211, 238, 0.2)', // revolutionary-cyan border
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(34, 211, 238, 0.1)',
      backdropFilter: 'blur(16px)',
    },
    
    // Header styling
    headerTitle: {
      color: '#f8fafc',
      fontSize: '1.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #22d3ee, #1e3a8a)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    
    headerSubtitle: {
      color: '#94a3b8',
    },
    
    // Form elements
    formFieldInput: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      color: '#f8fafc',
      '&:focus': {
        borderColor: '#22d3ee',
        boxShadow: '0 0 0 3px rgba(34, 211, 238, 0.1)',
      },
    },
    
    formFieldLabel: {
      color: '#f8fafc',
      fontWeight: '500',
    },
    
    // Buttons
    formButtonPrimary: {
      backgroundColor: '#22d3ee',
      background: 'linear-gradient(135deg, #22d3ee, #1e3a8a)',
      border: 'none',
      color: '#f8fafc',
      fontWeight: '600',
      '&:hover': {
        background: 'linear-gradient(135deg, #0891b2, #1e40af)',
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    
    // Links and secondary buttons
    footerActionLink: {
      color: '#22d3ee',
      '&:hover': {
        color: '#0891b2',
      },
    },
    
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      color: '#f8fafc',
      '&:hover': {
        backgroundColor: '#334155',
        borderColor: '#22d3ee',
      },
    },
    
    // Divider
    dividerLine: {
      backgroundColor: '#334155',
    },
    
    dividerText: {
      color: '#94a3b8',
    },
    
    // Alert styling
    alertText: {
      color: '#f8fafc',
    },
    
    // Modal backdrop
    modalBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
    },
    
    // Loading spinner
    spinner: {
      color: '#22d3ee',
    },
    
    // Badge styling
    badge: {
      backgroundColor: 'rgba(34, 211, 238, 0.1)',
      color: '#22d3ee',
      border: '1px solid rgba(34, 211, 238, 0.2)',
    },
  },
}

// Additional styling for specific components
export const signUpAppearance: Appearance = {
  ...clerkTheme,
  elements: {
    ...clerkTheme.elements,
    headerTitle: {
      ...clerkTheme.elements?.headerTitle,
      textAlign: 'center',
    },
    card: {
      ...clerkTheme.elements?.card,
      minHeight: '600px',
      width: '100%',
      maxWidth: '400px',
    },
  },
}

export const signInAppearance: Appearance = {
  ...clerkTheme,
  elements: {
    ...clerkTheme.elements,
    card: {
      ...clerkTheme.elements?.card,
      minHeight: '500px',
      width: '100%',
      maxWidth: '400px',
    },
  },
}