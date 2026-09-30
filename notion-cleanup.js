import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID;
async function cleanup() {
  console.log("重複ページを確認中...");
  const response = await notion.blocks.children.list({ block_id: PAGE_ID });
  const pages = response.results.filter(b => b.type === "child_page");
  const titleMap = {};
  const duplicates = [];
  pages.forEach(p => {
    const title = p.child_page.title;
    if (titleMap[title]) { duplicates.push(p); } else { titleMap[title] = p; }
  });
  console.log("削除する重複:", duplicates.map(p => p.child_page.title));
  for (const page of duplicates) {
    await notion.blocks.delete({ block_id: page.id });
    console.log("削除完了:", page.child_page.title);
  }
  console.log("クリーンアップ完了！");
}
cleanup().catch(e => console.error("エラー:", e.message));
