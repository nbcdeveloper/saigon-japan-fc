#!/usr/bin/env python3
"""
SJFCページにteam_idフィルターを自動追加するスクリプト
使い方: python add_team_id.py C:\NightBird\mypitch\src
"""

import os
import sys
import re

# team_idフィルターを追加するテーブル一覧
TABLES_WITH_TEAM_ID = [
    'events', 'profiles', 'attendance', 'matches', 'goals',
    'announcements', 'sponsors', 'wallets', 'accounting_transactions',
    'dues', 'match_lineups', 'match_lineup_players', 'uniforms',
    'jersey_sizes', 'sefa_standings', 'sefa_top_scorers',
    'org_chart', 'masters'
]

def add_team_id_to_file(filepath, team_id_var='teamId'):
    """ファイルにteam_idフィルターを追加"""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    
    # 既にteam_idが含まれている場合はスキップ
    if 'team_id' in content and '.eq(\'team_id\'' in content:
        return False, "already has team_id"
    
    # profileのprops追加
    # "export default function Xxx()" -> "export default function Xxx({ profile })"
    # ただし既に引数がある場合はprofileを追加
    def add_profile_prop(match):
        func_sig = match.group(0)
        if 'profile' in func_sig:
            return func_sig
        if '()' in func_sig:
            return func_sig.replace('()', '({ profile })')
        elif '({' in func_sig:
            return func_sig.replace('({', '({ profile,')
        return func_sig
    
    content = re.sub(
        r'export default function \w+\([^)]*\)',
        add_profile_prop,
        content
    )
    
    # team_id取得コードをuseEffect/useState後に追加
    team_id_code = "\n  const teamId = profile?.team_id || window.__teamId\n"
    
    # useStateやuseEffectの後にteamId変数を追加
    if 'const teamId' not in content:
        # useEffectの直前に追加
        content = re.sub(
            r'(  useEffect\()',
            team_id_code + r'\1',
            content,
            count=1
        )
    
    # .from('table').select() に .eq('team_id', teamId) を追加
    for table in TABLES_WITH_TEAM_ID:
        # .from('events') パターンを検索して team_id フィルターを追加
        pattern = rf"(supabase\.from\('{table}'\)(?:\s*\n\s*)?\.select\([^)]*\))"
        replacement = rf"\1\n        .eq('team_id', teamId)"
        content = re.sub(pattern, replacement, content)
        
        # .from("events") ダブルクォートパターン
        pattern = rf'(supabase\.from\("{table}"\)(?:\s*\n\s*)?\.select\([^)]*\))'
        replacement = rf"\1\n        .eq('team_id', teamId)"
        content = re.sub(pattern, replacement, content)
    
    # insert時にteam_idを追加
    # .insert({ ... }) に team_id: teamId を追加
    # これは複雑なので基本的なパターンのみ
    content = re.sub(
        r'(\.insert\(\{)',
        r'\1 team_id: teamId,',
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "updated"
    return False, "no changes"


def process_directory(src_dir):
    """ディレクトリ内の全jsxファイルを処理"""
    pages_dir = os.path.join(src_dir, 'pages')
    
    if not os.path.exists(pages_dir):
        print(f"Error: {pages_dir} not found")
        return
    
    results = []
    for filename in os.listdir(pages_dir):
        if filename.endswith(('.jsx', '.js')) and filename not in ['Login.jsx', 'Login.js', 'Register.jsx', 'Register.js']:
            filepath = os.path.join(pages_dir, filename)
            changed, reason = add_team_id_to_file(filepath)
            results.append((filename, changed, reason))
            print(f"  {'✓' if changed else '-'} {filename}: {reason}")
    
    print(f"\n完了: {sum(1 for _, c, _ in results if c)}/{len(results)} ファイルを更新")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("使い方: python add_team_id.py <src_dir>")
        print("例: python add_team_id.py C:/NightBird/mypitch/src")
        sys.exit(1)
    
    src_dir = sys.argv[1]
    print(f"処理ディレクトリ: {src_dir}")
    process_directory(src_dir)
