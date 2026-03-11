#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional, Tuple
from xml.etree import ElementTree as ET


DAY_RE = re.compile(r"^第\s*(\d+)\s*天\s*(.*)$")
DAY_FALLBACK_RE = re.compile(r"^D\s*(\d+)\b", re.IGNORECASE)
ATTRACTION_RE = re.compile(r"^景点\s*[·•:：]\s*(.+)$")
TIME_RE = re.compile(r"(?<!\d)(\d{1,2})[:：](\d{2})(?!\d)")
PRICE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(元|人民币|美金|美元|USD|RMB)")

IGNORE_PREFIXES = (
    "早餐",
    "午餐",
    "晚餐",
    "推荐餐厅",
    "温馨提示",
    "提示",
    "特别提醒",
    "重要提示",
    "接待标准",
    "费用说明",
    "费用包含",
    "费用不包含",
    "预订须知",
    "出行须知",
    "产品特色",
    "交通信息",
    "住宿",
    "行程附注",
    "价格说明",
    "差价说明",
    "拼团说明",
    "成团通知",
    "出团通知",
    "意见反馈",
    "活动说明",
    "途牛服务号",
    "更多优质线路",
)

STOP_SECTION_PREFIXES = (
    "行程附注",
    "费用说明",
    "费用包含",
    "费用不包含",
    "预订须知",
    "出行须知",
    "价格说明",
    "差价说明",
    "拼团说明",
    "成团通知",
    "出团通知",
    "意见反馈",
    "活动说明",
    "途牛服务号",
    "更多优质线路",
)


@dataclass
class AttractionBlock:
    idx: int
    name: str
    lines: List[str] = field(default_factory=list)


@dataclass
class DayBlock:
    start_idx: int
    day_number: int
    day_title: str
    lines: List[str]


def extract_docx_lines(path: Path) -> List[str]:
    with zipfile.ZipFile(path) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    lines: List[str] = []
    for p in root.findall(".//w:p", ns):
        texts = []
        for t in p.findall(".//w:t", ns):
            texts.append(t.text or "")
        text = "".join(texts).strip()
        if not text:
            continue
        lines.append(normalize_line(text))
    return lines


def normalize_line(text: str) -> str:
    text = text.replace("\u3000", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def detect_title(lines: Iterable[str], fallback: str) -> str:
    best_line = ""
    best_score = -1
    for line in lines:
        if any(line.startswith(prefix) for prefix in IGNORE_PREFIXES):
            continue
        if "产品ID" in line:
            continue
        if "活动名称" in line or "活动描述" in line:
            continue
        if line.startswith("【") and line.endswith("】") and "天" not in line and "日" not in line:
            continue

        score = 0
        if "丨" in line or "|" in line:
            score += 3
        if "<" in line and ">" in line:
            score += 2
        if "天" in line or "日" in line:
            score += 2
        if "游" in line or "团" in line or "行程" in line:
            score += 2
        if "自由行" in line:
            score += 1
        if len(line) > 120:
            score -= 2
        if line.startswith("【") and line.endswith("】"):
            score -= 2

        if score > best_score:
            best_score = score
            best_line = line

    return best_line if best_line else fallback


def detect_price_raw(lines: Iterable[str]) -> Optional[str]:
    for line in lines:
        compact = line.replace(" ", "")
        if len(compact) > 40:
            continue
        if "价格" not in compact and "起价" not in compact and "团费" not in compact and "售价" not in compact:
            continue
        if "优惠" in compact or "立减" in compact:
            continue
        m = PRICE_RE.search(compact)
        if m:
            value, unit = m.groups()
            return f"{value}{unit}"
    return None


def find_day_blocks(lines: List[str]) -> List[DayBlock]:
    markers: List[Tuple[int, int, str]] = []
    for idx, line in enumerate(lines):
        m = DAY_RE.match(line)
        if m:
            day_num = int(m.group(1))
            day_title = m.group(2).strip()
            markers.append((idx, day_num, day_title))

    if not markers:
        for idx, line in enumerate(lines):
            m = DAY_FALLBACK_RE.match(line)
            if m:
                day_num = int(m.group(1))
                markers.append((idx, day_num, ""))

    # Deduplicate by day number, keep the first occurrence.
    seen = set()
    uniq: List[Tuple[int, int, str]] = []
    for idx, day_num, title in markers:
        if day_num in seen:
            continue
        seen.add(day_num)
        uniq.append((idx, day_num, title))

    uniq.sort(key=lambda x: x[0])
    blocks: List[DayBlock] = []
    for i, (idx, day_num, title) in enumerate(uniq):
        next_idx = uniq[i + 1][0] if i + 1 < len(uniq) else len(lines)
        day_lines = lines[idx:next_idx]
        blocks.append(DayBlock(start_idx=idx, day_number=day_num, day_title=title, lines=day_lines))
    return blocks


def extract_times(lines: List[str]) -> List[Tuple[int, str]]:
    times: List[Tuple[int, str]] = []
    for idx, line in enumerate(lines):
        for m in TIME_RE.finditer(line):
            hour = int(m.group(1))
            minute = int(m.group(2))
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                times.append((idx, f"{hour:02d}:{minute:02d}"))
    return times


def parse_duration_minutes(line: str) -> Optional[int]:
    if "小时" not in line and "分钟" not in line:
        return None
    hours = 0.0
    minutes = 0
    hm = re.search(r"(\d+(?:\.\d+)?)\s*小时", line)
    if hm:
        hours = float(hm.group(1))
    mm = re.search(r"(\d+)\s*分钟", line)
    if mm:
        minutes = int(mm.group(1))
    total = int(round(hours * 60 + minutes))
    return total if total > 0 else None


def add_minutes(hhmm: str, minutes: int) -> str:
    h, m = map(int, hhmm.split(":"))
    total = (h * 60 + m + minutes) % (24 * 60)
    return f"{total // 60:02d}:{total % 60:02d}"


def find_local_times(times: List[Tuple[int, str]], block_idx: int, window: int = 8) -> Tuple[Optional[str], Optional[str]]:
    if not times:
        return None, None
    before = [t for idx, t in times if idx < block_idx and block_idx - idx <= window]
    after = [t for idx, t in times if idx > block_idx and idx - block_idx <= window]
    return (before[-1] if before else None, after[0] if after else None)


def parse_attraction_header(text: str) -> Tuple[str, Optional[str]]:
    duration_text = None
    duration_match = re.search(r"(游玩时长|建议时间)\s*[:：]?\s*([^，,；;]+)", text)
    if duration_match:
        duration_text = duration_match.group(2).strip()
        text = text[: duration_match.start()].strip()
    text = text.replace("游玩时长", " ").strip()
    text = re.split(r"游玩时长|建议时间", text)[0].strip()
    text = re.sub(r"[：:]\s*约?\d+.*$", "", text).strip()
    return text, duration_text


def split_attraction_blocks(day_lines: List[str]) -> List[AttractionBlock]:
    blocks: List[AttractionBlock] = []
    indices = []
    for idx, line in enumerate(day_lines):
        m = ATTRACTION_RE.match(line)
        if m:
            name, duration_text = parse_attraction_header(m.group(1))
            indices.append((idx, name, duration_text))

    for i, (idx, name, duration_text) in enumerate(indices):
        next_idx = indices[i + 1][0] if i + 1 < len(indices) else len(day_lines)
        block_lines = day_lines[idx + 1:next_idx]
        block = AttractionBlock(idx=idx, name=name, lines=block_lines)
        if duration_text:
            block.lines.insert(0, f"建议游览时间：{duration_text}")
        blocks.append(block)
    return blocks


def is_ignorable(line: str) -> bool:
    if not line:
        return True
    if line.startswith("【关于"):
        return True
    if line.strip() in ("景点介绍",):
        return True
    if any(line.startswith(prefix) for prefix in IGNORE_PREFIXES):
        return True
    if DAY_RE.match(line) or DAY_FALLBACK_RE.match(line):
        return True
    compact = line.replace(" ", "")
    if re.fullmatch(r"[0-9:]+", compact) and ":" in compact:
        return True
    if TIME_RE.fullmatch(compact):
        return True
    if TIME_RE.search(line):
        stripped = TIME_RE.sub("", compact)
        if stripped == "":
            return True
    return False


def summarize_day_subtitle(names: List[str]) -> str:
    if not names:
        return "自由活动"
    return " -> ".join(names[:4])


def build_markdown_for_docx(path: Path, overwrite: bool) -> Optional[Path]:
    lines = extract_docx_lines(path)
    if not lines:
        return None

    day_blocks = find_day_blocks(lines)
    if not day_blocks:
        return None

    header_lines = lines[: day_blocks[0].start_idx]
    route_name = detect_title(header_lines, path.stem)
    route_alias = None
    price_raw = detect_price_raw(header_lines + lines)

    md_lines: List[str] = []
    md_lines.append("行程主标题")
    md_lines.append(route_name)
    if route_alias:
        md_lines.append("行程副标题")
        md_lines.append(route_alias)
    if price_raw:
        md_lines.append("价格")
        md_lines.append(price_raw)
    md_lines.append("")

    for day in day_blocks:
        trimmed_lines = day.lines
        for idx, line in enumerate(trimmed_lines):
            m = DAY_FALLBACK_RE.match(line)
            if m and int(m.group(1)) != day.day_number:
                trimmed_lines = trimmed_lines[:idx]
                break
        for idx, line in enumerate(trimmed_lines):
            if any(line.startswith(prefix) for prefix in STOP_SECTION_PREFIXES):
                trimmed_lines = trimmed_lines[:idx]
                break

        day_title = day.day_title or f"Day {day.day_number}"
        attraction_blocks = split_attraction_blocks(trimmed_lines)
        attraction_names = [b.name for b in attraction_blocks if b.name]
        day_subtitle = summarize_day_subtitle(attraction_names)

        md_lines.append(f"📅 Day {day.day_number}: {day_title}")
        md_lines.append(day_subtitle)
        md_lines.append("")

        fallback_start = "09:00"
        fallback_step = 120
        times = extract_times(trimmed_lines)

        if not attraction_blocks:
            description = "\n".join([l for l in trimmed_lines if not is_ignorable(l)])
            start = fallback_start
            end = add_minutes(start, 240)
            md_lines.append(f"📍 {start}-{end} | 自由活动")
            if description:
                md_lines.append("景点介绍")
                md_lines.extend(description.split("\n"))
            md_lines.append("")
            continue

        for idx, block in enumerate(attraction_blocks):
            duration = None
            address = None
            opening_hours = None
            ticket_price = None
            suggested = None
            best_season = None
            description_lines: List[str] = []

            for line in block.lines:
                if "游玩时长" in line or "建议时间" in line or "建议游览时间" in line:
                    duration = parse_duration_minutes(line) or duration
                    if "：" in line:
                        suggested = line.split("：", 1)[1].strip() or suggested
                    continue
                if line.startswith("地址") and "：" in line:
                    address = line.split("：", 1)[1].strip()
                    continue
                if line.startswith("开放时间") and "：" in line:
                    opening_hours = line.split("：", 1)[1].strip()
                    continue
                if line.startswith("门票") and "：" in line:
                    ticket_price = line.split("：", 1)[1].strip()
                    continue
                if line.startswith("建议游览时间") and "：" in line:
                    suggested = line.split("：", 1)[1].strip()
                    continue
                if line.startswith("最佳游览季节") and "：" in line:
                    best_season = line.split("：", 1)[1].strip()
                    continue
                if is_ignorable(line):
                    continue
                description_lines.append(line)

            block_times = [t for _, t in extract_times(block.lines)]
            if block_times:
                start_time = block_times[0]
                end_time = block_times[-1] if len(block_times) > 1 else None
            else:
                local_before, local_after = find_local_times(times, block.idx)
                if local_before:
                    start_time = local_before
                    end_time = local_after
                else:
                    start_time = add_minutes(fallback_start, fallback_step * idx)
                    end_time = None

            if not start_time:
                start_time = add_minutes(fallback_start, fallback_step * idx)

            if duration and start_time and (end_time is None or end_time == start_time):
                end_time = add_minutes(start_time, duration)

            if end_time is None:
                end_time = add_minutes(start_time, fallback_step)

            md_lines.append(f"📍 {start_time}-{end_time} | {block.name}")
            if address:
                md_lines.append(f"地址：{address}")
            if opening_hours:
                md_lines.append(f"开放时间：{opening_hours}")
            if ticket_price:
                md_lines.append(f"门票：{ticket_price}")
            if suggested:
                md_lines.append(f"建议游览时间：{suggested}")
            if best_season:
                md_lines.append(f"最佳游览季节：{best_season}")
            if description_lines:
                md_lines.append("景点介绍")
                md_lines.extend(description_lines)
            md_lines.append("")

    out_path = path.with_suffix(".md")
    if out_path.exists() and not overwrite:
        return None
    out_path.write_text("\n".join(md_lines).strip() + "\n", encoding="utf-8")
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert routes .docx files into markdown itineraries.")
    parser.add_argument("--routes-dir", default="data/routes", help="Routes directory containing .docx files.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing .md files.")
    args = parser.parse_args()

    routes_dir = Path(args.routes_dir).resolve()
    if not routes_dir.exists():
        print(f"routes dir not found: {routes_dir}")
        return 1

    docx_files = sorted(routes_dir.glob("*.docx"))
    if not docx_files:
        print("no .docx files found")
        return 0

    converted = 0
    skipped = 0
    failed = 0

    for docx in docx_files:
        try:
            out = build_markdown_for_docx(docx, args.overwrite)
            if out is None:
                skipped += 1
                continue
            converted += 1
            print(f"converted: {docx.name} -> {out.name}")
        except Exception as exc:
            failed += 1
            print(f"failed: {docx.name} ({exc})")

    print(f"done. converted={converted} skipped={skipped} failed={failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
