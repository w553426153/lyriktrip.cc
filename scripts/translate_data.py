#!/usr/bin/env python3
import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib import request, error

API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b"

HAN_RE = re.compile(r"[\u4e00-\u9fff]")

DATA_HEADER_MAPS = {
    "attractions.csv": {
        "景点名称（中文）": "Attraction Name (Local)",
        "景点名称（英文）": "Attraction Name (English)",
        "景点名称": "Attraction Name",
        "省": "Province",
        "市": "City",
        "区": "District",
        "地址": "Address",
        "经度": "Longitude",
        "纬度": "Latitude",
        "景区分类": "Category",
        "附近交通": "Nearby Transport",
        "开放时间": "Opening Hours",
        "门票价格": "Ticket Price",
        "购票方式": "Ticket Purchase",
        "建议游览时长": "Suggested Duration",
        "最佳游览日期": "Best Visit Date",
        "景区介绍": "Introduction",
        "适合人群": "Suitable For",
        "景区卖点": "Selling Points",
        "景点照片": "Attraction Photos",
    },
    "foods.csv": {
        "菜品名称": "Dish Name",
        "菜品照片": "Dish Photo",
        "餐品简介": "Dish Description",
        "推荐餐厅": "Recommended Restaurant",
        "餐厅地址": "Restaurant Address",
        "联系电话": "Phone",
        "经度": "Longitude",
        "纬度": "Latitude",
        "附近交通": "Nearby Transport",
        "开放时间": "Opening Hours",
        "必吃指数": "Must-Try Index",
        "人均消费": "Avg Cost",
        "排队情况": "Queue Status",
        "附近景点": "Nearby Attractions",
    },
    "restaurants.csv": {
        "餐厅名称": "Restaurant Name",
        "餐厅图片": "Restaurant Photo",
        "餐厅照片": "Restaurant Photo",
        "菜品类型": "Cuisine Type",
        "推荐菜品": "Recommended Dishes",
        "餐厅地址": "Restaurant Address",
        "经度": "Longitude",
        "纬度": "Latitude",
        "附近交通": "Nearby Transport",
        "餐厅电话": "Phone",
        "开放时间": "Opening Hours",
        "必吃指数": "Must-Try Index",
        "人均消费": "Avg Cost",
        "排队情况": "Queue Status",
        "附近景点": "Nearby Attractions",
    },
    "全国景点数据.csv": {
        "景点名称": "Attraction Name",
        "所属省份": "Province",
        "所属地级市": "City",
        "所属区县": "District",
        "所属区域": "Region",
        "详细地址": "Address",
        "经度": "Longitude",
        "纬度": "Latitude",
        "景区分类": "Category",
        "核心分类": "Core Category",
        "主题标签": "Theme Tags",
        "景区等级": "Scenic Level",
        "附近交通": "Nearby Transport",
        "开放时间": "Opening Hours",
        "门票价格": "Ticket Price",
        "是否收费": "Fee Type",
        "购票方式": "Ticket Purchase",
        "建议游览时长": "Suggested Duration",
        "最佳游览月份": "Best Visit Months",
        "适合人群": "Suitable For",
        "景区介绍": "Introduction",
        "景区卖点": "Selling Points",
        "景点照片URL": "Photo URL",
    },
}

ROUTE_REPLACEMENTS = [
    (r"^行程主标题\s*$", "Main Itinerary Title"),
    (r"^行程副标题\s*$", "Itinerary Subtitle"),
    (r"^价格\s*$", "Price"),
    (r"^推荐理由\s*$", "Why We Recommend"),
    (r"^行程简介\s*$", "Itinerary Overview"),
    (r"^核心亮点\s*$", "Key Highlights"),
    (r"^景点介绍\s*$", "Attraction Overview"),
    (r"^游览要点\s*$", "Visit Highlights"),
    (r"^观光亮点\s*$", "Sight Highlights"),
    (r"^建筑亮点\s*$", "Architecture Highlights"),
    (r"^最佳拍照点\s*$", "Best Photo Spots"),
    (r"^餐厅背景\s*$", "Restaurant Background"),
    (r"^推荐菜品\s*$", "Recommended Dishes"),
    (r"建议游览时间：", "Suggested Duration: "),
    (r"最佳游览季节：", "Best Season: "),
    (r"地址：", "Address: "),
    (r"开放时间：", "Opening Hours: "),
    (r"门票：", "Ticket: "),
    (r"出发地点：", "Departure Location: "),
    (r"上车地点：", "Pickup Location: "),
    (r"下车地点：", "Drop-off Location: "),
    (r"到达地点：", "Arrival Location: "),
    (r"餐厅名称：", "Restaurant Name: "),
    (r"人均消费：", "Avg Cost: "),
    (r"必吃指数：", "Must-Try Index: "),
    (r"排队情况：", "Queue Status: "),
    (r"联系电话：", "Phone: "),
    (r"营业时间：", "Business Hours: "),
]

TRANSPORT_HEADER_RE = re.compile(r"(\b交通：)")


def has_han(text: str) -> bool:
    return bool(HAN_RE.search(text or ""))


def log(msg: str):
  ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  print(f"[{ts}] {msg}", file=sys.stderr)


def chunk_by_chars(items, max_chars=3000):
    batch = []
    count = 0
    for item in items:
        size = len(item)
        if batch and count + size > max_chars:
            yield batch
            batch = []
            count = 0
        batch.append(item)
        count += size
    if batch:
        yield batch


def parse_json_array(text: str):
  if not text:
    return None
  text = text.strip()
  if text.startswith('```'):
    text = text.strip('`').strip()
  if text.startswith("[") and text.endswith("]"):
    try:
      return json.loads(text)
    except json.JSONDecodeError:
      pass
  # Try to extract the first JSON array in the response.
  start = text.find("[")
  end = text.rfind("]")
  if start != -1 and end != -1 and end > start:
    snippet = text[start : end + 1]
    try:
      return json.loads(snippet)
    except json.JSONDecodeError:
      return None
  return None


def build_marked_payload(items):
  parts = []
  for i, item in enumerate(items, 1):
    parts.append(f"<<<ITEM {i}>>>\n{item}\n<<<END ITEM {i}>>>")
  return "\n".join(parts)


def build_json_payload(items):
  return json.dumps(items, ensure_ascii=False)


def parse_marked_response(text: str, count: int):
  if not text:
    return None
  pattern = re.compile(r"<<<ITEM\\s+(\\d+)>>>\\s*\\n?(.*?)\\n?<<<END ITEM\\s+\\1>>>", re.S)
  matches = list(pattern.finditer(text))
  if not matches:
    return None
  out = [None] * count
  for m in matches:
    idx = int(m.group(1)) - 1
    if idx < 0 or idx >= count:
      continue
    out[idx] = m.group(2).strip()
  if any(v is None for v in out):
    return None
  return out


def call_api(api_key: str, model: str, messages, max_tokens=2500, temperature=0.1, timeout=60):
  payload = {
    "model": model,
    "messages": messages,
    "temperature": temperature,
    "max_tokens": max_tokens,
    "chat_template_kwargs": {"enable_thinking": False},
  }
  data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
  req = request.Request(
    API_URL,
    data=data,
    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    method="POST",
  )
  with request.urlopen(req, timeout=timeout) as resp:
    raw = resp.read().decode("utf-8")
  return json.loads(raw)


def translate_single(
    api_key: str,
    model: str,
    text: str,
    context_hint: str,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
  system_prompt = (
    "You are a professional translator. Translate Chinese to English. "
    "Do not translate text that is already English. Preserve emojis, numbers, dates, times, URLs, "
    "file paths, and markdown syntax. Keep punctuation and line breaks exactly. "
    "Return only the translated text with no extra commentary."
  )
  if context_hint:
    system_prompt += f" Context: {context_hint}."

  messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": text},
  ]

  for attempt in range(max_retries):
    try:
      res = call_api(api_key, model, messages, max_tokens=max_tokens, timeout=timeout)
      content = res.get("choices", [{}])[0].get("message", {}).get("content", "")
      return content.strip()
    except Exception as exc:
      log(f"[warn] API attempt {attempt + 1}/{max_retries} failed: {type(exc).__name__}: {exc}")
      if attempt == max_retries - 1:
        if fail_fast:
          raise
        return text
      time.sleep(2 * (attempt + 1))


def translate_batch(
    api_key: str,
    model: str,
    items,
    context_hint: str,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
  if not items:
    return []
  if len(items) == 1:
    return [translate_single(api_key, model, items[0], context_hint, timeout, max_retries, fail_fast, max_tokens)]
  system_prompt = (
    "You are a professional translator. Translate Chinese to English. "
    "Do not translate text that is already English. Preserve emojis, numbers, dates, times, URLs, "
    "file paths, and markdown syntax. Keep punctuation and line breaks exactly. "
    "Return ONLY a valid JSON array of strings with the same length and order as the input."
  )
  if context_hint:
    system_prompt += f" Context: {context_hint}."

  user_content = build_json_payload(items)
  messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": user_content},
  ]

  last_err = None
  for attempt in range(max_retries):
    try:
      res = call_api(api_key, model, messages, max_tokens=max_tokens, timeout=timeout)
      content = res.get("choices", [{}])[0].get("message", {}).get("content", "")
      arr = parse_json_array(content)
      if not arr:
        arr = parse_marked_response(content, len(items))
      if isinstance(arr, list) and len(arr) == len(items):
        return ["" if v is None else str(v) for v in arr]
      snippet = content.replace("\n", "\\n")[:300]
      raise RuntimeError(f"Invalid translation response format: {snippet}")
    except Exception as exc:
      log(f"[warn] API batch attempt {attempt + 1}/{max_retries} failed: {type(exc).__name__}: {exc}")
      last_err = exc
      if attempt == max_retries - 1:
        break
      time.sleep(2 * (attempt + 1))

  if len(items) > 1:
    mid = len(items) // 2
    log(f"[warn] Batch failed; splitting into {mid} + {len(items) - mid} items")
    left = translate_batch(api_key, model, items[:mid], context_hint, timeout, max_retries, fail_fast, max_tokens)
    right = translate_batch(api_key, model, items[mid:], context_hint, timeout, max_retries, fail_fast, max_tokens)
    return left + right

  if fail_fast and last_err:
    raise last_err
  return [items[0]]


def translate_strings(
    api_key: str,
    model: str,
    strings,
    context_hint: str,
    batch_chars: int,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
  outputs = list(strings)
  idxs = [i for i, s in enumerate(strings) if has_han(s)]
  if not idxs:
    return outputs
  to_translate = [strings[i] for i in idxs]
  translated = []
  total = len(to_translate)
  done = 0
  batches = list(chunk_by_chars(to_translate, max_chars=batch_chars))
  total_batches = len(batches)
  for i, batch in enumerate(batches, 1):
    translated.extend(translate_batch(api_key, model, batch, context_hint, timeout, max_retries, fail_fast, max_tokens))
    done += len(batch)
    log(f"[progress] {context_hint}: {done}/{total} items (batch {i}/{total_batches})")
  if len(translated) != len(to_translate):
    translated = []
    done = 0
    for item in to_translate:
      translated.extend(translate_batch(api_key, model, [item], context_hint, timeout, max_retries, fail_fast, max_tokens))
      done += 1
      log(f"[progress] {context_hint}: {done}/{total} items (single)")
  if len(translated) != len(to_translate):
    translated = to_translate
  for i, new_val in zip(idxs, translated):
    outputs[i] = new_val
  return outputs


def translate_csv_file(
    api_key: str,
    model: str,
    src_path: Path,
    dst_path: Path,
    batch_chars: int,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
    header_map = DATA_HEADER_MAPS.get(src_path.name, {})
    with src_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return

    raw_header = rows[0]
    header = [header_map.get(h, h) for h in raw_header]

    # Build a column-wise list of values to translate.
    cache = {}

    def translate_value(val: str) -> str:
        if not val or not has_han(val):
            return val
        if val in cache:
            return cache[val]
        cache[val] = None
        return val

    # First pass: collect unique values needing translation.
    for row in rows[1:]:
        for val in row:
            translate_value(val)

    pending = [v for v, t in cache.items() if t is None]
    log(f"[translate] CSV {src_path.name}: {len(pending)} unique strings (rows {len(rows) - 1})")
    if pending:
      translated = translate_strings(api_key, model, pending, "CSV cell values", batch_chars, timeout, max_retries, fail_fast, max_tokens)
      for original, new_val in zip(pending, translated):
        cache[original] = new_val

    # Second pass: apply translations.
    out_rows = [header]
    for row in rows[1:]:
        out_rows.append([cache.get(val, val) if has_han(val) else val for val in row])

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with dst_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(out_rows)


def apply_route_replacements(line: str) -> str:
    out = line
    for pattern, repl in ROUTE_REPLACEMENTS:
        out = re.sub(pattern, repl, out)
    out = TRANSPORT_HEADER_RE.sub("Transport:", out)
    return out


def translate_markdown_file(
    api_key: str,
    model: str,
    src_path: Path,
    dst_path: Path,
    is_route: bool,
    batch_chars: int,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
    log(f"[translate] Markdown {'route' if is_route else 'doc'}: {src_path.name}")
    text = src_path.read_text(encoding="utf-8")
    lines = text.replace("\r\n", "\n").split("\n")

    processed = []
    for line in lines:
        next_line = apply_route_replacements(line) if is_route else line
        processed.append(next_line)

    idxs = [i for i, l in enumerate(processed) if has_han(l)]
    log(f"[info] Markdown {src_path.name}: {len(idxs)} lines to translate")
    if idxs:
        to_translate = [processed[i] for i in idxs]
        translated = translate_strings(api_key, model, to_translate, "Markdown line", batch_chars, timeout, max_retries, fail_fast, max_tokens)
        for i, new_val in zip(idxs, translated):
            processed[i] = new_val

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    dst_path.write_text("\n".join(processed), encoding="utf-8")


def protect_api_key(text: str):
    m = re.search(r"Bearer\s+([A-Za-z0-9_\-]+)", text)
    if not m:
        return text, None
    key = m.group(1)
    return text.replace(key, "__API_KEY__"), key


def restore_api_key(text: str, key: str | None):
    if not key:
        return text
    return text.replace("__API_KEY__", key)


def translate_markdown_with_key_protection(
    api_key: str,
    model: str,
    src_path: Path,
    dst_path: Path,
    is_route: bool,
    batch_chars: int,
    timeout: int,
    max_retries: int,
    fail_fast: bool,
    max_tokens: int,
):
    log(f"[translate] Markdown {'route' if is_route else 'doc'}: {src_path.name}")
    raw = src_path.read_text(encoding="utf-8")
    masked, key = protect_api_key(raw)

    lines = masked.replace("\r\n", "\n").split("\n")
    processed = []
    for line in lines:
        next_line = apply_route_replacements(line) if is_route else line
        processed.append(next_line)

    idxs = [i for i, l in enumerate(processed) if has_han(l)]
    if idxs:
        to_translate = [processed[i] for i in idxs]
        translated = translate_strings(api_key, model, to_translate, "Markdown line", batch_chars, timeout, max_retries, fail_fast, max_tokens)
        for i, new_val in zip(idxs, translated):
            processed[i] = new_val

    out = "\n".join(processed)
    out = restore_api_key(out, key)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    dst_path.write_text(out, encoding="utf-8")


def find_data_files(data_dir: Path):
    files = []
    for p in data_dir.iterdir():
        if p.is_dir():
            continue
        if p.suffix.lower() in {".md", ".csv"}:
            files.append(p)
    return files


def find_route_markdowns(routes_dir: Path):
    if not routes_dir.exists():
        return []
    return [p for p in routes_dir.iterdir() if p.is_file() and p.suffix.lower() == ".md"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--out-dir", default="data_translated")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--batch-chars", type=int, default=2000)
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--max-tokens", type=int, default=4000)
    parser.add_argument("--fail-fast", action="store_true")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--only", action="append", default=[])
    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    routes_dir = data_dir / "routes"
    out_dir = Path(args.out_dir).resolve()
    if out_dir == data_dir:
        print("ERROR: --out-dir must be different from --data-dir to avoid overwrite.", file=sys.stderr)
        sys.exit(1)
    out_dir.mkdir(parents=True, exist_ok=True)
    log(f"[config] data_dir={data_dir}")
    log(f"[config] out_dir={out_dir}")
    log(f"[config] model={args.model}")
    log(f"[config] batch_chars={args.batch_chars}")
    log(f"[config] timeout={args.timeout}s")
    log(f"[config] max_retries={args.max_retries}")
    log(f"[config] max_tokens={args.max_tokens}")
    log(f"[config] fail_fast={args.fail_fast}")
    log(f"[config] skip_existing={args.skip_existing}")

    api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("NVAPI_KEY")
    if not api_key:
        api_doc = data_dir / "翻译API.md"
        if api_doc.exists():
            text = api_doc.read_text(encoding="utf-8")
            m = re.search(r"Bearer\s+([A-Za-z0-9_\-]+)", text)
            api_key = m.group(1) if m else None

    if not api_key:
        print("ERROR: NVIDIA_API_KEY (or NVAPI_KEY) is required.", file=sys.stderr)
        sys.exit(1)

    only = set([o.strip() for o in args.only if o.strip()])

    # Translate data/*.csv and data/*.md (excluding routes).
    for path in find_data_files(data_dir):
        if only and path.name not in only and path.name not in {"data", "docs"}:
            continue
        if path.name == "翻译API.md":
            dst = out_dir / path.relative_to(data_dir)
            if args.skip_existing and dst.exists():
                log(f"[skip] {dst}")
                continue
            translate_markdown_with_key_protection(
                api_key,
                args.model,
                path,
                dst,
                is_route=False,
                batch_chars=args.batch_chars,
                timeout=args.timeout,
                max_retries=args.max_retries,
                fail_fast=args.fail_fast,
                max_tokens=args.max_tokens,
            )
            continue
        if path.suffix.lower() == ".csv":
            dst = out_dir / path.relative_to(data_dir)
            if args.skip_existing and dst.exists():
                log(f"[skip] {dst}")
                continue
            translate_csv_file(
                api_key,
                args.model,
                path,
                dst,
                batch_chars=args.batch_chars,
                timeout=args.timeout,
                max_retries=args.max_retries,
                fail_fast=args.fail_fast,
                max_tokens=args.max_tokens,
            )
        elif path.suffix.lower() == ".md":
            dst = out_dir / path.relative_to(data_dir)
            if args.skip_existing and dst.exists():
                log(f"[skip] {dst}")
                continue
            translate_markdown_file(
                api_key,
                args.model,
                path,
                dst,
                is_route=False,
                batch_chars=args.batch_chars,
                timeout=args.timeout,
                max_retries=args.max_retries,
                fail_fast=args.fail_fast,
                max_tokens=args.max_tokens,
            )

    # Translate routes markdown files.
    for path in find_route_markdowns(routes_dir):
        if only and path.name not in only and "routes" not in only:
            continue
        dst = out_dir / path.relative_to(data_dir)
        if args.skip_existing and dst.exists():
            log(f"[skip] {dst}")
            continue
        translate_markdown_file(
            api_key,
            args.model,
            path,
            dst,
            is_route=True,
            batch_chars=args.batch_chars,
            timeout=args.timeout,
            max_retries=args.max_retries,
            fail_fast=args.fail_fast,
            max_tokens=args.max_tokens,
        )


if __name__ == "__main__":
    main()
