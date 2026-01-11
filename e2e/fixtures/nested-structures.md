# Nested Structures Test

Testing deeply nested markdown structures.

[[toc]]

## Nested Lists

### Unordered Nesting

- Level 1 item A
  - Level 2 item A.1
    - Level 3 item A.1.a
      - Level 4 item A.1.a.i
        - Level 5 item A.1.a.i.α
        - Level 5 item A.1.a.i.β
      - Level 4 item A.1.a.ii
    - Level 3 item A.1.b
  - Level 2 item A.2
- Level 1 item B
  - Level 2 item B.1
  - Level 2 item B.2
    - Level 3 with **bold** and _italic_
    - Level 3 with `inline code`
    - Level 3 with [link](https://example.com)

### Ordered Nesting

1. First major section
   1. Subsection 1.1
      1. Point 1.1.1
      2. Point 1.1.2
         1. Detail 1.1.2.1
         2. Detail 1.1.2.2
   2. Subsection 1.2
2. Second major section
   1. Subsection 2.1
   2. Subsection 2.2
3. Third major section

### Mixed Lists

1. Ordered item
   - Unordered child
   - Another unordered
     1. Back to ordered
     2. Still ordered
        - Deep unordered
        - More deep
   - Final unordered
2. Another ordered

### Task Lists Nested

- [ ] Main task 1
  - [x] Subtask 1.1 (done)
  - [ ] Subtask 1.2
    - [x] Sub-subtask 1.2.1
    - [ ] Sub-subtask 1.2.2
- [x] Main task 2 (done)
  - [x] All subtasks done
  - [x] Really all done

## Nested Blockquotes

> Level 1 quote
>
> > Level 2 quote with more context
> >
> > > Level 3 quote - going deeper
> > >
> > > > Level 4 - this is quite deep
> > > >
> > > > With multiple paragraphs inside
> > >
> > > Back to level 3
> >
> > Back to level 2
>
> Back to level 1

### Blockquotes with Other Elements

> **Important:** This quote contains:
>
> - A list item
> - Another item
>   - Nested in quote
>
> ```javascript
> // Code in quote
> const x = 42;
> ```
>
> And even a table:
>
> | A   | B   |
> | --- | --- |
> | 1   | 2   |
>
> Plus math: $E = mc^2$

## Complex Tables

### Multi-line Cells

| Feature    | Description        | Example       |
| ---------- | ------------------ | ------------- |
| **Bold**   | Makes text bold    | `**text**`    |
| _Italic_   | Makes text italic  | `*text*`      |
| ~~Strike~~ | Strikethrough text | `~~text~~`    |
| `Code`     | Inline code        | `` `code` ``  |
| [Link](#)  | Creates hyperlink  | `[text](url)` |

### Alignment Variations

| Left         |     Center     |         Right | Default         |
| :----------- | :------------: | ------------: | --------------- |
| L1           |       C1       |            R1 | D1              |
| Left aligned | Center aligned | Right aligned | Default aligned |
| 100          |      200       |           300 | 400             |

### Wide Table

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| A1    | A2    | A3    | A4    | A5    | A6    | A7    | A8    |
| B1    | B2    | B3    | B4    | B5    | B6    | B7    | B8    |
| C1    | C2    | C3    | C4    | C5    | C6    | C7    | C8    |

## Multiple Footnotes

This paragraph has multiple references[^1] in different places[^2] and even more[^3].

Here's another paragraph with a complex footnote[^complex].

And one with a long footnote name[^long-footnote-name].

[^1]: First simple footnote.

[^2]: Second simple footnote with **formatting**.

[^3]: Third footnote with `code` and [link](https://example.com).

[^complex]: This is a complex footnote with multiple elements:

    - A list item
    - Another item

    ```javascript
    // Code in footnote
    console.log("Hello");
    ```

    And a second paragraph.

[^long-footnote-name]: Footnotes can have long identifiers for better organization.

## Definition Lists (if supported)

Term 1 : Definition for term 1

Term 2 : Definition for term 2 : Alternative definition

Complex Term : This definition has **bold**, _italic_, and `code`. : It can also have multiple
paragraphs.

## Headers with Special Characters

## Header with `code` inside

## Header with **bold** and _italic_

## Header with [link](https://example.com)

## Header with emoji 🚀

## 日本語ヘッダー

## Заголовок на русском

## 한국어 제목

## Combining Everything

> ### Blockquote Header
>
> This blockquote contains:
>
> 1. A numbered list
>    - With nested bullets
>      - Deep nesting
>    - And task lists
>      - [x] Done
>      - [ ] Todo
> 2. Some math: $\sum_{i=1}^{n} i$
> 3. A code block:
>    ```python
>    def hello():
>        print("Hello from quote!")
>    ```
> 4. And a table:
>
>    | X   | Y   |
>    | --- | --- |
>    | 1   | 2   |
>
> Footnote reference[^nested].

[^nested]: This footnote is referenced from inside a blockquote.
