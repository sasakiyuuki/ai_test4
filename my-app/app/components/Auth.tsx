'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Loginコンポーネント
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // ログイン成功
      setMessage('ログインしました');
      
    } catch (error: any) {
      console.error('ログインエラー:', error);
      if (error.message === 'Invalid login credentials') {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError(error.message || 'ログインに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      setError('パスワードリセットにはメールアドレスが必要です');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setMessage('パスワードリセットのメールを送信しました。メールを確認してください。');
    } catch (error: any) {
      console.error('パスワードリセットエラー:', error);
      setError(error.message || 'パスワードリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B]"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B]"
            disabled={loading}
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#E83D1B] text-white rounded-md hover:bg-[#d13518] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E83D1B] focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          
          <button
            type="button"
            onClick={handlePasswordReset}
            className="text-sm text-[#E83D1B] hover:text-[#d13518]"
            disabled={loading}
          >
            パスワードを忘れた場合
          </button>
        </div>
      </form>
    </div>
  );
}

// Registerコンポーネント
interface RegisterProps {
  switchView: () => void;
}

function Register({ switchView }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 入力検証
    if (!email || !password || !passwordConfirm) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // 新規ユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 必要に応じてメール確認の設定
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // 登録成功
      setMessage('登録が完了しました。確認メールをご確認ください。');
      
      // 自動的にログインビューに切り替える
      setTimeout(() => {
        switchView();
      }, 3000);
      
    } catch (error: any) {
      console.error('登録エラー:', error);
      if (error.message.includes('email')) {
        setError('このメールアドレスは既に使用されています');
      } else {
        setError(error.message || '登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B]"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B]"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">6文字以上入力してください</p>
        </div>
        
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード（確認）
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B]"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-[#E83D1B] text-white rounded-md hover:bg-[#d13518] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E83D1B] focus:ring-offset-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '登録中...' : 'アカウント作成'}
        </button>
      </form>
    </div>
  );
}

// メインのAuthコンポーネント
interface AuthProps {
  onAuthStateChange: (user: User | null) => void;
}

export default function Auth({ onAuthStateChange }: AuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let ignore = false;
    
    // 現在のセッションを取得
    const getUser = async () => {
      if (!initialized) {
        setLoading(true);
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // コンポーネントがアンマウントされていないことを確認
        if (!ignore) {
          setUser(user);
          // 初回のみ親コンポーネントに通知
          if (!initialized) {
            onAuthStateChange(user);
            setInitialized(true);
          }
        }
      } catch (error) {
        console.error('認証エラー:', error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    getUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!ignore) {
          console.log('認証状態変更:', event);
          const newUser = session?.user ?? null;
          setUser(newUser);
          onAuthStateChange(newUser);
        }
      }
    );

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [onAuthStateChange, initialized]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード中は何も表示しない
  if (loading && !initialized) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E83D1B]"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">{user.email}</span> としてログイン中
        </p>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 bg-[#E83D1B] text-white rounded hover:bg-[#d13518] transition-colors"
          disabled={loading}
        >
          {loading ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${
            view === 'login'
              ? 'border-b-2 border-[#E83D1B] text-[#E83D1B] font-medium'
              : 'text-gray-500'
          }`}
          onClick={() => setView('login')}
        >
          ログイン
        </button>
        <button
          className={`px-4 py-2 ${
            view === 'register'
              ? 'border-b-2 border-[#E83D1B] text-[#E83D1B] font-medium'
              : 'text-gray-500'
          }`}
          onClick={() => setView('register')}
        >
          新規登録
        </button>
      </div>

      {view === 'login' ? <Login /> : <Register switchView={() => setView('login')} />}
    </div>
  );
} 