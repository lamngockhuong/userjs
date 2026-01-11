# Edge Cases Test

Testing edge cases, special characters, and potential issues.

[[toc]]

## Empty Elements

### Empty code block

```

```

### Empty blockquote

>

### Empty list items

-
- Item with content
-

## Special Characters

### Escaping

\*not italic\*

\*\*not bold\*\*

\`not code\`

\[not a link\](url)

\# not a header

### HTML Entities

&amp; &lt; &gt; &quot; &apos;

&nbsp; &copy; &reg; &trade;

&mdash; &ndash; &hellip;

### Unicode

Arrows: → ← ↑ ↓ ↔ ⇒ ⇐ ⇑ ⇓ ⇔

Math: ± × ÷ ≠ ≤ ≥ ∞ ∑ ∏ √ ∫

Greek: α β γ δ ε ζ η θ ι κ λ μ

Emoji: 🎉 🚀 ✅ ❌ ⚠️ 💡 🔥 ⭐

Box drawing: ┌─┬─┐│ │ │├─┼─┤└─┴─┘

### Currency

$100 €200 £300 ¥400 ₹500 ₿0.001

## Long Content

### Very Long Line

This is a very long line that goes on and on and on and on and on and on and on and on and on and on
and on and on and on and on and on and on and on and on and on and on and on and on and on and on
and on and on and on and on and on and on and on and on and on and on and on and on and on and on
and on and on and on and on and on and on and on and on and on and on and on and on.

### Long Word

Supercalifragilisticexpialidociouspneumonoultramicroscopicsilicovolcanoconiosishippopotomonstrosesquippedaliophobiaantidisestablishmentarianism

### Long Code Line

```javascript
const veryLongVariableName = someVeryLongFunctionName(
  argumentOne,
  argumentTwo,
  argumentThree,
  argumentFour,
  argumentFive,
  argumentSix,
  argumentSeven,
);
```

### Long URL

[Very long URL](https://example.com/path/to/some/very/deeply/nested/resource/with/many/segments/and/query?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5&param6=value6#anchor)

## Whitespace Handling

### Trailing Spaces

Line with trailing spaces Another line

### Multiple Blank Lines

Above has multiple blank lines

Below has multiple blank lines

### Tabs vs Spaces

    Tab-indented line
    Space-indented line (4 spaces)
        8 spaces

## Raw HTML (if allowed)

<details>
<summary>Click to expand</summary>

This is hidden content inside a details element.

- List item 1
- List item 2

```javascript
console.log("Code in details");
```

</details>

<kbd>Ctrl</kbd> + <kbd>C</kbd>

<mark>Highlighted text</mark>

<abbr title="HyperText Markup Language">HTML</abbr>

<sub>subscript</sub> and <sup>superscript</sup>

## Potential XSS Vectors (Should Be Sanitized)

### Script Tags

<script>alert('XSS')</script>

### Event Handlers

<img src="x" onerror="alert('XSS')">

<div onmouseover="alert('XSS')">Hover me</div>

### JavaScript URLs

[Click me](<javascript:alert('XSS')>)

<a href="javascript:alert('XSS')">Click</a>

### Data URLs

<img src="data:text/html,<script>alert('XSS')</script>">

### SVG XSS

<svg onload="alert('XSS')"></svg>

<svg><script>alert('XSS')</script></svg>

### CSS Injection

<style>body { background: url('javascript:alert(1)'); }</style>

<div style="background-image: url(javascript:alert('XSS'))">Test</div>

## Malformed Markdown

### Unclosed Elements

\*\*bold without closing

\*italic without closing

`code without closing

[link without closing

### Mismatched Elements

**bold \*and italic** without proper nesting\*

### Extra Closing

Extra **bold** \*\* markers

### Invalid Links

[Empty link]()

[Link with spaces](url with spaces)

[]()

## Code Block Edge Cases

### No Language Specified

```
Plain code block
No syntax highlighting
```

### Unknown Language

```unknownlanguage
This language doesn't exist
Should fallback gracefully
```

### Empty Language

```
Technically empty string language
```

### Nested Backticks

````markdown
```javascript
const x = 1;
```
````

### Triple Backticks in Code

````
Some code with ``` backticks inside
````

## Image Edge Cases

### Missing Alt Text

![]()

### Broken Image

![Broken image](https://invalid.url.example/image.png)

### Data URL Image

![Tiny red dot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==)

## Math Edge Cases

### Unclosed Math

$x^2 + y^2

### Empty Math

$$
$$

### Math with HTML-like Content

$<div>test</div>$

$$\text{<script>alert('xss')</script>}$$

## Table Edge Cases

### Single Column

| Header |
| ------ |
| Cell 1 |
| Cell 2 |

### Empty Cells

| A   | B   | C   |
| --- | --- | --- |
|     | 2   |     |
| 1   |     | 3   |

### Pipes in Cells

| Code | Example  |
| ---- | -------- |
| OR   | `a \| b` |
| Pipe | \|       |

## Horizontal Rules Variations

---

---

---

---

---

---
