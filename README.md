# Sensible Unicode

A file scanner that detects suspicious Unicode characters in your documents. Upload files and instantly identify hidden or unusual Unicode characters that don't match your configured ignore rules.

## Features

- **Multi-file upload**: Process multiple files at once
- **Configurable scan rules**: Ignore English letters, numbers, spaces, tabs, and newlines by default
- **Detailed reporting**: See exactly which characters are flagged, their position, and Unicode code point
- **Export cleaned files**: Download sanitized versions of your files with suspicious characters removed
- **Live rescanning**: Toggle rules and instantly see updated results

## Default Ignore Rules

By default, the scanner ignores:

- English alphabetic characters (A-Z, a-z)
- Numeric characters (0-9)
- Spaces
- Tabs
- Line feed (`\n`) and carriage return (`\r`)

Any non-ASCII character outside these rules is flagged as suspicious.
