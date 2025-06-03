-- ストレージバケットに対するRLSポリシーを設定

-- message-imagesバケットに対する匿名ユーザーの読み取り権限
CREATE POLICY "匿名ユーザーが画像を閲覧可能" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'message-images');

-- 認証済みユーザーのみがアップロード可能
CREATE POLICY "認証済みユーザーが画像をアップロード可能" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'message-images' AND
    auth.role() = 'authenticated'
  );

-- 認証済みユーザーのみが自分がアップロードしたファイルを更新・削除可能
CREATE POLICY "認証済みユーザーが自分の画像を更新可能" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'message-images' AND
    auth.uid() = owner
  );

CREATE POLICY "認証済みユーザーが自分の画像を削除可能" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'message-images' AND
    auth.uid() = owner
  ); 