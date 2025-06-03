'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Review {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  image_url?: string;
  title?: string;
  experience_type?: string;
}

interface MessageBoardProps {
  user: User | null;
}

export default function MessageBoard({ user }: MessageBoardProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [experienceType, setExperienceType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  // 口コミを取得する関数
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('口コミを取得中...');
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabaseエラー:', error);
        throw error;
      }
      
      console.log('取得したデータ:', data);
      
      // 削除済みIDを除外してセット - localStorageの値も確認
      if (data) {
        // localStorage値も直接確認
        const savedDeletedIds = localStorage.getItem('deletedReviewIds');
        let localStorageIds: number[] = [];
        
        if (savedDeletedIds) {
          try {
            localStorageIds = JSON.parse(savedDeletedIds);
            if (!Array.isArray(localStorageIds)) {
              localStorageIds = [];
            }
          } catch (e) {
            console.error('LocalStorage読み込みエラー:', e);
          }
        }
        
        // ステートとlocalStorageの両方のIDを使って除外
        const combinedDeletedIds = [...new Set([...deletedIds, ...localStorageIds])];
        console.log('除外する削除済みID:', combinedDeletedIds);
        
        const filteredData = data.filter(item => !combinedDeletedIds.includes(item.id));
        setReviews(filteredData);
      }
    } catch (error: any) {
      console.error('口コミの取得に失敗しました:', error);
      setError(`口コミの取得に失敗しました: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時に口コミを取得
  useEffect(() => {
    // 先にlocalStorageから削除済みIDを読み込む
    const savedDeletedIds = localStorage.getItem('deletedReviewIds');
    if (savedDeletedIds) {
      try {
        const parsedIds = JSON.parse(savedDeletedIds);
        if (Array.isArray(parsedIds)) {
          setDeletedIds(parsedIds);
          console.log('LocalStorageから削除済みID読み込み:', parsedIds);
        }
      } catch (error) {
        console.error('削除済みID読み込みエラー:', error);
      }
    }
    
    // 削除済みID読み込み後に口コミを取得
    fetchReviews();

    // リアルタイム更新をサブスクライブ
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        payload => {
          console.log('新しい口コミを受信:', payload);
          const newReview = payload.new as Review;
          // 削除済みIDでなければ追加
          if (!deletedIds.includes(newReview.id)) {
            setReviews(prevReviews => [newReview, ...prevReviews]);
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        payload => {
          console.log('口コミ削除を受信:', payload);
          const deletedId = payload.old.id;
          setReviews(prevReviews => prevReviews.filter(review => review.id !== deletedId));
          // 削除済みIDリストに追加
          setDeletedIds(prev => {
            const newDeletedIds = [...prev, deletedId];
            // LocalStorageに保存
            localStorage.setItem('deletedReviewIds', JSON.stringify(newDeletedIds));
            return newDeletedIds;
          });
        }
      )
      .subscribe((status) => {
        console.log('サブスクリプションステータス:', status);
      });

    // クリーンアップ関数
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // 画像選択時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }
      
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  // 画像のキャンセル
  const handleCancelImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 画像のアップロード処理
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('画像をアップロード中:', filePath);

      // セッション情報を取得して、ログイン状態を確認
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('ログインしていないため、画像をアップロードできません');
      }

      // 直接アップロードを試みる
      console.log('画像を直接アップロード試行中...');
      const { data, error } = await supabase.storage
        .from('message-images')
        .upload(filePath, file, {
          // public-read権限でアップロード
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('アップロードエラー詳細:', error);
        throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath);

      console.log('アップロード成功:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('画像アップロードエラー:', error);
      setError(error.message || `画像のアップロードに失敗しました: ${JSON.stringify(error)}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 口コミのみのメッセージを送信
  const sendTextOnlyReview = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ 
          content: newReview.trim(),
          title: title.trim() || '無題の口コミ',
          rating: rating,
          experience_type: experienceType || 'その他'
        }])
        .select();

      if (error) {
        console.error('送信エラー詳細:', error);
        throw new Error(`口コミの送信に失敗しました: ${error.message}`);
      }
      
      console.log('送信成功:', data);
      return true;
    } catch (error: any) {
      console.error('テキスト送信エラー:', error);
      setError(error.message || `口コミの送信に失敗しました: ${JSON.stringify(error)}`);
      return false;
    }
  };

  // 新しい口コミを送信する関数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!newReview.trim()) {
      setError('口コミ内容を入力してください');
      return;
    }
    
    if (rating === 0) {
      setError('評価を選択してください');
      return;
    }

    try {
      setError(null);
      
      // 画像なしでテキストのみの場合
      if (!imageFile) {
        if (await sendTextOnlyReview()) {
          setNewReview('');
          setTitle('');
          setRating(0);
          setExperienceType('');
          // 最新データを再取得
          fetchReviews();
        }
        return;
      }

      // 画像がある場合
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return; // 画像のアップロードに失敗
        }

        console.log('口コミを送信中:', newReview, '(画像あり)');
        
        const { data, error } = await supabase
          .from('messages')
          .insert([{ 
            content: newReview.trim(),
            title: title.trim() || '無題の口コミ',
            rating: rating,
            experience_type: experienceType || 'その他',
            image_url: imageUrl 
          }])
          .select();

        if (error) {
          console.error('送信エラー詳細:', error);
          throw new Error(`口コミの送信に失敗しました: ${error.message}`);
        }
        
        console.log('送信成功:', data);
        
        // フォームをリセット
        setNewReview('');
        setTitle('');
        setRating(0);
        setExperienceType('');
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // 送信後に最新の口コミを取得
        fetchReviews();
      }
    } catch (error: any) {
      console.error('口コミの送信に失敗しました:', error);
      setError(error.message || `口コミの送信に失敗しました: ${JSON.stringify(error)}`);
    }
  };

  // 口コミ削除機能
  const handleDeleteReview = async (id: number) => {
    if (!confirm('この口コミを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      setDeleting(id);
      setError(null);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('削除エラー:', error);
        throw new Error(`口コミの削除に失敗しました: ${error.message}`);
      }
      
      // UIから削除
      setReviews(prevReviews => prevReviews.filter(review => review.id !== id));
      
      // 削除済みIDリストに追加し、LocalStorageに保存
      setDeletedIds(prev => {
        const newDeletedIds = [...prev, id];
        localStorage.setItem('deletedReviewIds', JSON.stringify(newDeletedIds));
        return newDeletedIds;
      });
      
    } catch (error: any) {
      console.error('削除エラー:', error);
      setError(error.message || '口コミの削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  // 投稿フォームの表示
  const renderForm = () => {
    if (!user) {
      return (
        <div className="p-4 bg-gray-100 rounded-md text-center">
          <p className="text-gray-700 mb-3">口コミを投稿するにはログインが必要です</p>
          <div className="text-sm text-gray-600">
            ログインすると、口コミの投稿や編集ができるようになります
          </div>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* タイトル入力 */}
        <div>
          <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="口コミのタイトルを入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B] text-gray-800"
            disabled={uploading}
          />
        </div>
        
        {/* 星評価 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            評価 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl focus:outline-none ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                disabled={uploading}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        
        {/* 体験タイプ */}
        <div>
          <label htmlFor="experience-type" className="block text-sm font-medium text-gray-700 mb-1">
            体験タイプ
          </label>
          <select
            id="experience-type"
            value={experienceType}
            onChange={(e) => setExperienceType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B] text-gray-800"
            disabled={uploading}
          >
            <option value="">選択してください</option>
            <option value="サービス利用">サービス利用</option>
            <option value="仕事の依頼">仕事の依頼</option>
            <option value="仕事の受注">仕事の受注</option>
            <option value="カスタマーサポート">カスタマーサポート</option>
            <option value="その他">その他</option>
          </select>
        </div>
        
        {/* 口コミ本文 */}
        <div>
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">
            口コミ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-content"
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="あなたの体験や意見を共有してください..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E83D1B] min-h-[150px] text-gray-800"
            disabled={uploading}
          />
        </div>
        
        {/* 画像プレビュー */}
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img 
              src={imagePreview} 
              alt="プレビュー" 
              className="max-h-60 rounded-md border border-gray-200" 
            />
            <button
              type="button"
              onClick={handleCancelImage}
              className="absolute top-2 right-2 bg-[#E83D1B] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#d13518]"
              disabled={uploading}
            >
              ✕
            </button>
          </div>
        )}
        
        {/* 画像アップロードと送信ボタン */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
              disabled={uploading}
            />
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors inline-flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              画像を追加
            </label>
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-[#E83D1B] text-white rounded-md hover:bg-[#d13518] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E83D1B] focus:ring-offset-2 font-medium"
            disabled={uploading || !newReview.trim() || rating === 0}
          >
            {uploading ? '送信中...' : '口コミを投稿する'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="w-full">
      {/* 投稿フォーム */}
      {renderForm()}
      
      {/* 口コミ一覧 */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">最近の口コミ</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">まだ口コミはありません</p>
            <p className="text-sm text-gray-400 mt-2">最初の口コミを投稿してみましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 bg-gray-50 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                {/* 口コミのタイトルと評価 */}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg text-gray-800">
                    {review.title || '無題の口コミ'}
                  </h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 体験タイプと日付 */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    {review.experience_type && (
                      <span className="bg-gray-200 px-2 py-1 rounded text-xs mr-2">
                        {review.experience_type}
                      </span>
                    )}
                    <span>
                      {new Date(review.created_at).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* 削除ボタン - ログインユーザーのみ表示 */}
                  {user && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      disabled={deleting === review.id}
                    >
                      {deleting === review.id ? (
                        <span className="text-xs">削除中...</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                {/* 画像がある場合 */}
                {review.image_url && (
                  <div className="mb-3">
                    <a href={review.image_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={review.image_url} 
                        alt="投稿画像" 
                        className="max-h-80 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMi0zdi0xOGgtMjB2MThoMjB6bS0yLjk1LTkuNzVjMCAyLjA3NS0xLjY4MSAzLjc1LTMuNzUgMy43NXMtMy43NS0xLjY3NS0zLjc1LTMuNzVjMC0yLjA2OCAxLjY4MS0zLjc1IDMuNzUtMy43NXMzLjc1IDEuNjgyIDMuNzUgMy43NXptLTEgMGMwIDEuNTE5LTEuMjMxIDIuNzUtMi43NSAyLjc1cy0yLjc1LTEuMjMxLTIuNzUtMi43NSAxLjIzMS0yLjc1IDIuNzUtMi43NSAyLjc1IDEuMjMxIDIuNzUgMi43NXptLTEwLjc1IDMuNzVjMC0xLjEwNS44OTYtMiAyLTJzMiAuODk1IDIgMi0uODk2IDItMiAyLTItLjg5NS0yLTJ6bTEgMGMwIC41NTEuNDQ4IDEgMSAxcy0uNDQ4LTEtMS0xLS40NDgtMSAxLTEgLjQ0OCAuNDQ5IDEgMXptMTAtOC43NWMwIC41NTEtLjQ0OCAxLTEgMS0uNTUxIDAtMS0uNDQ5LTEtMXMuNDQ5LTEgMS0xYy41NTIgMCAxIC40NDkgMSAxeiIvPjwvc3ZnPg==';
                          target.alt = '画像が読み込めません';
                          target.className = 'max-h-80 rounded-md p-4 bg-gray-100';
                        }}
                      />
                    </a>
                  </div>
                )}
                
                {/* 口コミ本文 */}
                <p className="text-gray-800 whitespace-pre-wrap">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 