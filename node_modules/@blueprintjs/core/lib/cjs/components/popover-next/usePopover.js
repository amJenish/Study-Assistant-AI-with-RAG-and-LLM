"use strict";
/* !
 * (c) Copyright 2026 Palantir Technologies Inc. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePopover = void 0;
const react_1 = require("@floating-ui/react");
const react_2 = require("react");
const popoverProps_1 = require("../popover/popoverProps");
function usePopover({ canEscapeKeyClose, disabled = false, hasBackdrop = false, interactionKind, isControlled = false, isOpen = false, middleware, placement, positioningStrategy = "absolute", onOpenChange, } = {}) {
    const [isOpenState, setIsOpenState] = (0, react_2.useState)(isOpen);
    (0, react_2.useEffect)(() => {
        setIsOpenState(isOpen);
    }, [isOpen]);
    const handleOpenChange = (0, react_2.useCallback)((nextOpen, event) => {
        // Only update internal state for uncontrolled components
        if (!isControlled) {
            setIsOpenState(nextOpen);
        }
        // Always call the external callback if provided
        if (onOpenChange) {
            onOpenChange(nextOpen, event);
        }
    }, [onOpenChange, isControlled]);
    const data = (0, react_1.useFloating)({
        middleware,
        onOpenChange: handleOpenChange,
        open: isOpenState,
        placement,
        strategy: positioningStrategy,
        whileElementsMounted: react_1.autoUpdate,
    });
    const { context } = data;
    const click = (0, react_1.useClick)(context, {
        enabled: !disabled,
    });
    const dismiss = (0, react_1.useDismiss)(context, {
        escapeKey: canEscapeKeyClose,
        // Disable outside press when hasBackdrop=true since Overlay2 handles backdrop clicks
        outsidePress: interactionKind !== popoverProps_1.PopoverInteractionKind.CLICK_TARGET_ONLY && !hasBackdrop,
    });
    const interactions = (0, react_1.useInteractions)([click, dismiss]);
    return (0, react_2.useMemo)(() => ({
        isOpen: isOpenState,
        setIsOpen: setIsOpenState,
        ...interactions,
        ...data,
    }), [data, interactions, isOpenState]);
}
exports.usePopover = usePopover;
//# sourceMappingURL=usePopover.js.map