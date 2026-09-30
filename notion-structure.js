// MyPitch Notion ページ構造 自動作成スクリプト
// 使い方: node notion-structure.js

import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PARENT_PAGE_ID = process.env.NOTION_PAGE_ID;

// ========================================
// ブロック生成ヘルパー
// ========================================
const h1 = (text) => ({
  object: "block", type: "heading_1",
  heading_1: { rich_text: [{ type: "text", text: { content: text } }] },
});
const h2 = (text) => ({
  object: "block", type: "heading_2",
  heading_2: { rich_text: [{ type: "text", text: { content: text } }] },
});
const h3 = (text) => ({
  object: "block", type: "heading_3",
  heading_3: { rich_text: [{ type: "text", text: { content: text } }] },
});
const bullet = (text) => ({
  object: "block", type: "bulleted_list_item",
  bulleted_list_item: { rich_text: [{ type: "text", text: { content: text } }] },
});
const todo = (text, checked = false) => ({
  object: "block", type: "to_do",
  to_do: { rich_text: [{ type: "text", text: { content: text } }], checked },
});
const para = (text) => ({
  object: "block", type: "paragraph",
  paragraph: { rich_text: [{ type: "text", text: { content: text } }] },
});
const divider = () => ({ object: "block", type: "divider", divider: {} });
const callout = (text, emoji = "💡") => ({
  object: "block", type: "callout",
  callout: {
    rich_text: [{ type: "text", text: { content: text } }],
    icon: { type: "emoji", emoji },
  },
});

// ========================================
// サブページ作成関数
// ========================================
async function createPage(parentId, title, emoji, blocks = []) {
  const page = await notion.pages.create({
    parent: { page_id: parentId },
    icon: { type: "emoji", emoji },
    properties: {
      title: { title: [{ type: "text", text: { content: title } }] },
    },
    children: blocks.slice(0, 100),
  });
  // 100件以上は追加で書き込み
  if (blocks.length > 100) {
    for (let i = 100; i < blocks.length; i += 50) {
      await notion.blocks.children.append({
        block_id: page.id,
        children: blocks.slice(i, i + 50),
      });
    }
  }
  console.log(`  ✅ 作成: ${emoji} ${title}`);
  return page.id;
}

// ========================================
// メイン処理
// ========================================
async function main() {
  console.log("📝 MyPitch Notion ページ構造を作成します...\n");

  try {
    // ============================================================
    // 1. 概要・ビジョン
    // ============================================================
    console.log("📄 概要・ビジョン を作成中...");
    await createPage(PARENT_PAGE_ID, "概要・ビジョン", "🎯", [
      h1("MyPitch — サービス概要"),
      callout("サッカーチームのための、チーム管理サービス", "⚽"),
      divider(),

      h2("サービス概要"),
      bullet("サービス名: MyPitch（マイピッチ）"),
      bullet("ターゲット: 日本国内のアマチュアサッカーチーム（将来的に海外日本人チームへ拡張）"),
      bullet("特化領域: サッカー専用"),
      bullet("運営主体: 日本の個人事業主（芦田大樹）"),
      bullet("ベース: Saigon Japan FC（SJFC）の自社開発システムをSaaS化"),
      divider(),

      h2("ビジョン"),
      para("LINEとExcelでの運営から卒業したいアマチュアサッカーチームに、シンプルで使いやすいチーム管理プラットフォームを提供する。"),
      divider(),

      h2("ターゲット市場"),
      bullet("日本国内アマチュアサッカーチーム 約3〜4万チーム"),
      bullet("社会人リーグ・草サッカー・OBチーム・年代別チーム"),
      bullet("当面の目標: 300チーム獲得 → 月額45万円"),
      divider(),

      h2("競合分析"),
      h3("主な競合"),
      bullet("サークルスクエア — 日本最大手・知名度高いが海外チーム非対応・UIが古い"),
      bullet("TeamSnap（米国） — 英語圏で強いが日本語なし"),
      bullet("スポーツナビチーム — Yahoo連携・サッカー特化でない"),
      divider(),

      h2("MyPitchの差別化ポイント"),
      bullet("✅ フォーメーションビルダー（前半・後半で別々に保存可能）"),
      bullet("✅ 年代別複数チーム管理（U-40/O-40/O-50等）"),
      bullet("✅ サッカー専用設計"),
      bullet("✅ 背番号管理・重複防止"),
      bullet("✅ 部費の複数財布管理"),
      bullet("✅ 海外チーム対応（将来）"),
    ]);

    // ============================================================
    // 2. 事業設計（親ページ）
    // ============================================================
    console.log("\n📁 事業設計 フォルダを作成中...");
    const bizPageId = await createPage(PARENT_PAGE_ID, "事業設計", "💼", [
      h1("事業設計"),
      para("料金プラン・ロードマップ・重要検討事項をまとめています。"),
    ]);

    // 2-1. 料金プラン
    await createPage(bizPageId, "料金プラン", "💰", [
      h1("料金プラン"),
      divider(),

      h2("プラン一覧"),
      h3("Free — 無料"),
      bullet("メンバー20名まで"),
      bullet("スケジュール・出欠管理"),
      bullet("メンバー管理"),
      bullet("出席率の自動集計"),

      h3("スタンダード — 980円/月"),
      bullet("メンバー50名まで"),
      bullet("Freeの全機能"),
      bullet("部費・会計管理"),
      bullet("試合結果・得点記録"),

      h3("Pro — 1,980円/月"),
      bullet("メンバー無制限"),
      bullet("スタンダードの全機能"),
      bullet("フォーメーションビルダー"),
      bullet("複数チーム管理"),
      bullet("優先サポート"),
      bullet("データエクスポート"),
      divider(),

      h2("年払い割引"),
      bullet("年払いで2ヶ月分無料（継続率向上のため）"),
      divider(),

      callout("年間売上1,000万円以下は消費税免税。個人チーム向けに絞ればインボイス登録も当面不要。", "⚠️"),
    ]);

    // 2-2. ロードマップ
    await createPage(bizPageId, "ロードマップ", "🗓️", [
      h1("ロードマップ"),
      divider(),

      h2("2026年10月（現在）"),
      bullet("✅ キックオフ"),
      bullet("✅ ブランドデザイン（ロゴ・LP）完成"),
      bullet("🔄 マルチテナント設計・DB設計確定"),
      bullet("🔄 SJFCコード棚卸し・流用範囲特定"),

      h2("2026年11月"),
      bullet("マルチテナント化コア開発"),
      bullet("セルフサインアップフロー開発"),
      bullet("権限管理・チーム設定機能"),

      h2("2026年12月"),
      bullet("マルチテナント化完成・テスト"),
      bullet("MyPitch専用マーケティングサイト本番公開"),
      bullet("Stripe決済連携"),
      bullet("日本で個人事業主として開業届提出"),

      h2("2027年1月"),
      bullet("クローズドβテスト（知人チーム3〜5チームで検証）"),
      bullet("フィードバック反映・バグ修正"),
      bullet("サポート体制構築（FAQ・問い合わせ）"),
      bullet("競合（サークルスクエア等）実機調査"),

      h2("2027年2月"),
      bullet("β版パブリックリリース（無料）"),
      bullet("SNS・サッカーコミュニティへの告知開始"),

      h2("2027年3月"),
      bullet("有料プラン開始"),
      bullet("継続的な機能改善"),

      h2("2027年後半"),
      bullet("フォーメーションビルダー完全版リリース"),
      bullet("海外日本人チームへの展開検討"),
    ]);

    // 2-3. 重要検討事項
    await createPage(bizPageId, "重要検討事項（税務・決済・法務）", "⚠️", [
      h1("重要検討事項"),
      divider(),

      h2("税務"),
      callout("ベトナム在住・日本事業収入という特殊ケースのため、日本の税理士への確認を強く推奨", "🚨"),
      bullet("日本の個人事業主として開業届提出が必要"),
      bullet("年間売上1,000万円以下は消費税免税"),
      bullet("個人チーム向けに絞ればインボイス登録当面不要"),
      bullet("ベトナム側：VAT（付加価値税10%）の申告可能性あり → 会計士に確認"),
      divider(),

      h2("決済"),
      bullet("推奨: Stripe（ベトナム法人でも利用可）"),
      bullet("Wise Business も国際送金・受取が安価で有効"),
      bullet("サブスクリプション課金・クレジットカード決済が自動化できる"),
      divider(),

      h2("個人情報保護"),
      bullet("日本のAPPI（個人情報保護法）対応が必要"),
      bullet("メンバーの氏名・生年月日・連絡先等を扱うため要整備"),
      bullet("プライバシーポリシーの作成が必須"),
      divider(),

      h2("競合比較の注意事項"),
      callout("サークルスクエア等の競合機能は実際に検証していない。対外公開前に必ず実機確認が必要。", "⚠️"),
    ]);

    // ============================================================
    // 3. 開発（親ページ）
    // ============================================================
    console.log("\n📁 開発 フォルダを作成中...");
    const devPageId = await createPage(PARENT_PAGE_ID, "開発", "💻", [
      h1("開発ドキュメント"),
      para("技術スタック・設計・開発ログをまとめています。"),
    ]);

    // 3-1. 技術スタック
    await createPage(devPageId, "技術スタック", "🔧", [
      h1("技術スタック"),
      divider(),

      h2("現在のSJFC構成"),
      bullet("フロントエンド: React + Vite"),
      bullet("データベース・認証: Supabase（PostgreSQL + Auth + Storage）"),
      bullet("ホスティング: Vercel（本番ドメイン saigonjapanfc.com、SSL対応済み）"),
      bullet("サーバー側処理: Vercel Serverless Functions"),
      divider(),

      h2("SJFCファイル構成"),
      bullet("src/App.jsx — メインアプリ"),
      bullet("src/supabase.js — Supabase接続設定"),
      bullet("src/pages/ — 各ページコンポーネント"),
      bullet("src/components/ — 共通コンポーネント"),
      divider(),

      h2("Supabaseテーブル一覧"),
      bullet("accounting_transactions — 会計取引"),
      bullet("announcements — お知らせ"),
      bullet("attendance — 出欠"),
      bullet("dues — 部費"),
      bullet("events — イベント・スケジュール"),
      bullet("goals — 得点記録"),
      bullet("jersey_sizes — ユニフォームサイズ"),
      bullet("masters — マスターデータ"),
      bullet("match_lineup_players — 試合メンバー"),
      bullet("match_lineups — 試合ラインナップ"),
      bullet("matches — 試合"),
      bullet("org_chart — 組織図"),
      bullet("profiles — メンバープロフィール"),
      bullet("sefa_standings — リーグ順位表"),
      bullet("sefa_top_scorers — 得点ランキング"),
      bullet("sponsors — スポンサー"),
      bullet("uniforms — ユニフォーム"),
      bullet("wallets — 財布（会計管理）"),
    ]);

    // 3-2. マルチテナント設計
    await createPage(devPageId, "マルチテナント設計", "🏗️", [
      h1("マルチテナント設計"),
      callout("SaaS化のための最大の技術課題。現状はSJFC専用の1テナント設計になっている。", "🚨"),
      divider(),

      h2("設計方針"),
      para("全テーブルにteam_idを追加する方式を採用。最もシンプルで確実な方法。"),
      divider(),

      h2("新規作成テーブル: teams"),
      bullet("id (uuid) — チームID"),
      bullet("name (text) — チーム名"),
      bullet("slug (text) — URLに使う識別子（例: sjfc）"),
      bullet("plan (text) — free / standard / pro"),
      bullet("owner_id (uuid) — オーナーのuser_id"),
      bullet("logo_url (text) — ロゴURL"),
      bullet("primary_color (text) — チームカラー"),
      bullet("created_at / updated_at"),
      divider(),

      h2("既存テーブルへの変更"),
      para("以下の全テーブルにteam_idカラムを追加:"),
      bullet("profiles / events / attendance / accounting_transactions"),
      bullet("wallets / matches / match_lineups / match_lineup_players"),
      bullet("announcements / sponsors / dues / goals"),
      bullet("uniforms / jersey_sizes / sefa_standings / sefa_top_scorers"),
      bullet("org_chart / masters"),
      divider(),

      h2("セキュリティ: RLS設定"),
      para("各テーブルに「自分のチームのデータしか見えない」ポリシーを設定する。"),
      divider(),

      h2("作業ステップ"),
      todo("Step 1: teamsテーブルを作成"),
      todo("Step 2: 全テーブルにteam_idを追加"),
      todo("Step 3: SJFCの既存データにteam_idを設定"),
      todo("Step 4: RLSポリシーを設定"),
      todo("Step 5: Reactコードのsupabase.jsを更新"),
      todo("Step 6: セルフサインアップ画面を作成"),
    ]);

    // 3-3. 開発ログ
    await createPage(devPageId, "開発ログ", "📅", [
      h1("開発ログ"),
      divider(),

      h2("2026年9月28日"),
      bullet("MyPitchプロジェクトキックオフ"),
      bullet("ブランドデザイン方針決定: グリーン×スポーティ"),
      bullet("ロゴ決定: A-3（横長ピッチ＋縦スタック）"),
      bullet("ランディングページ初稿完成"),
      bullet("マルチテナント設計方針確定: team_id追加方式"),
      bullet("SJFCコード構成確認（src/pages/ 14ページ、Supabase 18テーブル）"),
      bullet("Notion自動書き込み環境構築完了"),
    ]);

    // ============================================================
    // 4. デザイン
    // ============================================================
    console.log("\n📁 デザイン フォルダを作成中...");
    const designPageId = await createPage(PARENT_PAGE_ID, "デザイン", "🎨", [
      h1("デザインドキュメント"),
      para("ブランドガイドライン・ロゴ・LPデザインをまとめています。"),
    ]);

    // 4-1. ブランドガイドライン
    await createPage(designPageId, "ブランドガイドライン", "🎨", [
      h1("ブランドガイドライン"),
      divider(),

      h2("ブランドカラー"),
      bullet("メイングリーン: #00C853（ピッチグリーン）"),
      bullet("ダークグリーン: #00963D"),
      bullet("ブラック: #0A0A0A"),
      bullet("ホワイト: #FFFFFF"),
      bullet("グレー: #8A8A8A"),
      divider(),

      h2("タイポグラフィ"),
      bullet("見出し: Barlow Condensed（Bold/Black）— スポーティな力強さ"),
      bullet("本文: Noto Sans JP — 日本語の読みやすさ"),
      divider(),

      h2("デザインコンセプト"),
      bullet("スポーティ・ダイナミック（Nike/Adidasっぽい雰囲気）"),
      bullet("グリーン×ブラックの強いコントラスト"),
      bullet("大胆なタイポグラフィ・力強いレイアウト"),
    ]);

    // 4-2. ロゴ決定事項
    await createPage(designPageId, "ロゴ決定事項", "✏️", [
      h1("ロゴ決定事項"),
      divider(),

      callout("ロゴはA-3（横長ピッチ＋縦スタック）に決定", "✅"),
      divider(),

      h2("ロゴ仕様"),
      bullet("アイコン: 横長ピッチ俯瞰SVG（センターサークル・ゴールエリア付き）"),
      bullet("テキスト: 「My」グリーン(#00C853) + 「Pitch」ホワイト"),
      bullet("フォント: Barlow Condensed 900weight"),
      bullet("区切り: グリーングラデーションライン"),
      divider(),

      h2("選考経緯"),
      bullet("最初の候補: A（ピッチ俯瞰）/ B（六角形）/ C（シールド）/ D（サークル）/ E（ワードマーク）/ F（アーチ型）"),
      bullet("E（ワードマーク）を選択後、さらにE-1〜E-6でバリエーション検討"),
      bullet("最終的にA案に戻り、A-1〜A-6でバリエーション検討"),
      bullet("A-3（横長ピッチ＋縦スタック）に決定"),
    ]);

    // 4-3. LPデザイン
    await createPage(designPageId, "ランディングページ", "🖥️", [
      h1("ランディングページ"),
      divider(),

      h2("セクション構成"),
      bullet("ナビゲーション: ロゴ・機能・料金・導入事例・サポート・CTA"),
      bullet("ヒーロー: キャッチコピー・サブコピー・CTA・統計"),
      bullet("課題提起: よくある悩み4つ"),
      bullet("機能紹介: 6機能カード"),
      bullet("フォーメーションビルダー: 差別化機能ハイライト"),
      bullet("料金プラン: Free / スタンダード / Pro"),
      bullet("CTA: 無料で始めるボタン"),
      bullet("フッター"),
      divider(),

      h2("コピーライティング方針"),
      bullet("優しく・共感ベース・押しつけがましくない"),
      bullet("「〜ませんか？」「〜ありますよね」などの問いかけ調"),
      bullet("機能説明より体験・シーンを訴求"),
      divider(),

      h2("技術"),
      bullet("HTML/CSS/JS — 単一ファイル構成"),
      bullet("Vercelにデプロイ予定"),
      bullet("Google Fonts: Barlow Condensed + Noto Sans JP"),
    ]);

    // ============================================================
    // 5. タスク・アクションリスト
    // ============================================================
    console.log("\n📋 タスク・アクションリスト を作成中...");
    await createPage(PARENT_PAGE_ID, "タスク・アクションリスト", "📋", [
      h1("タスク・アクションリスト"),
      divider(),

      h2("🔴 最優先（今すぐ）"),
      todo("teamsテーブルをSupabaseに作成"),
      todo("全テーブルにteam_idを追加"),
      todo("SJFCの既存データにteam_idを設定"),
      todo("RLSポリシーを設定"),
      divider(),

      h2("🟡 今月中"),
      todo("セルフサインアップ画面を作成"),
      todo("マルチテナント化完成・テスト"),
      todo("Stripe決済連携"),
      todo("日本の税理士に相談（ベトナム在住・日本事業収入）"),
      divider(),

      h2("🟢 来月以降"),
      todo("MyPitch専用ドメイン取得（mypitch.jp等）"),
      todo("日本で個人事業主として開業届提出"),
      todo("クローズドβテスト（3〜5チーム）"),
      todo("競合（サークルスクエア等）実機調査・機能比較表更新"),
      todo("β版パブリックリリース（無料）"),
      todo("SNS・サッカーコミュニティへの告知"),
      todo("有料プラン開始"),
      divider(),

      h2("📌 継続タスク"),
      todo("開発ログを毎回更新する"),
      todo("Notionに決定事項を随時記録する"),
    ]);

    console.log("\n🎉 全ページの作成が完了しました！");
    console.log("📄 Notionを確認してください:");
    console.log(`   https://app.notion.com/p/MyPitch-${PARENT_PAGE_ID}`);

  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    if (error.code === "unauthorized") {
      console.error("トークンが正しくないか、ページへのアクセス権がありません。");
    }
    if (error.status === 400) {
      console.error("リクエストの形式に問題があります:", error.body);
    }
  }
}

main();