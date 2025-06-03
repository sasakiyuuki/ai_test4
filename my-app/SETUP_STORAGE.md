# Supabaseストレージのセットアップ手順

画像アップロード機能を使用するには、Supabaseのストレージを設定する必要があります。

## 1. ストレージバケットの作成

1. Supabaseダッシュボードで「Storage」に移動します
2. 「New Bucket」をクリックします
3. バケット名を「message-images」に設定します
4. 「Public」を選択します (または必要に応じてアクセス制限を設定)
5. 「Create bucket」をクリックします

## 2. ストレージポリシーの設定

SQLエディタで以下のSQLを実行して、ストレージのアクセス権限を設定します：

```sql
-- 誰でも画像をアップロードできるようにする
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow public uploads',
  'message-images',
  '(role() = ''anon'')'
);

-- 誰でも画像を閲覧できるようにする
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow public view',
  'message-images',
  '(role() = ''anon'')'
);
```

## 3. messagesテーブルの更新

SQLエディタで以下のSQLを実行して、messagesテーブルに画像URLフィールドを追加します：

```sql
-- messagesテーブルにimage_urlカラムを追加
ALTER TABLE messages ADD COLUMN image_url TEXT;
```

これでストレージの設定は完了です。フロントエンドコードで画像のアップロードと表示が可能になります。 