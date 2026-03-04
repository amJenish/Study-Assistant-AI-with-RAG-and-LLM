"use strict";
/* !
 * (c) Copyright 2026 Palantir Technologies Inc. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopoverTarget = void 0;
const tslib_1 = require("tslib");
const classnames_1 = tslib_1.__importDefault(require("classnames"));
const react_1 = require("react");
const common_1 = require("../../common");
const popoverProps_1 = require("../popover/popoverProps");
exports.PopoverTarget = (0, react_1.forwardRef)((props, targetRef) => {
    const { children, className, floatingData, disabled = false, fill = false, handleMouseEnter, handleMouseLeave, handleTargetBlur, handleTargetContextMenu, handleTargetFocus, interactionKind, isContentEmpty, isControlled, isHoverInteractionKind, openOnTargetFocus = true, popupKind, renderTarget = undefined, targetProps, targetTagName = "span", } = props;
    const tagName = fill ? "div" : targetTagName;
    const { isOpen } = floatingData;
    const ref = (0, common_1.mergeRefs)(floatingData.refs.setReference, targetRef);
    const targetEventHandlers = isHoverInteractionKind
        ? {
            onBlur: handleTargetBlur,
            onContextMenu: handleTargetContextMenu,
            onFocus: handleTargetFocus,
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
        }
        : {};
    // Ensure target is focusable if relevant prop enabled
    const targetTabIndex = !isContentEmpty && !disabled && openOnTargetFocus && isHoverInteractionKind ? 0 : undefined;
    const ownTargetProps = {
        // N.B. this.props.className is passed along to renderTarget even though the user would have access to it.
        // If, instead, renderTarget is undefined and the target is provided as a child, props.className is
        // applied to the generated target wrapper element.
        className: (0, classnames_1.default)(className, common_1.Classes.POPOVER_TARGET, {
            [common_1.Classes.POPOVER_OPEN]: isOpen,
            // this class is mainly useful for button targets
            [common_1.Classes.ACTIVE]: isOpen && !isControlled && !isHoverInteractionKind,
        }),
        ref,
        ...targetEventHandlers,
    };
    const childTargetProps = {
        "aria-expanded": isHoverInteractionKind ? undefined : isOpen,
        "aria-haspopup": interactionKind === popoverProps_1.PopoverInteractionKind.HOVER_TARGET_ONLY ? undefined : (popupKind ?? "menu"),
    };
    const targetModifierClasses = {
        // this class is mainly useful for Blueprint <Button> targets; we should only apply it for
        // uncontrolled popovers when they are opened by a user interaction
        [common_1.Classes.ACTIVE]: isOpen && !isControlled && !isHoverInteractionKind,
        // similarly, this class is mainly useful for targets like <Button>, <InputGroup>, etc.
        [common_1.Classes.FILL]: fill,
    };
    let target;
    if (renderTarget !== undefined) {
        const floatingProps = floatingData.getReferenceProps();
        // When using renderTarget, if the consumer renders a tooltip target, it's their responsibility
        // to disable that tooltip when this popover is open
        target = renderTarget({
            ...ownTargetProps,
            ...childTargetProps,
            // Apply Floating UI's interaction props for renderTarget case
            ...floatingProps,
            className: (0, classnames_1.default)(ownTargetProps.className, targetModifierClasses),
            isOpen,
            tabIndex: targetTabIndex,
        });
    }
    else {
        const childTarget = common_1.Utils.ensureElement(react_1.Children.toArray(children)[0]);
        if (childTarget === undefined) {
            return null;
        }
        const clonedTarget = (0, react_1.cloneElement)(childTarget, {
            ...childTargetProps,
            className: (0, classnames_1.default)(childTarget.props.className, targetModifierClasses),
            disabled: (isOpen && isTooltipElement(childTarget)) || childTarget.props.disabled,
            tabIndex: childTarget.props.tabIndex ?? targetTabIndex,
        });
        const wrappedTarget = (0, react_1.createElement)(tagName, {
            ...ownTargetProps,
            ...targetProps,
            // Apply Floating UI's interaction props to the wrapper element (same element that has the ref)
            ...floatingData.getReferenceProps(),
        }, clonedTarget);
        target = wrappedTarget;
    }
    return target;
});
exports.PopoverTarget.displayName = `${common_1.DISPLAYNAME_PREFIX}.PopoverTarget`;
/**
 * Check if a React element is a Tooltip component by comparing its displayName.
 * This avoids importing the Tooltip component directly, which would create a dependency cycle.
 */
function isTooltipElement(element) {
    return (element?.type != null &&
        typeof element.type !== "string" &&
        typeof element.type === "function" &&
        "displayName" in element.type &&
        element.type.displayName === `${common_1.DISPLAYNAME_PREFIX}.Tooltip`);
}
//# sourceMappingURL=popoverTarget.js.map