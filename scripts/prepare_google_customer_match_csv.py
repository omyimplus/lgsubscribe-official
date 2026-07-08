#!/usr/bin/env python3
"""แปลงรายการเบอร์ไทยเป็น CSV สำหรับ Google Ads Customer Match (คอลัมน์ Phone, E.164)."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def normalize_thai_phone(raw: str) -> str | None:
    digits = re.sub(r'\D', '', raw.strip())
    if not digits:
        return None
    national = digits
    if national.startswith('66'):
        national = national[2:]
    if national.startswith('0'):
        national = national[1:]
    if len(national) < 8 or len(national) > 9:
        return None
    return f'+66{national}'


def convert(input_path: Path, output_path: Path) -> tuple[int, int, int]:
    lines = input_path.read_text(encoding='utf-8-sig').splitlines()
    seen: set[str] = set()
    phones: list[str] = []
    skipped = 0

    for line in lines:
        phone = normalize_thai_phone(line)
        if not phone:
            if line.strip():
                skipped += 1
            continue
        if phone in seen:
            continue
        seen.add(phone)
        phones.append(phone)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text('Phone\n' + '\n'.join(phones) + '\n', encoding='utf-8')
    return len(lines), len(phones), skipped


def main() -> None:
    parser = argparse.ArgumentParser(description='Prepare Google Customer Match phone CSV')
    parser.add_argument('input', type=Path, help='Source file (one phone per line)')
    parser.add_argument(
        '-o', '--output', type=Path,
        default=Path('data/marketing/google-customer-match.csv'),
        help='Output CSV path',
    )
    args = parser.parse_args()
    total, unique, skipped = convert(args.input, args.output)
    print(f'input_lines={total} unique_phones={unique} skipped={skipped}')
    print(f'written={args.output}')


if __name__ == '__main__':
    main()
