#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib import request

API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b"
HAN_RE = re.compile(r"[\u4e00-\u9fff]")


def has_han(text: str) -> bool:
    return bool(HAN_RE.search(text or ""))


def chunk_by_chars(items, max_chars=2500):
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
    if text.startswith("[") and text.endswith("]"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


def build_marked_payload(items):
    parts = []
    for i, item in enumerate(items, 1):
        parts.append(f"<<<ITEM {i}>>>\n{item}\n<<<END ITEM {i}>>>")
    return "\n".join(parts)


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


def call_api(api_key: str, model: str, messages, max_tokens=8000, temperature=0.1):
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
    with request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def translate_single(api_key: str, model: str, text: str):
    system_prompt = (
        "You are a professional translator. Translate Chinese to English. "
        "Do not translate text that is already English. Preserve punctuation and numbers. "
        "Return only the translated text with no extra commentary."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text},
    ]

    for attempt in range(3):
        try:
            res = call_api(api_key, model, messages)
            content = res.get("choices", [{}])[0].get("message", {}).get("content", "")
            return content.strip()
        except Exception:
            if attempt == 2:
                return text
            time.sleep(2 * (attempt + 1))


def translate_batch(api_key: str, model: str, items):
    system_prompt = (
        "You are a professional translator. Translate Chinese to English. "
        "Do not translate text that is already English. Preserve punctuation and numbers. "
        "Return only the translated content, wrapped with the same ITEM markers."
    )
    if not items:
        return []
    if len(items) == 1:
        return [translate_single(api_key, model, items[0])]
    user_content = build_marked_payload(items)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    for attempt in range(3):
        try:
            res = call_api(api_key, model, messages)
            content = res.get("choices", [{}])[0].get("message", {}).get("content", "")
            arr = parse_marked_response(content, len(items))
            if not arr:
                arr = parse_json_array(content)
            if isinstance(arr, list) and len(arr) == len(items):
                return ["" if v is None else str(v) for v in arr]
            raise RuntimeError("Invalid translation response format")
        except Exception:
            if attempt == 2:
                break
            time.sleep(2 * (attempt + 1))

    out = []
    for item in items:
        out.append(translate_single(api_key, model, item))
    return out


def translate_strings(api_key: str, model: str, strings):
    outputs = list(strings)
    idxs = [i for i, s in enumerate(strings) if has_han(s)]
    if not idxs:
        return outputs
    to_translate = [strings[i] for i in idxs]
    translated = []
    for batch in chunk_by_chars(to_translate, max_chars=3000):
        translated.extend(translate_batch(api_key, model, batch))
    for i, new_val in zip(idxs, translated):
        outputs[i] = new_val
    return outputs


def scan_string_literals(text: str):
    literals = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in ("'", '"'):
            quote = ch
            j = i + 1
            escaped = False
            while j < n:
                c = text[j]
                if escaped:
                    escaped = False
                    j += 1
                    continue
                if c == "\\":
                    escaped = True
                    j += 1
                    continue
                if c == quote:
                    break
                j += 1
            if j < n:
                literals.append((i, j + 1, quote, text[i + 1 : j]))
                i = j + 1
                continue
        i += 1
    return literals


def escape_for_quote(s: str, quote: str) -> str:
    if "\n" in s:
        s = s.replace("\n", "\\n")
    if quote == "'":
        return s.replace("'", "\\'")
    return s.replace('"', '\\"')


def translate_file(path: Path, api_key: str, model: str):
    text = path.read_text(encoding="utf-8")
    literals = scan_string_literals(text)
    if not literals:
        return

    unique = []
    seen = set()
    for _, _, _, content in literals:
        if not has_han(content):
            continue
        if content not in seen:
            seen.add(content)
            unique.append(content)

    if not unique:
        return

    translations = translate_strings(api_key, model, unique)
    mapping = {src: dst for src, dst in zip(unique, translations)}

    parts = []
    last = 0
    for start, end, quote, content in literals:
        parts.append(text[last:start])
        if content in mapping:
            translated = escape_for_quote(mapping[content], quote)
            parts.append(f"{quote}{translated}{quote}")
        else:
            parts.append(text[start:end])
        last = end
    parts.append(text[last:])

    path.write_text("".join(parts), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("NVAPI_KEY")
    if not api_key:
        print("ERROR: NVIDIA_API_KEY (or NVAPI_KEY) is required.", file=sys.stderr)
        sys.exit(1)

    translate_file(Path(args.path).resolve(), api_key, args.model)


if __name__ == "__main__":
    main()
