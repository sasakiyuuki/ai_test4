import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Next.js 15の仕様では、cookiesは同期的なAPIを持つ
            try {
              cookieStore.set(name, value);
            } catch (error) {
              console.error('Cookieの設定エラー:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Cookieの削除エラー:', error);
            }
          },
        },
      }
    );
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('セッション交換エラー:', error);
    }
  }

  // メインページにリダイレクト
  return NextResponse.redirect(requestUrl.origin);
} 