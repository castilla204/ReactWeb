# Stripe API Integration - Frontend Implementation Guide

This document explains how to use the new Stripe API integration with the updated DTOs and enhanced status handling.

## Overview

The frontend has been updated to support the new Stripe API structure with the following key changes:

1. **New Response DTOs**: All Stripe-related endpoints now return structured DTOs
2. **Enhanced Status Information**: Added `stripeStatus` and `stripeStatusDetails` fields
3. **Improved Notifications**: Better notification handling with detailed status messages
4. **Reusable Components**: New `StripeStatusComponent` for consistent status display

## Updated API Endpoints

### 1. GET /api/user/expert-profile
**New Response Structure:**
```typescript
interface ExpertProfileResponse {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    createdAt: string;
    latitude: string;
    longitude: string;
    stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
    stripeStatusDetails: string | null;
    onboardingCompleted: boolean;
}
```

### 2. POST /api/user/become-expert
**New Response Structure:**
```typescript
interface BecomeExpertResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        phoneVerified: boolean;
        role: string;
        expertProfile: ExpertProfileResponse;
    };
}
```

### 3. GET /api/subscription/onboarding-status
**New Response Structure:**
```typescript
interface OnboardingStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeAccountId: string | null;
    stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
    stripeStatusDetails: string | null;
    canAccessStripe: boolean;
}
```

### 4. GET /api/subscription/expert-status
**New Response Structure:**
```typescript
interface ExpertStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
    stripeStatusDetails: string | null;
    stripeAccountId: string | null;
    canAccessStripe: boolean;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    statusMessage: string;
    canRetryOnboarding: boolean;
    rejectionReason: string | null;
}
```

### 5. POST /api/subscription/sync-stripe-status
**New Response Structure:**
```typescript
interface StripeSyncStatusResponse {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
    stripeStatusDetails: string | null;
    stripeAccountId: string | null;
    canAccessStripe: boolean;
    stripeAccountStatus: {
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
    };
}
```

## Updated Hooks

### useExpertStripeStatus
The hook now returns the new `ExpertStatusResponse` type and automatically handles status change notifications.

```typescript
const { status, loading, error, refetch, syncStatus, statusInfo, isPolling } = useExpertStripeStatus();

// Access new fields
console.log(status?.stripeStatus); // "Approved"
console.log(status?.stripeStatusDetails); // "Cuenta aprobada. Ya puedes recibir pagos..."
```

### useExpert
Updated to handle the new `ExpertProfileResponse` structure.

```typescript
const { profile, fetchProfile } = useExpert();

// Access new fields
console.log(profile?.stripeStatus); // "Approved"
console.log(profile?.stripeStatusDetails); // "Cuenta aprobada. Ya puedes recibir pagos..."
```

### useBecomeExpert
Updated to handle the new `BecomeExpertResponse` structure.

```typescript
const { handleSubmit } = useBecomeExpert();

// The response now includes the new Stripe status fields
// Logged automatically in the hook
```

## New Components

### StripeStatusComponent
A reusable component for displaying Stripe status information.

```typescript
import { StripeStatusComponent } from '../components/StripeStatusComponent';

// Basic usage
<StripeStatusComponent
    stripeStatus="Approved"
    stripeStatusDetails="Cuenta aprobada. Ya puedes recibir pagos."
    size="md"
    showIcon={true}
    showDetails={true}
/>

// Different sizes
<StripeStatusComponent stripeStatus="Pending" size="sm" />
<StripeStatusComponent stripeStatus="Rejected" size="lg" />

// Without details
<StripeStatusComponent 
    stripeStatus="Approved" 
    showDetails={false} 
/>
```

**Props:**
- `stripeStatus`: The current Stripe status
- `stripeStatusDetails`: Optional detailed message
- `size`: "sm" | "md" | "lg" (default: "md")
- `showIcon`: boolean (default: true)
- `showDetails`: boolean (default: false)
- `className`: Additional CSS classes

### Enhanced StripeStatusCard
The existing `StripeStatusCard` now displays detailed status information when available.

### Enhanced StripeStatusModal
The existing `StripeStatusModal` now shows additional status details in a highlighted box.

## Notification System

### Automatic Notifications
The system now automatically shows notifications when Stripe status changes:

```typescript
// Automatically triggered by useExpertStripeStatus hook
// Shows appropriate notification based on status change
```

### Manual Notifications
Use the new notification utilities:

```typescript
import { useStripeStatusNotifications } from '../utils/stripeNotifications';

const { notifyApproval, notifyRejection, notifyPending } = useStripeStatusNotifications();

// Notify specific status changes
notifyApproval("Tu cuenta ha sido aprobada exitosamente");
notifyRejection("Tu cuenta fue rechazada por motivos de seguridad");
notifyPending("Tu cuenta está siendo verificada");
```

### Custom Notifications
```typescript
import { handleStripeStatusChange } from '../utils/stripeNotifications';

handleStripeStatusChange({
    stripeStatus: "Approved",
    stripeStatusDetails: "Cuenta aprobada. Ya puedes recibir pagos.",
    previousStatus: "Pending"
});
```

## Status Values

The system uses the following status values:

- `"NotRequested"`: No Stripe account configured
- `"Pending"`: Account under review by Stripe
- `"Approved"`: Account approved and can receive payments
- `"Rejected"`: Account rejected by Stripe
- `"Deauthorized"`: Account deauthorized

## Usage Examples

### 1. Display Status in a Component
```typescript
import { StripeStatusComponent } from '../components/StripeStatusComponent';
import { useExpertStripeStatus } from '../hooks/useExpertStripeStatus';

function MyComponent() {
    const { status } = useExpertStripeStatus();
    
    return (
        <div>
            <h3>Account Status</h3>
            {status && (
                <StripeStatusComponent
                    stripeStatus={status.stripeStatus}
                    stripeStatusDetails={status.stripeStatusDetails}
                    showDetails={true}
                />
            )}
        </div>
    );
}
```

### 2. Handle Status Changes
```typescript
import { useEffect } from 'react';
import { useExpertStripeStatus } from '../hooks/useExpertStripeStatus';

function MyComponent() {
    const { status } = useExpertStripeStatus();
    
    useEffect(() => {
        if (status?.stripeStatus === 'Approved') {
            // Handle approval
            console.log('Account approved!');
        } else if (status?.stripeStatus === 'Rejected') {
            // Handle rejection
            console.log('Account rejected:', status.stripeStatusDetails);
        }
    }, [status?.stripeStatus]);
    
    return <div>...</div>;
}
```

### 3. Validate Before Creating Services
```typescript
import { validateBeforeCreatingService } from '../hooks/useExpertStripeStatus';

async function handleCreateService() {
    const canCreate = await validateBeforeCreatingService();
    if (canCreate) {
        // Proceed with service creation
    }
    // Modal will be shown automatically if validation fails
}
```

## Migration Guide

### For Existing Components
1. Update imports to use new types from `../types/stripe`
2. Access new fields: `stripeStatus` and `stripeStatusDetails`
3. Use `StripeStatusComponent` for consistent status display
4. Update notification handling to use new utilities

### For New Components
1. Use the new `StripeStatusComponent` for status display
2. Use `useStripeStatusNotifications` for notifications
3. Access detailed status information from API responses
4. Handle status changes with the enhanced notification system

## Testing

The implementation includes comprehensive error handling and logging. Check the browser console for detailed information about:

- API response times
- Status changes
- Notification triggers
- Error conditions

## Best Practices

1. **Always check for null/undefined**: The new fields are optional in some contexts
2. **Use the reusable components**: `StripeStatusComponent` provides consistent styling
3. **Handle status changes**: Listen for status changes and update UI accordingly
4. **Show detailed messages**: Use `stripeStatusDetails` to provide better user experience
5. **Test different statuses**: Ensure your components work with all possible status values

## Troubleshooting

### Common Issues

1. **Status not updating**: Check if the hook is properly initialized
2. **Notifications not showing**: Ensure the event listener is set up in App.tsx
3. **Type errors**: Make sure you're using the new types from `../types/stripe`
4. **Missing details**: Check if `stripeStatusDetails` is available in the API response

### Debug Information

Enable detailed logging by checking the browser console. The hooks provide comprehensive logging for:
- API calls and responses
- Status changes
- Notification triggers
- Error conditions

