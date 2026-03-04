import { type PopoverPosition } from "../popover/popoverPosition";
import type { PopperModifierOverrides } from "../popover/popoverSharedProps";
import type { MiddlewareConfig, PopoverNextPlacement } from "./middlewareTypes";
/**
 * Converts a legacy `PopoverPosition` value to a `PopoverNextPlacement` value for use with `PopoverNext`.
 *
 * The `position` prop is not supported in `PopoverNext`; use the `placement` prop instead.
 * `"auto"`, `"auto-start"`, and `"auto-end"` have no direct equivalent — they return `undefined`,
 * which causes `PopoverNext` to use its default automatic placement behavior.
 *
 * @example
 * // Before (Popover)
 * <Popover position={PopoverPosition.TOP_LEFT} />
 *
 * // After (PopoverNext)
 * <PopoverNext placement={popoverPositionToNextPlacement(PopoverPosition.TOP_LEFT)} />
 */
export declare function popoverPositionToNextPlacement(position: PopoverPosition): PopoverNextPlacement | undefined;
/**
 * Converts Popper.js v2 `modifiers` (used by `Popover`) to a Floating UI `MiddlewareConfig` (used by `PopoverNext`).
 *
 * The `modifiers` prop is not supported in `PopoverNext`; use the `middleware` prop instead.
 *
 * Modifier → middleware mappings:
 * - `flip` → `flip`
 * - `preventOverflow` → `shift` (Floating UI's equivalent "keep within boundary" concept)
 * - `offset` → `offset` (tuple `[skidding, distance]` is converted to `{ crossAxis, mainAxis }`)
 * - `arrow` → `arrow`
 * - `hide` → `hide`
 * - `computeStyles`, `eventListeners`, `popperOffsets` are not mapped (handled internally by Floating UI)
 *
 * **Note on offset:** If the Popper.js `offset` option is a function, it cannot be automatically
 * converted and will be omitted with a console warning. Migrate it manually to a
 * `{ mainAxis, crossAxis }` object in the `middleware` prop.
 *
 * @example
 * // Before (Popover)
 * <Popover modifiers={{ flip: { options: { padding: 8 } }, preventOverflow: { options: { padding: 4 } } }} />
 *
 * // After (PopoverNext)
 * <PopoverNext middleware={popperModifiersToNextMiddleware({ flip: { options: { padding: 8 } }, preventOverflow: { options: { padding: 4 } } })} />
 */
export declare function popperModifiersToNextMiddleware(modifiers: PopperModifierOverrides): MiddlewareConfig;
