import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle server component cookie errors
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Use admin client to bypass RLS for user creation
        // This is necessary because RLS policies require auth.uid() to match,
        // but the session may not be fully established yet
        const adminClient = createAdminClient();

        // Check if user exists in our users table
        const { data: existingUser } = await adminClient
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        // If user doesn't exist, create their profile
        if (!existingUser) {
          const { error: insertError } = await adminClient.from('users').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'salesperson',
          });

          if (insertError) {
            console.error('Error creating user record:', insertError);
            return NextResponse.redirect(`${origin}/login?error=user_creation`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
