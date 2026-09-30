// MyPitch開発メモ → Notion自動書き込みスクリプト
// 使い方: node notion-write.js

import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID;

// ========================================
// 書き込む内容をここで定義
// ========================================
const sections = [
  {
    type: "heading_1",
    text: "MyPitch 開発ドキュメント",
  },
  {
    type: "heading_2",
    text: "📌 サービス概要",
  },
  {
    type: "bulleted_list_item",
    text: "サービス名: MyPitch（マイピッチ）",
  },
  {
    type: "bulleted_list_item",
    text: "ターゲット: 日本国内のアマチュアサッカーチーム（将来的に海外日本人チームへ拡張）",
  },
  {
    type: "bulleted_list_item",
    text: "特化領域: サッカー専用",
  },
  {
    type: "bulleted_list_item",
    text: "運営主体: 日本の個人事業主（芦田大樹）",
  },
  {
    type: "bulleted_list_item",
    text: "ベース: Saigon Japan FCの自社開発システムをSaaS化",
  },
  {
    type: "heading_2",
    text: "🎯 ターゲット市場",
  },
  {
    type: "bulleted_list_item",
    text: "日本国内アマチュアサッカーチーム 約3〜4万チーム",
  },
  {
    type: "bulleted_list_item",
    text: "社会人リーグ・草サッカー・OBチーム・年代別チーム",
  },
  {
    type: "bulleted_list_item",
    text: "当面の目標: 300チーム獲得 → 月額45万円",
  },
  {
    type: "heading_2",
    text: "💰 料金プラン",
  },
  {
    type: "bulleted_list_item",
    text: "Free: 無料 / メンバー20名まで",
  },
  {
    type: "bulleted_list_item",
    text: "スタンダード: 980円/月 / メンバー50名まで",
  },
  {
    type: "bulleted_list_item",
    text: "Pro: 1,980円/月 / メンバー無制限",
  },
  {
    type: "heading_2",
    text: "✅ MVP機能（初回リリース）",
  },
  {
    type: "bulleted_list_item",
    text: "メンバー登録・管理（年代別チーム対応）",
  },
  {
    type: "bulleted_list_item",
    text: "スケジュール＋出欠確認",
  },
  {
    type: "bulleted_list_item",
    text: "出席率の自動集計",
  },
  {
    type: "bulleted_list_item",
    text: "ログイン・権限管理（管理者/一般）",
  },
  {
    type: "bulleted_list_item",
    text: "スマホ対応",
  },
  {
    type: "heading_2",
    text: "🔜 フェーズ2（リリース後1〜3ヶ月）",
  },
  {
    type: "bulleted_list_item",
    text: "部費・会計管理",
  },
  {
    type: "bulleted_list_item",
    text: "試合結果・得点記録",
  },
  {
    type: "bulleted_list_item",
    text: "フォーメーションビルダー（最大の差別化機能）",
  },
  {
    type: "heading_2",
    text: "⚠️ 重要検討事項",
  },
  {
    type: "bulleted_list_item",
    text: "税務: 日本の個人事業主として開業届提出が必要。ベトナム在住での日本事業収入について日本の税理士に要確認",
  },
  {
    type: "bulleted_list_item",
    text: "決済: Stripe推奨",
  },
  {
    type: "bulleted_list_item",
    text: "インボイス: 個人チーム向けに絞れば当面不要",
  },
  {
    type: "bulleted_list_item",
    text: "個人情報保護: 日本のAPPI対応が必要",
  },
  {
    type: "heading_2",
    text: "🗓️ ロードマップ",
  },
  {
    type: "bulleted_list_item",
    text: "2026年10〜11月: SJFCシステム完成・マルチテナント設計",
  },
  {
    type: "bulleted_list_item",
    text: "2026年12月: マルチテナント化・開業届提出",
  },
  {
    type: "bulleted_list_item",
    text: "2027年1月: β版リリース（無料）・5〜10チームでテスト",
  },
  {
    type: "bulleted_list_item",
    text: "2027年3月: 有料プラン開始・Stripe導入",
  },
  {
    type: "bulleted_list_item",
    text: "2027年後半: フォーメーションビルダー追加・海外展開開始",
  },
  {
    type: "heading_2",
    text: "🏗️ 技術スタック（SJFCベース）",
  },
  {
    type: "bulleted_list_item",
    text: "フロントエンド: React + Vite",
  },
  {
    type: "bulleted_list_item",
    text: "データベース・認証: Supabase（PostgreSQL + Auth + Storage）",
  },
  {
    type: "bulleted_list_item",
    text: "ホスティング: Vercel",
  },
  {
    type: "bulleted_list_item",
    text: "サーバー側処理: Vercel Serverless Functions",
  },
  {
    type: "heading_2",
    text: "🏗️ マルチテナント設計方針",
  },
  {
    type: "bulleted_list_item",
    text: "全テーブルにteam_idカラムを追加",
  },
  {
    type: "bulleted_list_item",
    text: "新規teamsテーブルを作成（チーム名・プラン・オーナーID等）",
  },
  {
    type: "bulleted_list_item",
    text: "RLS（Row Level Security）で自チームのデータのみアクセス可能に",
  },
  {
    type: "bulleted_list_item",
    text: "セルフサインアップフローを新規作成",
  },
  {
    type: "heading_2",
    text: "📋 現在のSupabaseテーブル一覧",
  },
  {
    type: "bulleted_list_item",
    text: "accounting_transactions / announcements / attendance / dues / events / goals / jersey_sizes / masters / match_lineup_players / match_lineups / matches / org_chart / profiles / sefa_standings / sefa_top_scorers / sponsors / uniforms / wallets",
  },
  {
    type: "heading_2",
    text: "📋 次のアクション",
  },
  {
    type: "to_do",
    text: "teamsテーブルをSupabaseに作成",
    checked: false,
  },
  {
    type: "to_do",
    text: "全テーブルにteam_idを追加",
    checked: false,
  },
  {
    type: "to_do",
    text: "SJFCの既存データにteam_idを設定",
    checked: false,
  },
  {
    type: "to_do",
    text: "RLSポリシーを設定",
    checked: false,
  },
  {
    type: "to_do",
    text: "セルフサインアップ画面を作成",
    checked: false,
  },
  {
    type: "to_do",
    text: "Stripe決済連携",
    checked: false,
  },
  {
    type: "to_do",
    text: "日本の税理士に相談（ベトナム在住・日本事業収入）",
    checked: false,
  },
  {
    type: "to_do",
    text: "日本で個人事業主として開業届提出",
    checked: false,
  },
  {
    type: "to_do",
    text: "β版リリース後のヒアリング設計",
    checked: false,
  },
];

// ========================================
// Notionブロックに変換
// ========================================
function toBlock(item) {
  switch (item.type) {
    case "heading_1":
      return {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: item.text } }],
        },
      };
    case "heading_2":
      return {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: item.text } }],
        },
      };
    case "bulleted_list_item":
      return {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item.text } }],
        },
      };
    case "to_do":
      return {
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: item.text } }],
          checked: item.checked || false,
        },
      };
    case "divider":
      return { object: "block", type: "divider", divider: {} };
    default:
      return {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: item.text || "" } }],
        },
      };
  }
}

// ========================================
// メイン処理
// ========================================
async function main() {
  console.log("📝 Notionへの書き込みを開始します...");

  try {
    // 50件ずつに分割（Notion APIの制限）
    const blocks = sections.map(toBlock);
    const chunks = [];
    for (let i = 0; i < blocks.length; i += 50) {
      chunks.push(blocks.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      await notion.blocks.children.append({
        block_id: PAGE_ID,
        children: chunk,
      });
    }

    console.log("✅ Notionへの書き込みが完了しました！");
    console.log(`📄 ページ: https://app.notion.com/p/MyPitch-${PAGE_ID}`);
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    if (error.code === "unauthorized") {
      console.error("トークンが正しくないか、ページへのアクセス権がありません。");
      console.error("NotionページにMyPitch Devインテグレーションを接続しましたか？");
    }
  }
}

main();
