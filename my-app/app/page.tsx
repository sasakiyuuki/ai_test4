'use client';

import { useState } from 'react';
import MessageBoard from "./components/MessageBoard";
import Auth from "./components/Auth";
import { User } from '@supabase/supabase-js';
import Image from "next/image";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleAuthStateChange = (newUser: User | null) => {
    setUser(newUser);
  };

  return (
    <div className="min-h-screen bg-[#FAD8D1] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="CASTER BIZ assistant"
              width={2228}
              height={356}
              priority
              unoptimized
              className="w-full max-w-[1000px] h-auto my-4"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#E83D1B] mb-2">口コミ広場</h1>
            <p className="text-gray-700">株式会社キャスターの口コミを投稿・閲覧できるプラットフォーム</p>
          </div>
        </header>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#E83D1B] mb-4">株式会社キャスターについて</h2>
          <p className="text-gray-700 mb-4">
            株式会社キャスターは、リモートワーク人材のマッチングプラットフォーム「CASTER BIZ」を運営しています。
            フリーランスや副業人材と企業をつなぎ、多様な働き方を支援しています。
          </p>
          <div className="flex justify-center">
            <a 
              href="https://caster.co.jp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#E83D1B] hover:text-[#d13518] inline-flex items-center"
            >
              公式サイトを見る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="mb-8">
          <Auth onAuthStateChange={handleAuthStateChange} />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#E83D1B] mb-4">口コミを投稿する</h2>
          {user ? (
            <p className="text-gray-700 mb-6">
              株式会社キャスターやCATER BIZについての体験や評価を共有してください。
              投稿内容は公開されますので、個人を特定する情報は含めないようご注意ください。
            </p>
          ) : (
            <p className="text-gray-700 mb-6">
              口コミを投稿するには、上記の「ログイン」セクションからログインしてください。
              ログインすると、この場所に投稿フォームが表示されます。
            </p>
          )}
          <MessageBoard user={user} />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#E83D1B] mb-4">よくある質問</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Q: 匿名で投稿できますか？</h3>
              <p className="text-gray-700">A: はい、口コミは匿名で投稿されます。ただし、不適切な内容は削除される場合があります。</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Q: 自分の投稿を編集・削除できますか？</h3>
              <p className="text-gray-700">A: ログイン状態で投稿した口コミは、後から編集・削除が可能です。</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Q: どのような内容を投稿すればよいですか？</h3>
              <p className="text-gray-700">A: 株式会社キャスターでの実際の体験、サービスの使用感、良かった点・改善点などを具体的に共有いただけると参考になります。</p>
            </div>
          </div>
        </div>
        
        <footer className="text-center text-sm text-gray-600">
          <p>© 2024 口コミ広場 | CASTER BIZ assistant</p>
          <p className="mt-1 text-xs">このサイトは株式会社キャスターの公式サイトではありません</p>
        </footer>
      </div>
    </div>
  );
}
