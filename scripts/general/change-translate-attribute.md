# Change Translate Attribute

Automatically changes the `translate="no"` attribute to `translate="yes"` on HTML pages, enabling browser translation features on sites that disable it.

## Features

- Detects `translate="no"` on the root HTML element
- Automatically changes it to `translate="yes"`
- Logs change confirmation to console

## Usage

Install the script and it will automatically run on all pages. When a page has `translate="no"` set, the script enables translation by changing it to `translate="yes"`.

## Notes

- Some websites disable translation to protect code snippets or technical content
- This script is useful when you need to translate content on sites that block browser translation
- Works with Google Chrome's translation feature and other browser translation tools
