# 危機管理広報AIアプリ

**Qwen3を活用した記者会見シミュレーションツール**

炎上しそうなテーマから想定質問を自動生成し、記者とのやり取りをシミュレーションできるWebアプリケーションです。

## 🎯 機能概要

### フェーズ1: 想定質問生成
- **テーマ入力**: 炎上の可能性があるテーマを入力
- **AI生成**: Qwen3が記者視点で5件以上の想定質問を生成
- **詳細分析**: 各質問に難易度、罠レベル、リスク領域を自動付与
- **構造化出力**: 整理されたテーブル形式で質問一覧を表示

### フェーズ2: 記者シミュレーション（将来実装予定）
- **回答入力**: 生成された質問に対する広報回答を入力
- **追随質問**: AIが回答内容を分析して追加の掘り下げ質問を生成
- **リアルタイム対話**: 実際の記者会見に近い形でのやり取り体験

### プロンプト編集機能
- **カスタマイズ**: AI生成プロンプトの編集・保存
- **ファイル同期**: 編集内容を実際のソースファイルに反映（開発環境のみ）
- **バックアップ**: 自動バックアップによる安全な編集
- **永続化**: localStorageによる設定の保持

## 🚀 クイックスタート

### 必要な環境
- Node.js 18.0以上
- npm または yarn
- Qwen3互換のAPIエンドポイント

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定：

```bash
# Qwen3 API設定
QWEN_BASE_URL=http://127.0.0.1:1234/v1  # ローカルサーバーの場合
DASHSCOPE_API_KEY=your-api-key-here      # 本番APIの場合
QWEN_MODEL=qwen3-instruct                # 使用するモデル名

# 本番環境の例（Alibaba Cloud DashScope）
# QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# DASHSCOPE_API_KEY=your-dashscope-api-key
# QWEN_MODEL=qwen-max
```

### 2. インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で利用できます。

## 📋 使用方法

### 基本的な使い方

1. **テーマ入力**
   - メイン画面でテーマを入力（例：「データ流出事件」）
   - 必要に応じて補足情報を追加

2. **質問生成**
   - 「想定質問を生成」ボタンをクリック
   - AIが約1-2分で想定質問リストを生成

3. **結果確認**
   - 生成された質問をテーブル形式で確認
   - 難易度、罠レベル、リスク領域などの詳細情報を表示

### プロンプト編集機能

1. **設定画面の開き方**
   - 右上の⚙️アイコンをクリック

2. **プロンプト編集**
   - 想定質問生成・追随質問生成の2種類のプロンプトを編集可能
   - リアルタイムプレビューで編集内容を確認

3. **ファイル同期**（開発環境のみ）
   - 「ファイルに同期」ボタンで実際のソースファイルに反映
   - 自動バックアップ機能で安全性を確保

## 🏗️ 技術スタック

- **フロントエンド**: Next.js 15, TypeScript, Tailwind CSS
- **状態管理**: Zustand + localStorage
- **AI**: Qwen3 (OpenAI SDK経由)
- **バリデーション**: AJV (JSON Schema)
- **ログ**: 構造化ログ（JSONL形式）

## 📁 プロジェクト構造

```
kikikanriko-ai-app/
├── app/
│   ├── api/
│   │   ├── generate-questions/     # 想定質問生成API
│   │   ├── simulate/turn/          # 追随質問生成API（将来）
│   │   └── update-prompts/         # プロンプト同期API
│   ├── simulate/[id]/              # シミュレーション画面（将来）
│   └── page.tsx                    # メインページ
├── components/
│   ├── PromptForm.tsx              # テーマ入力フォーム
│   ├── QuestionsTable.tsx          # 質問一覧テーブル
│   ├── PromptSettingsModal.tsx     # プロンプト設定モーダル
│   └── ChatPane.tsx                # チャット画面（将来）
└── lib/
    ├── llm.ts                      # Qwen3クライアント
    ├── schemas.ts                  # JSON Schema定義
    ├── validators.ts               # バリデーション機能
    ├── prompts.ts                  # デフォルトプロンプト
    ├── logging.ts                  # ログ機能
    └── stores/
        └── promptStore.ts          # プロンプト管理ストア
```

## 📊 API仕様

### POST /api/generate-questions

想定質問を生成します。

**リクエスト:**
```json
{
  "topic": "データ流出事件",
  "context": "顧客情報10万件が漏洩",
  "customPrompt": "カスタムプロンプト（任意）"
}
```

**レスポンス:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "具体的な質問文",
      "intent_tag": "事実確認",
      "difficulty": 3,
      "gotcha_level": 1,
      "expected_evidence": "期待する根拠",
      "risk_area": "法的責任"
    }
  ]
}
```

### POST /api/update-prompts（開発環境のみ）

プロンプトファイルを更新します。

**リクエスト:**
```json
{
  "questionsPrompt": "更新後のプロンプト",
  "followupPrompt": "更新後のプロンプト"
}
```

## 🔧 開発情報

### 環境変数一覧

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `QWEN_BASE_URL` | Qwen3 APIのベースURL | `https://api.example.com/v1` |
| `DASHSCOPE_API_KEY` | APIキー | `your-api-key` |
| `QWEN_MODEL` | 使用するモデル名 | `qwen3-instruct` |

### 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# 型チェック
npm run type-check

# Lint
npm run lint
```

### ログ確認

構造化ログがコンソールに出力されます：

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Question generation successful",
  "route": "/api/generate-questions",
  "request_id": "gen_123456789_abc123",
  "questions_count": 7,
  "outcome": "success"
}
```

## 🚀 デプロイ

### Netlify（推奨）

1. **リポジトリ連携**
   ```bash
   git remote add origin https://github.com/your-username/kikikanriko-ho.git
   git push -u origin main
   ```

2. **Netlifyでインポート**
   - [Netlify](https://netlify.com)でGitHubリポジトリをインポート
   - ビルド設定は自動検出されます

3. **環境変数設定**
   - Site settings → Environment variablesで以下を設定：
     - `QWEN_BASE_URL`
     - `DASHSCOPE_API_KEY`
     - `QWEN_MODEL`

### Vercel

```bash
# Vercel CLIを使用
npx vercel
# 環境変数を設定後デプロイ
```

## ⚠️ 注意事項

### セキュリティ
- APIキーは環境変数のみで管理
- 本番環境ではファイル同期機能は無効化
- 個人情報はログに出力しない

### 制限事項
- 音声入力は未対応（将来実装予定）
- JSON厳格出力が前提（プロンプト次第）
- 長文入力は1000-1500文字程度を推奨
- Qwen3の応答時間に依存（通常1-3分）

### パフォーマンス
- LLM応答の待機時間を考慮
- 自動リトライ機能で安定性を確保
- ローディング表示でUX向上

## 🎨 カスタマイズ

### プロンプトの調整
1. 設定画面（⚙️）からプロンプトを編集
2. 開発環境では「ファイルに同期」で永続化
3. プロダクション環境では環境変数での管理を検討

### UIの調整
- `tailwind.config.js`でデザインシステムを変更
- `components/`内のコンポーネントでレイアウト調整

## 📞 サポート

### よくある問題

**Q: AIの応答が遅い**
A: Qwen3サーバーの応答時間に依存します。ローカルサーバーの性能を確認してください。

**Q: JSON解析エラーが発生する**
A: プロンプトの調整またはモデルの変更を検討してください。自動リトライ機能が働きます。

**Q: ファイル同期ができない**
A: 開発環境（`NODE_ENV=development`）でのみ利用可能です。

### 開発者向け情報
- TypeScript厳格モードを使用
- ESLintルールを遵守
- Prettier自動フォーマット対応

---

**Powered by Qwen3 & Next.js**