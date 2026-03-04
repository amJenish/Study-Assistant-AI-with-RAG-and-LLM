/// <reference types="react" />
import { type Middleware, type Placement, type UseFloatingReturn, type UseInteractionsReturn } from "@floating-ui/react";
import { PopoverInteractionKind } from "../popover/popoverProps";
import type { PopoverNextPositioningStrategy } from "./middlewareTypes";
interface PopoverOptions {
    canEscapeKeyClose?: boolean;
    disabled?: boolean;
    hasBackdrop?: boolean;
    interactionKind?: PopoverInteractionKind;
    isControlled?: boolean;
    isOpen?: boolean;
    middleware?: Middleware[];
    placement?: Placement;
    positioningStrategy?: PopoverNextPositioningStrategy;
    onOpenChange?: (isOpen: boolean, event?: Event) => void;
}
interface UsePopoverReturn extends UseFloatingReturn, UseInteractionsReturn {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export declare function usePopover({ canEscapeKeyClose, disabled, hasBackdrop, interactionKind, isControlled, isOpen, middleware, placement, positioningStrategy, onOpenChange, }?: PopoverOptions): UsePopoverReturn;
export {};
