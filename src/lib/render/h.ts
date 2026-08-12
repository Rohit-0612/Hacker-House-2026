/**
 * Minimal hyperscript for satori.
 *
 * Satori accepts any React-element-shaped object, so building the layout with
 * plain objects keeps React (and a JSX toolchain) out of the server render path
 * entirely. Nothing here ever mounts in a browser.
 */

export interface SatoriStyle {
  [key: string]: string | number | undefined;
}

export interface SatoriNode {
  type: string;
  props: {
    style?: SatoriStyle;
    children?: SatoriChild;
    [key: string]: unknown;
  };
  key: string | null;
}

export type SatoriChild = SatoriNode | string | number | null | undefined | SatoriChild[];

interface Props {
  style?: SatoriStyle;
  [key: string]: unknown;
}

/** Hand-rolled flatten: `Array.prototype.flat(Infinity)` on the recursive
 *  SatoriChild type sends the compiler into an unbounded instantiation. */
function flatten(children: SatoriChild[], out: Exclude<SatoriChild, SatoriChild[]>[] = []) {
  for (const child of children) {
    if (Array.isArray(child)) flatten(child, out);
    else if (child !== null && child !== undefined) out.push(child);
  }
  return out;
}

export function h(type: string, props: Props = {}, ...children: SatoriChild[]): SatoriNode {
  const flat = flatten(children);
  return {
    type,
    props: {
      ...props,
      ...(flat.length > 0 ? { children: flat.length === 1 ? flat[0] : flat } : {}),
    },
    key: null,
  };
}

/**
 * Satori throws when a div has multiple children without an explicit display,
 * which is the single easiest way to break a layout. These helpers make the
 * common cases impossible to get wrong.
 */
export const row = (style: SatoriStyle, ...children: SatoriChild[]): SatoriNode =>
  h("div", { style: { display: "flex", flexDirection: "row", ...style } }, ...children);

export const col = (style: SatoriStyle, ...children: SatoriChild[]): SatoriNode =>
  h("div", { style: { display: "flex", flexDirection: "column", ...style } }, ...children);

export const text = (style: SatoriStyle, content: string): SatoriNode =>
  h("div", { style: { display: "flex", ...style } }, content);
