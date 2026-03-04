import { jsx as _jsx } from "react/jsx-runtime";
/*
 * Copyright 2024 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import { IconSize } from "../../iconTypes";
import { SVGIconContainer } from "../../svgIconContainer";
export const CubeCutouts = React.forwardRef((props, ref) => {
    const isLarge = (props.size ?? IconSize.STANDARD) >= IconSize.LARGE;
    const pixelGridSize = isLarge ? IconSize.LARGE : IconSize.STANDARD;
    const translation = `${-1 * pixelGridSize / 0.05 / 2}`;
    const style = { transformOrigin: "center" };
    return (_jsx(SVGIconContainer, { iconName: "cube-cutouts", ref: ref, ...props, children: _jsx("path", { d: isLarge ? "M380 320A20 20 0 0 0 400 300V20A20 20 0 0 0 380 0H100A20 20 0 0 0 80 20V300A20 20 0 0 0 100 320zM291.4 185.38L259.3200000000001 166.44L250.0000000000001 160.98V51.28L327.4200000000001 86.34C335.0200000000001 89.78 340.0000000000001 98.12 340.0000000000001 107.38V214L339.98 214.18C330.2400000000001 208.38 310.3800000000001 196.58 291.4000000000001 185.38M140 212.64V106.04C140 97.46 144.28 89.62 151.06 85.78L230 52.14V161L140.1 214.1Q140 213.36 140 212.64M248.02 268.74A18 18 0 0 1 231.66 269.5L152.58 233.66A20 20 0 0 1 149.44 231.84L240 178.28L249.16 183.68L281.24 202.6A12920 12920 0 0 1 331.5600000000001 232.42A20 20 0 0 1 328.9600000000001 234.22zM0 380A20 20 0 0 0 20 400H340A20 20 0 0 0 360 380V340H80A20 20 0 0 1 60 320V40H20A20 20 0 0 0 0 60z" : "M300 260A20 20 0 0 0 320 240V20A20 20 0 0 0 300 0H80A20 20 0 0 0 60 20V240A20 20 0 0 0 80 260zM233.2 147.92C223.42 142.12 213.88 136.52 206.8 132.34L200 128.34V39.86L261.96 67.9200000000001C268.2 70.7600000000001 272.3 77.6400000000001 272.3 85.2600000000001V171.06C264 166.1400000000001 248.26 156.8000000000001 233.2 147.92M107.7 84.14C107.7 77.08 111.22 70.62 116.8 67.46L180 40.52V128.36L107.7 171.08zM196.6 218.02A14.8 14.8 0 0 1 183.12 218.68L118.04 189.18L117.18 188.72L190 145.66L196.64 149.58L223.04 165.14C239.38 174.78 256.28 184.8 263.78 189.28L263.2 189.64zM240 320A20 20 0 0 0 260 300V280H60A20 20 0 0 1 40 260V60H20A20 20 0 0 0 0 80V300A20 20 0 0 0 20 320z", fillRule: "evenodd", transform: `scale(0.05, -0.05) translate(${translation}, ${translation})`, style: style }) }));
});
CubeCutouts.displayName = `Blueprint6.Icon.CubeCutouts`;
export default CubeCutouts;
//# sourceMappingURL=cube-cutouts.js.map