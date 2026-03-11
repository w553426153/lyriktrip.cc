#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import os
import re
import sqlite3
from pathlib import Path
from typing import Iterable, List, Tuple

try:
    from argostranslate import translate as ar_translate
except Exception as exc:
    raise SystemExit(
        "argostranslate is required. Install with: python -m pip install argostranslate"
    ) from exc

CHINESE_RE = re.compile(r"[\u4e00-\u9fff]")
URL_RE = re.compile(r"https?://\S+")
PURE_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)
NUMERIC_RE = re.compile(r"^\s*[\d.\-+/%（）()￥$¥,\s]+\s*$")
TIME_ONLY_RE = re.compile(r"^\s*\d{1,2}:\d{2}([\-~–]\d{1,2}:\d{2})?\s*$")

MD_SKIP_EXACT = {
    "行程主标题",
    "行程副标题",
    "价格",
    "封面图",
    "推荐理由",
    "行程简介",
    "核心亮点",
    "景点介绍",
    "游览要点",
    "观光亮点",
    "建筑亮点",
    "最佳拍照点",
    "餐厅背景",
    "推荐菜品",
}

MD_VALUE_PREFIXES = [
    "地址：",
    "开放时间：",
    "门票：",
    "建议游览时间：",
    "最佳游览季节：",
    "营业时间：",
    "人均消费：",
]


def has_chinese(text: str) -> bool:
    return bool(text and CHINESE_RE.search(text))


def should_translate_text(text: str) -> bool:
    if not text:
        return False
    if not has_chinese(text):
        return False
    if PURE_URL_RE.match(text.strip()):
        return False
    if NUMERIC_RE.match(text.strip()):
        return False
    if TIME_ONLY_RE.match(text.strip()):
        return False
    return True


def split_long_text(text: str, max_len: int = 1800) -> List[str]:
    if len(text) <= max_len:
        return [text]
    parts: List[str] = []
    buf = ""
    for chunk in re.split(r"([。！？!?；;\n])", text):
        if not chunk:
            continue
        if len(buf) + len(chunk) <= max_len:
            buf += chunk
            continue
        if buf:
            parts.append(buf)
        buf = chunk
    if buf:
        parts.append(buf)
    return parts


class Translator:
    def __init__(self, cache_path: Path) -> None:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(cache_path)
        self.conn.execute("CREATE TABLE IF NOT EXISTS t (src TEXT PRIMARY KEY, dst TEXT)")
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def translate(self, text: str) -> str:
        text = text.strip()
        if not should_translate_text(text):
            return text
        cached = self._get_cache(text)
        if cached is not None:
            return cached
        translated = self._translate_text(text)
        self._set_cache(text, translated)
        return translated

    def _get_cache(self, text: str) -> str | None:
        cur = self.conn.execute("SELECT dst FROM t WHERE src = ?", (text,))
        row = cur.fetchone()
        return row[0] if row else None

    def _set_cache(self, text: str, translated: str) -> None:
        self.conn.execute("INSERT OR REPLACE INTO t (src, dst) VALUES (?, ?)", (text, translated))
        self.conn.commit()

    def _translate_text(self, text: str) -> str:
        parts = split_long_text(text)
        out = []
        for part in parts:
            part = part.strip()
            if not part:
                continue
            out.append(ar_translate.translate(part, "zh", "en"))
        return "".join(out) if out else text


def translate_csv_file(path: Path, translator: Translator, overwrite: bool) -> None:
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with path.open("r", encoding="utf-8", newline="") as f_in, tmp_path.open(
        "w", encoding="utf-8", newline=""
    ) as f_out:
        reader = csv.reader(f_in)
        writer = csv.writer(f_out)
        for row_idx, row in enumerate(reader):
            if row_idx == 0:
                writer.writerow(row)
                continue
            out_row = []
            for cell in row:
                cell_text = cell.strip()
                if should_translate_text(cell_text):
                    out_row.append(translator.translate(cell_text))
                else:
                    out_row.append(cell)
            writer.writerow(out_row)
            if row_idx % 2000 == 0 and row_idx > 0:
                print(f"{path.name}: translated {row_idx} rows")
    if overwrite:
        tmp_path.replace(path)
    else:
        print(f"written: {tmp_path}")


def translate_md_lines(lines: Iterable[str], translator: Translator) -> List[str]:
    out: List[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            out.append(line)
            continue
        if stripped in MD_SKIP_EXACT:
            out.append(line)
            continue
        if stripped.startswith("📅 Day") or stripped.startswith("📍") or stripped.startswith("🚇") or stripped.startswith("🍜"):
            out.append(line)
            continue
        for prefix in MD_VALUE_PREFIXES:
            if stripped.startswith(prefix):
                value = stripped[len(prefix):].strip()
                if should_translate_text(value):
                    value = translator.translate(value)
                out.append(f"{prefix}{value}")
                break
        else:
            if should_translate_text(stripped):
                out.append(translator.translate(stripped))
            else:
                out.append(line)
    return out


def translate_md_file(path: Path, translator: Translator, overwrite: bool) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    translated = translate_md_lines(lines, translator)
    content = "\n".join(translated) + "\n"
    if overwrite:
        path.write_text(content, encoding="utf-8")
    else:
        out_path = path.with_suffix(path.suffix + ".en")
        out_path.write_text(content, encoding="utf-8")
        print(f"written: {out_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Translate data CSV/MD files to English.")
    parser.add_argument("--data-dir", default="data", help="Data directory.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite files in place.")
    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    cache_path = data_dir / ".cache" / "translation_cache.sqlite"
    translator = Translator(cache_path)

    try:
        csv_files = [
            data_dir / "attractions.csv",
            data_dir / "foods.csv",
            data_dir / "restaurants.csv",
            data_dir / "hotels.csv",
            data_dir / "全国景点数据.csv",
        ]
        for path in csv_files:
            if not path.exists():
                continue
            print(f"Translating CSV: {path.name}")
            translate_csv_file(path, translator, overwrite=args.overwrite)

        routes_dir = data_dir / "routes"
        if routes_dir.exists():
            md_files = sorted(routes_dir.glob("*.md"))
            for idx, md in enumerate(md_files, 1):
                print(f"Translating MD {idx}/{len(md_files)}: {md.name}")
                translate_md_file(md, translator, overwrite=args.overwrite)
    finally:
        translator.close()

    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
