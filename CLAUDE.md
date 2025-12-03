# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T-Fiber Orders is a Next.js 16 application for managing T-Mobile Fiber internet service orders. It provides order entry, commission tracking, team leaderboards, and admin analytics.

**Tech Stack:**
- Next.js 16 (React 19, App Router, Server Actions)
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- Recharts for analytics visualization

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter
npm run lint
```

The development server runs on `http://localhost:3000`.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The `SUPABASE_SERVICE_ROLE_KEY` is used by the admin client to bypass Row Level Security for privileged operations.

## Architecture

### Authentication & Authorization

**Authentication:** Google OAuth via Supabase Auth
- Auth callback: `src/app/auth/callback/route.ts`
- Login page: `src/app/login/page.tsx`

**Authorization:** Role-based with Row Level Security (RLS)
- **Roles:** `admin`, `manager`, `salesperson` (defined in `users` table)
- **Dynamic roles system:** The app also supports custom roles defined in the `roles` table with granular permissions
- Admin checks use `checkAdminStatus()` server action from `src/app/admin/actions.ts`

**Critical:** Admin operations use the service role client (`src/lib/supabase-admin.ts`) which bypasses RLS. Regular operations use the standard server client (`src/lib/supabase-server.ts`) which respects RLS policies.

### Database Schema

**Key tables:**
- `users` - User profiles with roles (synced from auth)
- `orders` - Customer orders with commission tracking
- `commission_rates` - Commission amounts by plan type
- `roles` - Dynamic role definitions with permissions
- `role_commission_rates` - Commission rates specific to custom roles

**Commission calculation:** Automatic via database trigger `set_order_commission` that runs on order insert, looking up rates from `commission_rates` or `role_commission_rates` tables.

### Client Architecture

**Three Supabase clients, each with specific use cases:**

1. **Server Client** (`createServerSupabaseClient` in `src/lib/supabase-server.ts`)
   - Use for: Server Components and API routes
   - Respects RLS policies
   - Uses cookies for session management

2. **Admin Client** (`createAdminClient` in `src/lib/supabase-admin.ts`)
   - Use for: Admin operations that need to bypass RLS
   - **Never expose to client-side code**
   - Requires `SUPABASE_SERVICE_ROLE_KEY`

3. **Browser Client** (`createClient` in `src/lib/supabase.ts`)
   - Use for: Client Components
   - Respects RLS policies
   - Uses localStorage for session

### Data Flow Patterns

**Order Creation:**
1. User fills form in `OrderForm` component
2. Form submitted to `createOrder` server action (`src/app/orders/new/actions.ts`)
3. Server action creates order with authenticated user as salesperson
4. Database trigger auto-calculates commission
5. Redirect to orders list

**Admin Operations:**
1. Client-side admin layout verifies access via `checkAdminStatus()`
2. Admin pages use server actions that employ admin client
3. RLS is bypassed for read/write operations

### File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel (protected)
│   │   ├── layout.tsx     # Admin auth wrapper
│   │   ├── page.tsx       # Dashboard with analytics
│   │   ├── actions.ts     # Server actions (checkAdminStatus)
│   │   ├── users/         # User management
│   │   ├── orders/        # All orders view
│   │   ├── commissions/   # Commission management
│   │   └── roles/         # Role management
│   ├── orders/
│   │   ├── page.tsx       # User's orders list
│   │   ├── [id]/          # Order detail view
│   │   └── new/           # Order entry form
│   ├── auth/callback/     # OAuth callback handler
│   ├── login/             # Login page
│   ├── team/              # Leaderboard
│   ├── settings/          # User settings
│   └── layout.tsx         # Root layout with theme
├── components/            # React components
│   ├── OrderForm.tsx      # Main order entry form
│   ├── PlanSelector.tsx   # Plan selection UI
│   ├── DateSelector.tsx   # Install date picker
│   └── TimeSlotSelector.tsx
├── lib/
│   ├── types.ts           # TypeScript types and constants
│   ├── supabase.ts        # Browser Supabase client
│   ├── supabase-server.ts # Server Supabase client
│   ├── supabase-admin.ts  # Admin Supabase client
│   └── theme-context.tsx  # Dark mode context
└── app/globals.css        # Tailwind styles
```

## Important Types and Constants

Located in `src/lib/types.ts`:

**Plan Types:** `fiber_500`, `fiber_1gig`, `fiber_2gig`, `founders_club`

**Pricing Tiers:** `voice_autopay`, `autopay_only`, `no_discounts`
- Determined by `getPricingTier(hasVoiceLine, hasAutopay)`
- Prices defined in `PLAN_PRICING` constant

**Order Status:** `new`, `scheduled`, `installed`, `completed`, `cancelled`

**Time Slots:** `8-10`, `10-12`, `12-3`, `3-5` (AM/PM labels in `TIME_SLOT_LABELS`)

## Key Implementation Details

### Server Actions

Server actions are used throughout for data mutations to maintain security:
- Located in `actions.ts` files within route directories
- Always use `'use server'` directive
- Return structured error/success objects
- Example: `src/app/orders/new/actions.ts` for order creation

### RLS Policies

The database has comprehensive Row Level Security:
- Salespeople can only view/edit their own orders
- Admins/managers can view all data
- Commission rates are readable by all, writable by admins only
- User insert policy allows self-registration during OAuth callback

**Critical:** When migrations reference the `users` table within RLS policies, this can cause recursion errors. The migrations in `supabase/migrations/` contain fixes for this issue.

### Dark Mode

Implemented with CSS variables and Tailwind:
- Context in `src/lib/theme-context.tsx`
- Prevents flash via inline script in root layout
- Uses `dark:` prefix for dark mode styles
- System preference detection with localStorage override

### Theme Colors

Primary brand color: `#E20074` (T-Mobile magenta/pink)
- Used throughout for buttons, accents, gradients
- Complementary colors defined in Tailwind config

## Database Migrations

Located in `supabase/migrations/`:
- Run in order by timestamp prefix
- Key migrations handle RLS recursion fixes, role system, commission rates
- Schema definition in `supabase/schema.sql` (for reference)

**To apply migrations:** Use Supabase CLI or dashboard SQL editor

## Common Patterns

**Checking user role:**
```typescript
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Admin operations:**
```typescript
const adminClient = createAdminClient();
// Bypass RLS for privileged operations
```

**Price calculation:**
```typescript
const pricingTier = getPricingTier(hasVoiceLine, hasAutopay);
const monthlyPrice = calculatePrice(planType, hasVoiceLine, hasAutopay);
```

## Important Notes

1. **Never use admin client in Client Components** - it exposes the service role key
2. **Path aliases** - Use `@/` for imports from `src/` directory
3. **Form validation** - OrderForm handles client-side validation before server action
4. **Commission automation** - Commissions are set by database trigger, not application code
5. **Mobile-first** - UI is optimized for mobile sales representatives
6. **PWA support** - Includes manifest.json and mobile meta tags for install capability
