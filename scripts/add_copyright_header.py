#!/usr/bin/env python3
"""
Prepend copyright/metadata comment block to GAIA CSV files.

Usage (standalone):
    python3 scripts/add_copyright_header.py                # updates both files in-place
    python3 scripts/add_copyright_header.py --check        # print headers without writing

Call add_copyright_header(path) from build_codebook.py or any data-generation script
to ensure each regenerated CSV always carries its provenance.

Comment lines begin with '#' and are skipped by pandas (read_csv(comment='#')),
R (read.csv(comment.char='#')), and most CSV tools.
"""

import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# ── Shared preamble ────────────────────────────────────────────────────────────
SHARED_HEADER = """\
# GAIA — Global AI Adoption Index
# © 2026 Leila Aghabarari. Licensed under CC BY 4.0.
# https://creativecommons.org/licenses/by/4.0/
#
# Citation (APA):
#   Aghabarari, L. (2026). GAIA — Global AI Adoption Index (Version 1.0).
#   Zenodo. https://doi.org/10.5281/zenodo.20320112
#
# Citation (BibTeX):
#   @misc{{aghabarari2026gaia,
#     author    = {{Aghabarari, Leila}},
#     title     = {{{{GAIA}}: {{G}}lobal {{AI}} {{A}}doption {{I}}ndex}},
#     year      = {{2026}},
#     version   = {{1.0}},
#     publisher = {{Zenodo}},
#     doi       = {{10.5281/zenodo.20320112}},
#     url       = {{https://doi.org/10.5281/zenodo.20320112}}
#   }}
#
# Underlying sources (must also be cited when used):
#   Anthropic Economic Index — Anthropic (2025), CC BY 4.0
#     https://huggingface.co/datasets/Anthropic/EconomicIndex
#   Eloundou et al. (2024) — Science 384(6702), DOI 10.1126/science.adj0998
#   Brynjolfsson, Mitchell & Rock (2018) — NBER WP 24196, CC BY 4.0
#     https://doi.org/10.3386/w24196
#
# Website: https://gaiaindex.org   |   Contact: aghabarari.leila@gmail.com
# Disclaimer: Views are the author's own and do not represent the IFC/World Bank.
"""

# ── Per-file descriptions ──────────────────────────────────────────────────────
FILE_META = {
    'gaia_occupations.csv': (
        '# File: gaia_occupations.csv\n'
        '# Description: GAIA scores for 923 US occupations (O*NET-SOC 2018 codes).\n'
        '#   Columns: O*NET-SOC Code, Title, dv_rating_alpha/beta/gamma,\n'
        '#   human_rating_alpha/beta/gamma, sml_score, group,\n'
        '#   aei_task_success, aei_autonomy_pct, aei_work_pct, gaia_e\n'
        '# Updated: May 2026\n'
    ),
    'gaia_countries.csv': (
        '# File: gaia_countries.csv\n'
        '# Description: GAIA adoption and readiness scores for 138 countries.\n'
        '#   Columns: geo_id, usage metrics, use-case shares, collaboration style,\n'
        '#   task success rates, country metadata, AIPI sub-scores, gaia_a, gaia_r\n'
        '# Updated: May 2026\n'
    ),
}


def build_header(filename: str) -> str:
    meta = FILE_META.get(filename, f'# File: {filename}\n')
    return meta + '#\n' + SHARED_HEADER


def add_copyright_header(filepath: str, check_only: bool = False) -> bool:
    """
    Prepend copyright comments to a CSV file.
    Returns True if file was (or would be) modified, False if already up to date.
    Existing comment block at the top is replaced if it starts with '# GAIA'.
    """
    filename = os.path.basename(filepath)
    header = build_header(filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    # Strip any existing comment block at the top
    lines = original.splitlines(keepends=True)
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('#'):
            data_start = i + 1
        else:
            data_start = i
            break
    data_content = ''.join(lines[data_start:])

    new_content = header + data_content

    if new_content == original:
        print(f'  {filename}: already up to date')
        return False

    if check_only:
        print(f'  {filename}: would update (dry-run)')
        print(header)
        return True

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'  {filename}: copyright header written ({len(header.splitlines())} comment lines)')
    return True


def main():
    check_only = '--check' in sys.argv

    targets = [
        os.path.join(DATA_DIR, 'gaia_occupations.csv'),
        os.path.join(DATA_DIR, 'gaia_countries.csv'),
    ]

    print('GAIA copyright header updater')
    print('Mode:', 'dry-run (--check)' if check_only else 'in-place update')
    print()

    changed = 0
    for path in targets:
        if not os.path.exists(path):
            print(f'  {os.path.basename(path)}: not found, skipping')
            continue
        if add_copyright_header(path, check_only=check_only):
            changed += 1

    print()
    if check_only:
        print(f'{changed} file(s) would be updated.')
    else:
        print(f'{changed} file(s) updated.')


if __name__ == '__main__':
    main()
