# Meta Agent Roadmap

A runtime governance layer for AI coding agents. Unified state management and context compilation across sessions, tools, and models.

---

## Phase 1 — "Remember Everything" (State Manager + Context Compiler)

```
Phase 1
│
├─ 1.1 State Storage Layer
│   ├─ ステートの永続化フォーマット設計
│   ├─ 3層ストア実装 (Session / Project / Knowledge)
│   ├─ ステートのCRUD API
│   └─ State Retention Policy (time / size / relevance / compression / manual)
│
├─ 1.2 State Extractor
│   ├─ エージェント応答からのステート抽出
│   ├─ git diff / file change の自動取り込み
│   └─ ユーザー意図・決定事項の構造化
│
├─ 1.3 Context Compiler
│   ├─ ステートからの関連情報抽出アルゴリズム
│   ├─ コンテキストウィンドウへのフィッティング
│   └─ エージェント別フォーマッタ
│
├─ 1.4 MCP Server
│   ├─ MCPプロトコル実装
│   ├─ Claude Code / Cursor からの接続
│   └─ 基本的なCLIインターフェース
│
├─ 1.5 CLI Commands
│   ├─ meta-agent state list / show <id>
│   ├─ meta-agent sessions
│   ├─ meta-agent rules list
│   ├─ meta-agent cost summary
│   └─ meta-agent init / status
│
└─ 1.6 Dashboard UI
    ├─ meta-agent ui (ローカルWebサーバー起動)
    ├─ セッション履歴・アクティブステート表示
    ├─ 3層ステートの中身と残存期間の可視化
    ├─ リテンションポリシー状態の表示
    └─ React + Vite (CLIにバンドル)
```

---

## Phase 1.5 — "One Hub, All Agents" (Instruction Hub)

```
Phase 1.5
│
├─ 1.5.1 Entry Point Manager
│   ├─ 独自エントリーポイント (.meta-agent/)
│   ├─ モード選択: mirror（既存ファイル維持）/ hub-only（独自のみ）
│   └─ 既存 CLAUDE.md / AGENTS.md 等の自動検出
│
├─ 1.5.2 Instruction Registry
│   ├─ AIドキュメントの動的追加・削除
│   ├─ プラグイン的なインストラクション管理
│   └─ バージョン管理・差分追跡
│
└─ 1.5.3 Primary Source Designation
    ├─ primary AIの指定（どのツール向けインストラクションが正規か）
    ├─ 衝突時の解決ルール（primaryの記述が勝つ）
    └─ ツール別オーバーライド
```

---

## Phase 2 — "Smart Rules" (Rule Engine)

```
Phase 2
│
├─ 2.1 Rule Schema
│   ├─ ルールの型定義 (constraint / preference / context / skill)
│   ├─ スコーピング条件 (glob, 言語, タスク種別)
│   └─ 優先度モデル
│
├─ 2.2 Runtime Resolver
│   ├─ 現在のコンテキストに適用されるルールの動的解決
│   ├─ ルール間の衝突検出と解決
│   └─ State Manager との統合
│
└─ 2.3 Compatibility Layer
    ├─ AGENTS.md / CLAUDE.md / .cursorrules の読み込み
    ├─ 既存フォーマットへのエクスポート
    └─ 既存プロジェクトからのマイグレーションツール
```

---

## Phase 3 — "Multi-Agent Governance" (Consensus Engine)

```
Phase 3
│
├─ 3.1 Adapter Layer
│   ├─ Claude API adapter
│   ├─ OpenAI API adapter
│   ├─ Gemini API adapter
│   └─ Local LLM adapter (Ollama等)
│
├─ 3.2 Consensus Patterns
│   ├─ Dictator (単一master — 実行時に誰が最終判断するか)
│   ├─ Validator (実装+検証)
│   ├─ Quorum (合議制)
│   ├─ Pipeline (直列処理)
│   ├─ Specialist (専門家委員会)
│   └─ Auction (競争入札)
│
└─ 3.3 Orchestrator
    ├─ パターンに基づくタスク分配
    ├─ エージェント間のコンテキスト受け渡し
    └─ 結果の統合・最終出力生成
```

---

## Phase 4 — "Optimize Everything" (Optimizer)

```
Phase 4
│
├─ 4.1 Cost Tracker
│   ├─ トークン使用量の追跡
│   ├─ モデル別コスト計算
│   └─ 予算制約の適用
│
├─ 4.2 Routing Engine
│   ├─ 3軸最適化 (accuracy / cost / speed)
│   ├─ タスク分類器 (タスク特性→最適モデル)
│   └─ ユーザー設定に基づく動的ルーティング
│
└─ 4.3 Analytics
    ├─ セッション分析ダッシュボード
    ├─ モデル別パフォーマンス比較
    └─ 最適化推奨の自動生成
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Meta Agent                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Rule Engine  │ │  Optimizer  │ │State Manager │  │
│  │  (Phase 2)  │ │  (Phase 4)  │ │  (Phase 1)   │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬───────┘  │
│         │               │               │           │
│  ┌──────▼───────────────▼───────────────▼───────┐   │
│  │           Context Compiler (Phase 1)          │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │     Instruction Hub (Phase 1.5)                │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │        Consensus Engine (Phase 3)              │   │
│  └──────────────────────┬────────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼────────────────────────┐   │
│  │           Adapter Layer (Phase 3.1)            │   │
│  │   Claude │ GPT │ Gemini │ Local LLM │ ...     │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Optimization Tradeoff

```
                    Accuracy（思考最適化）
                        ▲
                       ╱ ╲
                      ╱   ╲
                     ╱     ╲
                    ╱  ユーザーが ╲
                   ╱   この空間の  ╲
                  ╱    どこに立つか  ╲
                 ╱      選択する     ╲
                ╱                     ╲
               ▼─────────────────────▶
          Cost（コスト最適化）    Speed（レイテンシ最適化）
```
