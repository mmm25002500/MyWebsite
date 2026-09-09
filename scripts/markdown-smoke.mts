import { renderMarkdown } from '../src/lib/content/markdown.js';

const sample = `# 標題一

## 標題二

一般段落，含 **粗體**、*斜體*、\`行內程式碼\` 與 [連結](https://example.com)。

:::img{src="/media/a.png" align="center" width="60%" rounded shadow caption="圖說" alt="替代文字" zoom}
:::

:::gallery{cols=3 gap="md"}
![圖1](/media/1.png)
![圖2](/media/2.png)
:::

:::callout{type="warning" title="注意"}
內文，可含 **Markdown**
:::

\`\`\`ts title="server.ts" theme="dracula" showLineNumbers highlight="2-3"
const a = 1;
const b = 2;
const c = a + b;
\`\`\`

:::columns{cols=2 gap="lg"}
::col
左欄內容
::
::col
右欄內容
::
:::

:::card{href="https://example.com" title="標題"}
描述文字
:::

:::button{href="https://example.com" variant="primary" align="center"}
前往查看
:::

:::details{title="點我展開" open}
內容
:::

:::embed{type="youtube" id="dQw4w9WgXcQ"}
:::

:::ref{type="post" slug="my-article"}
:::

行內數學 $E=mc^2$，區塊：

$$
\\int_0^1 x^2 dx
$$

\`\`\`mermaid
graph TD; A-->B;
\`\`\`

| A | B |
|---|---|
| 1 | 2 |

:::file{href="/media/spec.pdf" name="規格書.pdf" size="2.4MB"}
:::

:::embed{type="iframe" url="https://evil.example.com/x"}
:::

<script>alert(1)</script>

<a href="javascript:alert(1)">壞連結</a>
`;

const result = await renderMarkdown(sample);
console.log(result.html);
console.log('\n--- ISSUES ---');
console.log(result.issues);
console.log('--- STATS ---', { wordCount: result.wordCount, readingTimeMin: result.readingTimeMin });
console.log('--- TOC ---', result.toc);
