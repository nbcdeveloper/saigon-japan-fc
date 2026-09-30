import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID;
console.log("接続テスト中...");
notion.pages.retrieve({ page_id: PAGE_ID }).then(p => {
  console.log("✅ 接続成功！ページ名:", p.properties?.title?.title?.[0]?.text?.content ?? "取得OK");
}).catch(e => console.error("❌ エラー:", e.message));
