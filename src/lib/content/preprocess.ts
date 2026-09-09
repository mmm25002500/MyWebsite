/**
 * 規格 §9.3 的分欄語法：
 *
 * ```
 * :::columns{cols=2}
 * ::col
 * 左欄
 * ::
 * ::col
 * 右欄
 * ::
 * :::
 * ```
 *
 * remark-directive 的巢狀規則要求外層的冒號數多於內層，而規格給站長寫的語法
 * 兩層都是 `:::` / `::`。這裡在解析前把它正規化成 remark-directive 看得懂的
 * 形式（外層五個冒號、內層四個），站長寫的語法因此不必改。
 */
export function normalizeColumnSyntax(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];

  let columnsDepth = 0; // 目前在幾層 columns 內
  let inColumn = false;
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 程式碼圍欄內的一切原樣保留。
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    const columnsOpen = /^:::columns(\{.*\})?\s*$/.exec(trimmed);
    if (columnsOpen) {
      columnsDepth += 1;
      out.push(`:::::columns${columnsOpen[1] ?? ''}`);
      continue;
    }

    if (columnsDepth > 0) {
      if (/^::col(\{.*\})?\s*$/.test(trimmed)) {
        if (inColumn) out.push('::::');
        inColumn = true;
        out.push('::::col');
        continue;
      }
      if (trimmed === '::') {
        inColumn = false;
        out.push('::::');
        continue;
      }
      if (trimmed === ':::') {
        if (inColumn) {
          inColumn = false;
          out.push('::::');
        }
        columnsDepth -= 1;
        out.push(':::::');
        continue;
      }
    }

    out.push(line);
  }

  return out.join('\n');
}
