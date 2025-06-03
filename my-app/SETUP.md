# Supabaseセットアップ手順

このプロジェクトでは、Supabaseをデータベースとして使用しています。以下の手順に従ってセットアップしてください。

## 1. Supabaseアカウントの作成

まだSupabaseのアカウントを持っていない場合は、[Supabase](https://supabase.com/)でアカウントを作成してください。

## 2. 新しいプロジェクトの作成

1. Supabaseダッシュボードから「New Project」をクリックします
2. プロジェクト名を入力し、データベースのパスワードを設定します
3. リージョンを選択し、プロジェクトを作成します

## 3. データベーステーブルの作成

SQLエディタで以下のSQLを実行して、メッセージ用のテーブルを作成します：

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 行レベルのセキュリティポリシーを設定
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能なポリシー
CREATE POLICY "Allow anonymous read access" ON messages
  FOR SELECT USING (true);

-- 誰でも挿入可能なポリシー
CREATE POLICY "Allow anonymous insert access" ON messages
  FOR INSERT WITH CHECK (true);
```

## 4. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の環境変数を設定します：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anon Key
```

Supabase URLとAnon Keyは、Supabaseプロジェクトの「Settings」→「API」から取得できます。

## 5. アプリケーションの起動

環境変数を設定した後、アプリケーションを起動します：

```bash
npm run dev
```

これで、メッセージの書き込みと表示が可能なアプリケーションが利用できるようになります。 