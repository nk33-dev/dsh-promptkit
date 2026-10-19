window.__ModuleLoader__.load({
	id: "@nk33-dev/dsh-promptkit",
	factory: function(require) {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let zod = require("zod");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/shared/remote.ts
		const json = zod.z.lazy(() => zod.z.union([
			zod.z.null(),
			zod.z.boolean(),
			zod.z.number().finite(),
			zod.z.string(),
			zod.z.array(json),
			zod.z.record(zod.z.string(), json)
		]));
		const rpcRequestSchema = zod.z.object({
			action: zod.z.string().min(1).max(80),
			payload: json
		}).strict();
		const rpcResponseSchema = zod.z.object({
			ok: zod.z.boolean(),
			data: json,
			error: zod.z.string()
		}).strict();
		const remoteContribution = {
			package: "@nk33-dev/dsh-promptkit",
			descriptors: [{
				id: "@nk33-dev/dsh-promptkit#promptkit/request",
				namespace: "promptkit",
				service: "promptkit",
				method: "request",
				invocation: { kind: "direct" },
				parameters: [{
					name: "request",
					wire: "request",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "PromptKitRequest",
						create: () => rpcRequestSchema
					}
				}],
				cancellation: { parameter: "signal" },
				result: {
					mode: "strict",
					typeSymbol: "PromptKitResponse",
					create: () => rpcResponseSchema
				}
			}]
		};
		//#endregion
		//#region src/client/api.ts
		var Api = class {
			namespace;
			configuration = null;
			language = "zh";
			message(text) {
				const parts = text.split(" / ");
				return this.language === "en" ? parts.at(-1) : parts[0];
			}
			controllers = /* @__PURE__ */ new Set();
			configurationListeners = /* @__PURE__ */ new Set();
			disposed = false;
			constructor(namespace) {
				this.namespace = namespace;
			}
			async call(action, payload, signal) {
				if (this.disposed) throw new Error("插件已停用 / Plugin disabled");
				const controller = new AbortController();
				this.controllers.add(controller);
				try {
					const response = await this.namespace.request({
						action,
						payload: JSON.parse(JSON.stringify(payload))
					}, signal ? AbortSignal.any([signal, controller.signal]) : controller.signal);
					if (!response.ok) throw new Error(this.message(response.error.message || "宿主连接失败，请重试 / Host connection failed; retry"));
					if (!response.value.ok) throw new Error(this.message(response.value.error));
					if (action === "config.read") this.configuration = response.value.data;
					if (action === "settings.save" || action === "presets.save") for (const listener of this.configurationListeners) listener();
					return response.value.data;
				} finally {
					this.controllers.delete(controller);
				}
			}
			onConfigurationChange(listener) {
				this.configurationListeners.add(listener);
				return () => {
					this.configurationListeners.delete(listener);
				};
			}
			dispose() {
				this.disposed = true;
				for (const controller of this.controllers) controller.abort();
				this.controllers.clear();
				this.configurationListeners.clear();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toKebabCase = (string) => string?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		function toLucideIconData(iconName, iconNode, aliases = []) {
			if (iconNode == null) throw new Error("[lucide]: iconNode is required when icon name is used");
			return {
				name: toKebabCase(iconName),
				size: 24,
				node: iconNode,
				...aliases.length > 0 ? { aliases } : {}
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toCamelCase = (string) => {
			let out = "";
			let upperNext = false;
			for (const ch of string) {
				if (ch === "-" || ch === "_" || ch <= " ") {
					upperNext = out.length > 0;
					continue;
				}
				if (out.length === 0) out += ch.toLowerCase();
				else out += upperNext ? ch.toUpperCase() : ch;
				upperNext = false;
			}
			return out;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toPascalCase = (string) => {
			const camelCase = toCamelCase(string);
			return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const mergeClasses = (...classes) => classes.filter((className, index, array) => {
			return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
		}).join(" ").trim();
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/build/defaultAttributes.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const defaultAttributes = {
			xmlns: "http://www.w3.org/2000/svg",
			width: 24,
			height: 24,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": 2,
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		};
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconNode.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		function isDefined(value) {
			return value !== null && value !== void 0;
		}
		function buildLucideIconNode(icon, params = {}) {
			const attributeNames = params.attributeNames ?? {};
			const getAttributeName = (attributeName) => attributeNames[attributeName] ?? attributeName;
			const viewBoxWidth = icon.size ?? icon.width ?? defaultAttributes["width"];
			const viewBoxHeight = icon.size ?? icon.height ?? defaultAttributes["height"];
			const aliasClassNames = icon.aliases?.filter((alias) => typeof alias === "string" && alias.trim() !== "").map((alias) => `lucide-${alias}`) ?? [];
			const iconClassNames = [...icon.name ? [`lucide-${icon.name}`] : [], ...aliasClassNames];
			const classNamesFromClassName = params.className?.split(" ").filter(Boolean) ?? [];
			const className = params.includeDefaultClasses === false ? mergeClasses(...classNamesFromClassName) : mergeClasses("lucide", ...iconClassNames, ...classNamesFromClassName);
			const calculatedStrokeWidth = params.absoluteStrokeWidth ? Number(params.strokeWidth ?? defaultAttributes["stroke-width"]) * Number(icon.size ?? icon.width ?? defaultAttributes["width"]) / Number(params.size ?? params.width ?? defaultAttributes["width"]) : params.strokeWidth ?? defaultAttributes["stroke-width"];
			return [
				"svg",
				{
					...Object.entries(defaultAttributes).reduce((attrs, [attrName, value]) => {
						attrs[getAttributeName(attrName)] = value;
						return attrs;
					}, {}),
					..."color" in params && params.color && { [getAttributeName("stroke")]: params.color },
					..."size" in params && isDefined(params.size) && {
						[getAttributeName("width")]: params.size,
						[getAttributeName("height")]: params.size
					},
					..."width" in params && isDefined(params.width) && { [getAttributeName("width")]: params.width },
					..."height" in params && isDefined(params.height) && { [getAttributeName("height")]: params.height },
					[getAttributeName("stroke-width")]: calculatedStrokeWidth,
					...className && { [getAttributeName("class")]: className },
					[getAttributeName("viewBox")]: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
					...params.hasA11yProp === false ? { [getAttributeName("aria-hidden")]: "true" } : {},
					..."attributes" in params && params.attributes
				},
				icon.node.map((child) => {
					const [name, attrs, children] = child;
					const nextAttrs = params.nonScalingStroke ? {
						[getAttributeName("vector-effect")]: "non-scaling-stroke",
						...attrs
					} : attrs;
					return children ? [
						name,
						nextAttrs,
						children
					] : [name, nextAttrs];
				})
			];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconForReact.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		function buildLucideIconForReact(icon, params = {}) {
			return buildLucideIconNode(icon, {
				...params,
				attributeNames: {
					...params.attributeNames,
					class: "className",
					"stroke-width": "strokeWidth",
					"stroke-linecap": "strokeLinecap",
					"stroke-linejoin": "strokeLinejoin",
					"vector-effect": "vectorEffect"
				}
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const hasA11yProp = (props) => {
			for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
			return false;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/context.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const LucideContext = (0, react.createContext)({});
		const useLucideContext = () => (0, react.useContext)(LucideContext);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/Icon.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Icon = (0, react.forwardRef)(({ color, size, width, height, strokeWidth, absoluteStrokeWidth, nonScalingStroke, className = "", children, iconNode = [], icon = {
			node: iconNode,
			aliases: [],
			size: 24
		}, ...rest }, ref) => {
			const { size: contextSize = 24, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, nonScalingStroke: contextNonScalingStroke = false, color: contextColor = "currentColor", className: contextClass = "" } = useLucideContext() ?? {};
			const hasAccessibleProp = Boolean(children) || hasA11yProp(rest);
			const [name, svgAttributes, builtIconNode = []] = buildLucideIconForReact(icon, {
				color: color ?? contextColor,
				width: width ?? size ?? contextSize,
				height: height ?? size ?? contextSize,
				strokeWidth: strokeWidth ?? contextStrokeWidth,
				absoluteStrokeWidth: absoluteStrokeWidth ?? contextAbsoluteStrokeWidth,
				nonScalingStroke: nonScalingStroke ?? contextNonScalingStroke,
				className: mergeClasses(contextClass, className),
				hasA11yProp: hasAccessibleProp,
				attributes: rest
			});
			return (0, react.createElement)(name, {
				ref,
				...svgAttributes
			}, [...builtIconNode.map(([tag, attrs]) => (0, react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
		});
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/createLucideIcon.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		function createLucideIcon(iconDataOrName, iconNode = [], aliases = []) {
			const iconData = typeof iconDataOrName === "string" ? toLucideIconData(iconDataOrName, iconNode, aliases) : iconDataOrName;
			const Component = (0, react.forwardRef)(({ className, ...props }, ref) => (0, react.createElement)(Icon, {
				ref,
				icon: iconData,
				className,
				...props
			}));
			if (iconData.name) Component.displayName = toPascalCase(iconData.name);
			return Component;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/arrow-left-right.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$11 = {
			name: "arrow-left-right",
			size: 24,
			node: [
				["path", {
					d: "M8 3 4 7l4 4",
					key: "9rb6wj"
				}],
				["path", {
					d: "M4 7h16",
					key: "6tx8e3"
				}],
				["path", {
					d: "m16 21 4-4-4-4",
					key: "siv7j2"
				}],
				["path", {
					d: "M20 17H4",
					key: "h6l3hr"
				}]
			]
		};
		__iconData$11.node;
		const ArrowLeftRight = createLucideIcon(__iconData$11);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/bookmark.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$10 = {
			name: "bookmark",
			size: 24,
			node: [["path", {
				d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
				key: "oz39mx"
			}]]
		};
		__iconData$10.node;
		const Bookmark = createLucideIcon(__iconData$10);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$9 = {
			name: "chevron-left",
			size: 24,
			node: [["path", {
				d: "m15 18-6-6 6-6",
				key: "1wnfg3"
			}]]
		};
		__iconData$9.node;
		const ChevronLeft = createLucideIcon(__iconData$9);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$8 = {
			name: "chevron-right",
			size: 24,
			node: [["path", {
				d: "m9 18 6-6-6-6",
				key: "mthhwq"
			}]]
		};
		__iconData$8.node;
		const ChevronRight = createLucideIcon(__iconData$8);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/copy.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$7 = {
			name: "copy",
			size: 24,
			node: [["rect", {
				width: "14",
				height: "14",
				x: "8",
				y: "8",
				rx: "2",
				ry: "2",
				key: "17jyea"
			}], ["path", {
				d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
				key: "zix9uf"
			}]]
		};
		__iconData$7.node;
		const Copy = createLucideIcon(__iconData$7);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/grip-vertical.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$6 = {
			name: "grip-vertical",
			size: 24,
			node: [
				["circle", {
					cx: "9",
					cy: "12",
					r: "1",
					key: "1vctgf"
				}],
				["circle", {
					cx: "9",
					cy: "5",
					r: "1",
					key: "hp0tcf"
				}],
				["circle", {
					cx: "9",
					cy: "19",
					r: "1",
					key: "fkjjf6"
				}],
				["circle", {
					cx: "15",
					cy: "12",
					r: "1",
					key: "1tmaij"
				}],
				["circle", {
					cx: "15",
					cy: "5",
					r: "1",
					key: "19l28e"
				}],
				["circle", {
					cx: "15",
					cy: "19",
					r: "1",
					key: "f4zoj3"
				}]
			]
		};
		__iconData$6.node;
		const GripVertical = createLucideIcon(__iconData$6);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/list-checks.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$5 = {
			name: "list-checks",
			size: 24,
			node: [
				["path", {
					d: "M13 5h8",
					key: "a7qcls"
				}],
				["path", {
					d: "M13 12h8",
					key: "h98zly"
				}],
				["path", {
					d: "M13 19h8",
					key: "c3s6r1"
				}],
				["path", {
					d: "m3 17 2 2 4-4",
					key: "1jhpwq"
				}],
				["path", {
					d: "m3 7 2 2 4-4",
					key: "1obspn"
				}]
			]
		};
		__iconData$5.node;
		const ListChecks = createLucideIcon(__iconData$5);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/pencil.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$4 = {
			name: "pencil",
			size: 24,
			node: [["path", {
				d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
				key: "1a8usu"
			}], ["path", {
				d: "m15 5 4 4",
				key: "1mk7zo"
			}]]
		};
		__iconData$4.node;
		const Pencil = createLucideIcon(__iconData$4);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/rotate-cw.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$3 = {
			name: "rotate-cw",
			size: 24,
			node: [["path", {
				d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",
				key: "1p45f6"
			}], ["path", {
				d: "M21 3v5h-5",
				key: "1q7to0"
			}]]
		};
		__iconData$3.node;
		const RotateCw = createLucideIcon(__iconData$3);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/sparkles.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$2 = {
			name: "sparkles",
			size: 24,
			node: [
				["path", {
					d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
					key: "1s2grr"
				}],
				["path", {
					d: "M20 2v4",
					key: "1rf3ol"
				}],
				["path", {
					d: "M22 4h-4",
					key: "gwowj6"
				}],
				["circle", {
					cx: "4",
					cy: "20",
					r: "2",
					key: "6kqj1y"
				}]
			],
			aliases: ["stars"]
		};
		__iconData$2.node;
		const Sparkles = createLucideIcon(__iconData$2);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/trash.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData$1 = {
			name: "trash",
			size: 24,
			node: [
				["path", {
					d: "M10 11v6",
					key: "nco0om"
				}],
				["path", {
					d: "M14 11v6",
					key: "outv1u"
				}],
				["path", {
					d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
					key: "miytrc"
				}],
				["path", {
					d: "M3 6h18",
					key: "d0wm0j"
				}],
				["path", {
					d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
					key: "e791ji"
				}]
			],
			aliases: ["trash-2"]
		};
		__iconData$1.node;
		const Trash = createLucideIcon(__iconData$1);
		//#endregion
		//#region ../../node_modules/.pnpm/lucide-react@1.58.0_@types+react@18.3.31_react@18.3.1/node_modules/lucide-react/dist/esm/icons/x.mjs
		/**
		* @license lucide-react v1.58.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const __iconData = {
			name: "x",
			size: 24,
			node: [["path", {
				d: "M18 6 6 18",
				key: "1bl5f8"
			}], ["path", {
				d: "m6 6 12 12",
				key: "d8bk6v"
			}]]
		};
		__iconData.node;
		const X = createLucideIcon(__iconData);
		//#endregion
		//#region src/shared/preferences.json
		var detailLabelsEn = [
			"Polish",
			"Standard",
			"Detailed"
		];
		var audienceLabelsEn = [
			"No technical experience",
			"P4 · Junior",
			"P5 · Engineer / Senior specialist",
			"P6 · Senior engineer",
			"P7 · Technical expert",
			"P8 · Senior expert",
			"P9 · Principal expert",
			"P10 · Researcher / Senior director"
		];
		var details = [
			{
				"value": "concise",
				"label": "微调",
				"description": "专业化表达，保持原意与范围",
				"rule": "微调：增强提示词理顺表达、消除重复、明确指代，并将已有的业余表述转成准确专业的要求，例如「按角色设置权限」可表述为「采用 RBAC 管理角色权限」。专业化必须与原意等价，不能借术语扩充功能、引入实现方案或改变目标；缺少的业务、规模、技术栈和规则保持开放，不猜测或补需求。篇幅由原始信息决定，不以缩短字数为目标。需求对齐只补决定目标的核心缺口：做什么、核心业务、规模、开发语言或已有技术、使用入口和设备覆盖；将相关决策合理组织成少量易答的问题，已有答案直接沿用。明确后生成专业、准确且便于修改的提示词。"
			},
			{
				"value": "standard",
				"label": "标准",
				"description": "理清目标、范围与核心流程",
				"rule": "标准：在保持原意的基础上，增强提示词将目标、范围、核心流程和约束组织得清楚、具体，必要时给出少量可调整建议；已有项目沿用技术约定，避免擅定规模、收费和无关功能。需求对齐先补核心缺口，再确认影响主要流程、数据和交付的重要选择，常规实现细节交给执行者。结果比微调更完整，保持便于修改。"
			},
			{
				"value": "detailed",
				"label": "详细",
				"description": "展开业务与技术要点，形成具体方案",
				"rule": "详细：增强提示词直接形成具体、完整、易修改的方案。软件任务按需用「目标、技术栈、核心业务、约束」等短标题，给出一套具体技术组合、运行形态、角色、业务闭环与关键规范；补出的规模或业务参数集中简短标为可调整建议。保持任务相称的篇幅，数据字段、页面清单和实现教程只在用户需要时展开。需求对齐尽可能问清影响方案的重要业务和技术细节，题数完全取决于输入缺口和任务理解；用途、规模、功能、角色、入口、设备、技术栈、业务规则、追溯、已有数据等只按实际需要提问。一般任务少量问题即可，大型复杂任务才接近上限。"
			}
		];
		var audiences = [
			{
				"value": "nontechnical",
				"label": "无技术经验",
				"description": "用日常语言确认用途和使用流程",
				"rule": "无技术经验：先问使用者、用途、操作流程和交付形式，用具体场景解释选项；技术选择给出可落地的推荐和维护成本，不要求用户先懂术语。最终提示词仍包含实现所需的技术约束。"
			},
			{
				"value": "p4",
				"label": "P4 · 初级专员",
				"description": "已有技术基础，需要明确的实现指导",
				"rule": "P4 初级专员：有基础技术能力，能在指导下完成明确任务。问题直达业务与技术选择，技术栈选项给出具体组合及适用差异；结果说明必要的实现边界和规范，保持容易逐项修改，不按零基础教学，也不默认引入复杂架构。"
			},
			{
				"value": "p5",
				"label": "P5 · 工程师 / 资深专员",
				"description": "能独立完成复杂任务",
				"rule": "P5 工程师/资深专员：能独立完成复杂任务；聚焦完整业务流程、接口边界、数据模型与验证，明确必要约束，常规编码细节交给执行者。"
			},
			{
				"value": "p6",
				"label": "P6 · 高级工程师",
				"description": "能统筹项目并指导他人",
				"rule": "P6 高级工程师：能统筹项目并指导他人；关注模块边界、协作依赖、一致性、性能和运维取舍，给出可验收的交付边界。"
			},
			{
				"value": "p7",
				"label": "P7 · 技术专家",
				"description": "关注架构取舍和业务影响",
				"rule": "P7 技术专家：聚焦业务目标与架构取舍、系统演进及主要风险，用关键约束和可验证指标表达，减少常规实现指导。"
			},
			{
				"value": "p8",
				"label": "P8 · 高级专家",
				"description": "统筹团队方向与部门协作",
				"rule": "P8 高级专家：关注团队边界、跨系统依赖、演进成本和部门目标，明确关键决策、交付阶段与治理责任，技术深度按任务需要提供。"
			},
			{
				"value": "p9",
				"label": "P9 · 资深专家",
				"description": "关注领域规划和业务决策",
				"rule": "P9 资深专家：从领域规划和业务价值明确目标、约束、主要取舍及衡量方式，避免用实现细节代替决策。"
			},
			{
				"value": "p10",
				"label": "P10 · 研究员 / 资深总监",
				"description": "关注战略判断与长期技术方向",
				"rule": "P10 研究员/资深总监：聚焦战略假设、长期技术方向、投入产出和验证路径；保留关键不确定性，不堆砌战略术语。"
			}
		];
		//#endregion
		//#region src/shared/preferences.ts
		const promptDetails = details;
		const promptAudiences = audiences;
		const promptDetailLabelsEn = detailLabelsEn;
		const promptAudienceLabelsEn = audienceLabelsEn;
		//#endregion
		//#region src/client/draft.ts
		function captureDraft(sessionId, input) {
			return {
				sessionId,
				draft: input.draft,
				revision: input.draftRev,
				attachmentIds: [...input.attachmentIds],
				references: JSON.stringify(input.occurrences)
			};
		}
		function draftUnchanged(guard, sessionId, input) {
			return guard.sessionId === sessionId && guard.draft === input.draft && guard.revision === input.draftRev && guard.references === JSON.stringify(input.occurrences) && JSON.stringify(guard.attachmentIds) === JSON.stringify(input.attachmentIds);
		}
		function detectLength(input) {
			return input.draft.length - input.occurrences.reduce((sum, r) => sum + r.length - 1, 0) - (input.claim ? input.claim.token.length - 1 : 0);
		}
		function replacementEdits(input, text) {
			if (input.claim) return null;
			const refs = input.occurrences;
			const edits = [];
			let oldAt = 0, newAt = 0, offset = 0;
			for (const ref of refs) {
				const at = text.indexOf(ref.clipboardText, newAt);
				if (at < 0 || ref.invalid || !ref.clipboardText) return null;
				edits.push({
					start: oldAt - offset,
					end: ref.offset - offset,
					text: text.slice(newAt, at)
				});
				oldAt = ref.offset + ref.length;
				newAt = at + ref.clipboardText.length;
				offset += ref.length - 1;
			}
			edits.push({
				start: oldAt - offset,
				end: input.draft.length - offset,
				text: text.slice(newAt)
			});
			return edits.reverse();
		}
		function writeDraft(actions, read, guard, sessionId, text, mode) {
			const current = read();
			if (sessionId !== guard.sessionId || current.phase !== "plain") return false;
			if (mode === "append") {
				const at = detectLength(current);
				const ok = actions.insertText((current.draft ? "\n\n" : "") + text, {
					start: at,
					end: at,
					draftRev: current.draftRev
				});
				if (ok) actions.persistDraft();
				return ok;
			}
			if (!draftUnchanged(guard, sessionId, current)) return false;
			const edits = replacementEdits(current, text);
			if (!edits) return false;
			for (const edit of edits) {
				const liveRevision = actions.captureInsertion().draftRev;
				if (!actions.insertText(edit.text, {
					start: edit.start,
					end: edit.end,
					draftRev: liveRevision
				})) return false;
			}
			actions.persistDraft();
			return true;
		}
		//#endregion
		//#region src/client/useDraft.ts
		function useDraft(api, t, { sessionId = "", input, inputActions }, project, resume) {
			const current = (0, react.useRef)({
				sessionId,
				input
			});
			current.current = {
				sessionId,
				input
			};
			const [state, setGuard] = (0, react.useState)(() => resume?.guard || (input ? captureDraft(sessionId, input) : null)), origin = (0, react.useRef)(resume && "project" in resume ? resume.project : project);
			if (origin.current === void 0 && project !== void 0) origin.current = project;
			const guard = state;
			const stale = !!guard && !!input && !draftUnchanged(guard, sessionId, input);
			async function reset(signal, allowEmpty = false) {
				const live = current.current;
				if (!live.input || !allowEmpty && !live.input.draft.trim()) throw new Error(t("emptyDraft"));
				const next = captureDraft(live.sessionId, live.input);
				const project = await api.call("project.read", { sessionId: live.sessionId }, signal);
				if (!current.current.input || !draftUnchanged(next, current.current.sessionId, current.current.input)) throw new Error(t("stale"));
				origin.current = project;
				setGuard(next);
				return next;
			}
			async function useText(text, how, override) {
				const guard = override ?? state;
				if (how === "copy") {
					await navigator.clipboard.writeText(text);
					return t("copied");
				}
				if (!guard || !inputActions || origin.current === void 0) throw new Error(t("writeFailed"));
				if (!await api.call("project.check", {
					sessionId: guard.sessionId,
					project: origin.current
				})) throw new Error(t("writeFailed"));
				if (!writeDraft(inputActions, () => current.current.input, guard, current.current.sessionId, text, how)) throw new Error(t("writeFailed"));
				return t(how === "replace" ? "replaced" : "appended");
			}
			return {
				guard,
				stale,
				reset,
				useText,
				original: () => current.current.input?.draft ?? "",
				current,
				origin
			};
		}
		/** 替换后原样换回，供提示条「撤销」使用；输入框在替换后又被改过就放弃。 */
		function revertDraft(actions, read, sessionId, original, revision) {
			const input = read();
			if (!actions || !input || actions.captureInsertion().draftRev !== revision) return false;
			return writeDraft(actions, () => read(), captureDraft(sessionId, input), sessionId, original, "replace");
		}
		//#endregion
		//#region src/client/locales.ts
		const en = {
			open: "PromptKit",
			close: "Close",
			generate: "Enhance prompt",
			grill: "Clarify needs",
			library: "Saved prompts",
			enhanceBoth: "Enhance or clarify",
			generateHint: "Turn the draft into a ready-to-use prompt",
			grillHint: "Answer a few questions first, then write the prompt",
			emptyDraftHint: "Write something in the input first",
			thinkingQuestions: "Thinking of questions…",
			writing: "Writing the prompt…",
			rewriting: "Rewriting…",
			revising: "Applying your changes…",
			cancel: "Cancel",
			retry: "Retry",
			restart: "Start over",
			stale: "The input changed.",
			restartWithDraft: "Start over with new input",
			round: "Round {n}",
			intro: "What do you want to do?",
			introPlaceholder: "Describe it in a sentence, then press Enter",
			other: "Other…",
			otherPlaceholder: "Write your answer, then press Enter",
			recommended: "Recommended",
			previousQuestion: "Previous question",
			nextQuestion: "Next question",
			skipQuestion: "Skip question",
			submitRound: "Submit this round",
			skipAnswer: "Not sure; you decide",
			rephrase: "Ask a different question",
			rephraseRequest: "I did not understand this question. Explain it with a concrete example and clearly different choices.",
			direct: "Generate now",
			summaryMeta: "Review requirements",
			summaryHint: "Confirm the requirements to generate a prompt.",
			changeAnswers: "Change answers",
			askMore: "Ask more",
			askMoreRequest: "Some details are still unclear. Keep asking questions.",
			writePrompt: "Write prompt",
			supplement: "Anything to add? Press Enter",
			result: "Result",
			resultMeta: "Edit freely",
			revise: "What should change?",
			improve: "Improve",
			unchangedResult: "The model returned the same text. Adjust your request or retry.",
			regenerateRequest: "Generate the complete prompt again, retaining the confirmed requirements.",
			regenerate: "Generate again",
			copy: "Copy",
			copied: "Copied",
			savePrompt: "Save to prompts",
			append: "Append",
			replace: "Replace",
			appended: "Appended to input",
			replaced: "Replaced input",
			undo: "Undo",
			undoFailed: "The input changed; cannot undo.",
			unsafeReplace: "References cannot be kept in a replacement. Append or copy instead.",
			writeFailed: "Could not write to the input. Copy the text or start over.",
			emptyDraft: "Write something in the input first.",
			contextUsed: "Referenced {files}",
			saved: "Saved",
			savedPrompt: "Saved to prompts",
			edit: "Edit",
			delete: "Delete",
			deleted: "Deleted “{title}”",
			search: "Search",
			all: "All",
			thisProject: "This project",
			global: "General",
			dragHint: "Drag ⠿ to reorder",
			drag: "Drag to reorder",
			saveDraft: "Save current input",
			newPrompt: "New prompt",
			emptyLibrary: "No saved prompts yet",
			noMatch: "No matching prompts",
			showMore: "Show more",
			editPrompt: "Edit prompt",
			title: "Title",
			body: "Content",
			tags: "Tags",
			tagsPlaceholder: "Separate with commas, e.g. bug fix, review",
			allProjects: "Available in all projects",
			save: "Save",
			saveChanges: "Save changes",
			loading: "Loading…",
			import: "Import JSON",
			export: "Export JSON",
			importPreview: "Review import",
			importConfirm: "Import these prompts?",
			imported: "Imported",
			duplicates: "Duplicates skipped",
			added: "New prompts",
			invalidFile: "Choose a JSON file up to 8 MiB.",
			untitled: "Untitled",
			settings: "Settings",
			features: "Features",
			rewriteEnabled: "Enhance prompt",
			grillEnabled: "Clarify needs",
			favoritesEnabled: "Saved prompts",
			defaultMode: "Listed first",
			detail: "Enhancement depth",
			audience: "Audience profile",
			questionCount: "Question {n} / {total}",
			questions: "Questions",
			more: "More",
			addOption: "Add option",
			addQuestion: "Add question",
			addQuestionRequest: "Add a question to clarify this decision:",
			confirm: "Confirm",
			multipleChoices: "Choose all that apply",
			continueAnswers: "Review answers",
			defer: "Decide later",
			deferHint: "Keep this unresolved",
			delegate: "You decide",
			delegateHint: "Let AI choose and explain why",
			rules: "Rules",
			rewriteRule: "Enhancement rule",
			grillRule: "Clarification rule",
			useDefault: "Use built-in rule",
			fillDefault: "Edit built-in rule",
			rulesHint: "An empty rule uses the built-in rule.",
			contextEnabled: "Include project context",
			contextWarning: "Selected project content is sent to the model. Off by default.",
			contextItems: "Project content",
			projectInfo: "Project name and branch",
			instructions: "Project instructions",
			directory: "Two-level directory tree",
			manifests: "Project manifests",
			connection: "Model connection",
			host: "Harness model",
			independent: "Independent service",
			hostModel: "Model",
			defaultModel: "Use Harness default",
			reasoningEffort: "Thinking level",
			effortAuto: "Auto (lowest)",
			baseUrl: "Base URL, including API prefix",
			model: "Model name",
			protocol: "Protocol",
			auto: "Auto",
			credentialRef: "Credential reference",
			credentialRefHint: "Uses PROMPTKIT_API_KEY by default. Change this only to reuse a credential already set by another plugin or an environment variable.",
			newCredentialRef: "New reference…",
			chooseExisting: "Use existing",
			key: "API key",
			keyConfigured: "Credential configured",
			keyMissing: "Credential not configured",
			saveKey: "Save key",
			removeKey: "Remove saved key",
			keyHint: "Saved through Harness credentials. Stored values are never sent back to this page.",
			timeout: "Timeout (seconds)"
		};
		const zh = {
			open: "PromptKit",
			close: "关闭",
			generate: "增强提示词",
			grill: "需求对齐",
			library: "常用提示词",
			enhanceBoth: "增强提示词或对齐需求",
			generateHint: "把草稿补全成能直接用的提示词",
			grillHint: "先回答几个问题，再写提示词",
			emptyDraftHint: "先在输入框里写点内容",
			thinkingQuestions: "正在想问题…",
			writing: "正在写提示词…",
			rewriting: "正在改写…",
			revising: "正在按你的意见修改…",
			cancel: "取消",
			retry: "重试",
			restart: "重新开始",
			stale: "输入框内容改过了",
			restartWithDraft: "按新内容重来",
			round: "第 {n} 轮",
			intro: "你想做什么？",
			introPlaceholder: "用一句话说说，回车确认",
			other: "其他…",
			otherPlaceholder: "写下你的想法，回车确认",
			recommended: "推荐",
			previousQuestion: "上一题",
			nextQuestion: "下一题",
			skipQuestion: "跳过此题",
			submitRound: "提交这一轮",
			skipAnswer: "没想好，你看着定",
			rephrase: "换个问题",
			rephraseRequest: "这道题没看懂，请用具体例子重新解释，让选项的区别更清楚。",
			direct: "直接生成",
			summaryMeta: "待确认",
			summaryHint: "确认需求后生成提示词",
			changeAnswers: "改答案",
			askMore: "接着问",
			askMoreRequest: "还有没问清楚的地方，请继续提问。",
			writePrompt: "写提示词",
			supplement: "还要补充什么？回车继续",
			result: "结果",
			resultMeta: "可以直接修改",
			revise: "还想改哪里？",
			improve: "改进",
			unchangedResult: "模型未改动结果，可调整要求后重试",
			regenerateRequest: "按已确认的要求重新生成完整提示词。",
			regenerate: "重新生成",
			copy: "复制",
			copied: "已复制",
			savePrompt: "存为常用",
			append: "追加",
			replace: "替换",
			appended: "已追加到输入框",
			replaced: "已替换输入框内容",
			undo: "撤销",
			undoFailed: "输入框已改动，无法撤销",
			unsafeReplace: "替换后无法保留引用，请追加或复制",
			writeFailed: "无法写入输入框，请复制文本或重新开始",
			emptyDraft: "先在输入框里写点内容",
			contextUsed: "参考了 {files}",
			saved: "已保存",
			savedPrompt: "已存为常用",
			edit: "编辑",
			delete: "删除",
			deleted: "已删除“{title}”",
			search: "搜索",
			all: "全部",
			thisProject: "本项目",
			global: "通用",
			dragHint: "拖动 ⠿ 调整顺序",
			drag: "拖动排序",
			saveDraft: "存当前输入",
			newPrompt: "新建",
			emptyLibrary: "还没有常用提示词",
			noMatch: "没有找到提示词",
			showMore: "显示更多",
			editPrompt: "编辑提示词",
			title: "标题",
			body: "内容",
			tags: "标签",
			tagsPlaceholder: "用逗号分隔，如：修 bug，审查",
			allProjects: "所有项目都能用",
			save: "保存",
			saveChanges: "保存修改",
			loading: "正在读取…",
			import: "导入 JSON",
			export: "导出 JSON",
			importPreview: "导入预览",
			importConfirm: "导入这些提示词？",
			imported: "已导入",
			duplicates: "跳过重复",
			added: "新增",
			invalidFile: "请选择不超过 8 MiB 的 JSON 文件",
			untitled: "未命名",
			settings: "设置",
			features: "功能",
			rewriteEnabled: "增强提示词",
			grillEnabled: "需求对齐",
			favoritesEnabled: "常用提示词",
			defaultMode: "菜单首项",
			detail: "增强深度",
			audience: "受众画像",
			questionCount: "第 {n} / {total} 题",
			questions: "题目",
			more: "更多",
			addOption: "添加选项",
			addQuestion: "补充问题",
			addQuestionRequest: "请补充一道问题来确认这个决策：",
			confirm: "确认",
			multipleChoices: "可多选",
			continueAnswers: "继续检查回答",
			defer: "暂不决定",
			deferHint: "保留待定，暂不代选",
			delegate: "你来决定",
			delegateHint: "由 AI 选择并说明依据",
			rules: "规则",
			rewriteRule: "增强规则",
			grillRule: "对齐规则",
			useDefault: "恢复内置规则",
			fillDefault: "填入内置规则",
			rulesHint: "规则留空时使用内置内容。",
			contextEnabled: "附带项目上下文",
			contextWarning: "勾选的项目内容会发送给模型，默认关闭。",
			contextItems: "项目内容",
			projectInfo: "项目名与分支",
			instructions: "项目说明",
			directory: "两层目录结构",
			manifests: "主要清单文件",
			connection: "模型连接",
			host: "Harness 模型",
			independent: "独立服务",
			hostModel: "模型",
			defaultModel: "使用 Harness 默认模型",
			reasoningEffort: "思考程度",
			effortAuto: "自动（最低档）",
			baseUrl: "Base URL，包含 API 前缀",
			model: "模型名称",
			protocol: "协议",
			auto: "自动选择",
			credentialRef: "密钥引用",
			credentialRefHint: "默认使用 PROMPTKIT_API_KEY。只有想复用其他插件或环境变量里已配置的密钥时，才需要改这里。",
			newCredentialRef: "新建引用…",
			chooseExisting: "选择已有",
			key: "API Key",
			keyConfigured: "密钥已配置",
			keyMissing: "尚未配置密钥",
			saveKey: "保存密钥",
			removeKey: "移除已保存密钥",
			keyHint: "通过 Harness 凭据服务保存，已存密钥不会返回页面。",
			timeout: "超时（秒）"
		};
		function format(text, values) {
			return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
		}
		//#endregion
		//#region src/client/workflow.ts
		const sessions = /* @__PURE__ */ new WeakMap();
		const libraries = /* @__PURE__ */ new WeakMap();
		function libraryState(api, sessionId, management) {
			let entries = libraries.get(api);
			if (!entries) {
				entries = /* @__PURE__ */ new Map();
				libraries.set(api, entries);
			}
			const key = JSON.stringify([sessionId, management]);
			let state = entries.get(key);
			if (!state) {
				state = {
					editing: null,
					tagText: "",
					search: "",
					filter: "all",
					limit: management ? 200 : 50
				};
				entries.set(key, state);
			}
			return state;
		}
		function workflow(api, sessionId, mode) {
			let entries = sessions.get(api);
			if (!entries) {
				entries = /* @__PURE__ */ new Map();
				sessions.set(api, entries);
			}
			const key = JSON.stringify([sessionId, mode]);
			let state = entries.get(key);
			if (!state) {
				state = {
					result: null,
					edited: "",
					history: [],
					answers: {},
					questionIndex: 0,
					intro: "",
					messages: [],
					supplement: "",
					started: false
				};
				entries.set(key, state);
			}
			return state;
		}
		//#endregion
		//#region src/client/questionnaire.ts
		const deferredAnswer = "暂不决定：保留为待定，不替我选择";
		const delegatedAnswer = "你来决定：根据已确认需求选择，并说明依据";
		function answerValues(answer = "") {
			if (!answer || ["暂不决定：保留为待定，不替我选择", "你来决定：根据已确认需求选择，并说明依据"].includes(answer)) return [];
			try {
				const values = JSON.parse(answer);
				if (Array.isArray(values) && values.every((value) => typeof value === "string")) return values;
			} catch {}
			return [answer];
		}
		function orderedQuestion(question) {
			const index = question.recommended;
			if (index === null || index === void 0 || index <= 0 || index >= question.options.length) return question;
			return {
				...question,
				recommended: 0,
				options: [question.options[index], ...question.options.filter((_, i) => i !== index)]
			};
		}
		function mergeQuestionnaire(rounds, incoming) {
			const questions = /* @__PURE__ */ new Map();
			const answers = Object.create(null);
			for (const round of rounds) {
				for (const question of round.questions) questions.set(question.id, orderedQuestion(question));
				for (const answer of round.answers) answers[answer.questionId] = answer.answer;
			}
			for (const question of incoming) {
				questions.set(question.id, orderedQuestion(question));
				delete answers[question.id];
			}
			const all = [...questions.values()];
			if (all.length > 128) throw new Error("问题记录过长，请直接生成 / Too many questions; generate now");
			const first = incoming[0];
			return {
				questions: all,
				answers,
				index: Math.max(0, all.findIndex((question) => question.id === first?.id))
			};
		}
		//#endregion
		//#region src/client/ui.tsx
		function Button({ primary, ...props }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pk-button",
				"data-primary": primary || void 0,
				...props
			});
		}
		function Field({ label, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "pk-label",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), children]
			});
		}
		function Switch({ label, checked, onChange, disabled }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "pk-switch",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked,
					disabled,
					onChange: (e) => onChange(e.target.checked)
				})]
			});
		}
		function navigateTabs(event) {
			if (event.nativeEvent.isComposing || ![
				"ArrowLeft",
				"ArrowRight",
				"ArrowUp",
				"ArrowDown",
				"Home",
				"End"
			].includes(event.key)) return;
			const tabs = [...event.currentTarget.querySelectorAll("[role=tab],[role=menuitem]")], at = tabs.indexOf(event.target);
			if (at < 0) return;
			event.preventDefault();
			const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (at + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
			tabs[next].focus();
			if (tabs[next].getAttribute("role") === "tab") tabs[next].click();
		}
		function download(name, text) {
			const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" })), link = document.createElement("a");
			link.href = url;
			link.download = name;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 0);
		}
		function useTask() {
			const [error, setError] = (0, react.useState)(""), [notice, setNotice] = (0, react.useState)(""), [busy, setBusy] = (0, react.useState)(false), running = (0, react.useRef)(false), mounted = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			async function perform(task, success = "") {
				if (running.current) return;
				running.current = true;
				setBusy(true);
				setError("");
				setNotice("");
				try {
					await task();
					if (mounted.current && success) setNotice(success);
				} catch (e) {
					if (mounted.current) setError(e.message);
				} finally {
					running.current = false;
					if (mounted.current) setBusy(false);
				}
			}
			return {
				error,
				setError,
				notice,
				setNotice,
				perform,
				busy
			};
		}
		function Status({ error, notice }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "pk-error",
				role: "alert",
				children: error
			}), notice && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "pk-notice",
				role: "status",
				children: notice
			})] });
		}
		function Toast({ toast }) {
			if (!toast) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-toast",
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: toast.text }), toast.action && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pk-link",
					onClick: toast.action.run,
					children: toast.action.label
				})]
			});
		}
		/** 提示条：带操作的停留 5 秒，其余 2 秒。 */
		function useToast() {
			const [toast, setToast] = (0, react.useState)(null), serial = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				if (!toast) return;
				const timer = setTimeout(() => setToast((value) => value === toast ? null : value), toast.action ? 5e3 : 2e3);
				return () => clearTimeout(timer);
			}, [toast]);
			function notify(text, action) {
				setToast({
					id: ++serial.current,
					text,
					action: action && {
						label: action.label,
						run: () => {
							setToast(null);
							action.run();
						}
					}
				});
			}
			return {
				toast,
				notify,
				clear: () => setToast(null)
			};
		}
		function CardHeader({ title, meta, t, onClose, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				className: "pk-head",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: title }),
					meta && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "pk-meta",
						children: meta
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
					children,
					onClose && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
						label: t("close"),
						onClick: onClose,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(X, {
							size: 16,
							"aria-hidden": true
						})
					})
				]
			});
		}
		function IconButton({ label, className = "", ...props }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: `pk-icon ${className}`,
				title: props.title ?? label,
				"aria-label": label,
				...props
			});
		}
		function Loading({ text }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-loading",
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "pk-spin",
					"aria-hidden": true
				}), text]
			});
		}
		/** 卡片底部的错误：固定可见，并给出下一步。 */
		function ErrorBar({ error, t, onRetry }) {
			if (!error) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-error-bar",
				role: "alert",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: error }), onRetry && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pk-link",
					onClick: onRetry,
					children: t("retry")
				})]
			});
		}
		function useData(api, action, payload, enabled = true) {
			const [data, setData] = (0, react.useState)(null), [error, setError] = (0, react.useState)(""), [version, reload] = (0, react.useState)(0), key = JSON.stringify(payload);
			(0, react.useEffect)(() => {
				if (!enabled) return;
				const controller = new AbortController();
				setError("");
				api.call(action, JSON.parse(key), controller.signal).then((value) => {
					if (!controller.signal.aborted) setData(value);
				}).catch((error) => {
					if (!controller.signal.aborted) setError(error.message);
				});
				return () => controller.abort();
			}, [
				api,
				action,
				key,
				version,
				enabled
			]);
			return {
				data,
				error,
				reload: () => reload((v) => v + 1)
			};
		}
		//#endregion
		//#region src/client/Enhance.tsx
		function Enhance({ api, t, config, mode, notify, onClose, onWrite, onEditFavorite, ...composer }) {
			const saved = (0, react.useRef)(workflow(api, composer.sessionId || "", `${mode}:${config.settings.detail}:${config.settings.audience}`)).current;
			const root = (0, react.useRef)(null);
			const [result, setResult] = (0, react.useState)(saved.result), [edited, setEdited] = (0, react.useState)(saved.edited), [history, setHistory] = (0, react.useState)(saved.history), [answers, setAnswers] = (0, react.useState)(saved.answers), [questionIndex, setQuestionIndex] = (0, react.useState)(saved.questionIndex), [intro, setIntro] = (0, react.useState)(saved.intro), [messages, setMessages] = (0, react.useState)(saved.messages), [supplement, setSupplement] = (0, react.useState)(saved.supplement), [busy, setBusy] = (0, react.useState)(null), [other, setOther] = (0, react.useState)(null);
			const [extra, setExtra] = (0, react.useState)(null), [extraText, setExtraText] = (0, react.useState)("");
			const task = useTask(), writer = useDraft(api, t, composer, void 0, saved);
			const request = (0, react.useRef)(null), generation = (0, react.useRef)(0), restarting = (0, react.useRef)(false), last = (0, react.useRef)(() => {});
			const title = t(mode === "grill" ? "grill" : "generate");
			const selected = result?.kind === "questions" ? result.questions[questionIndex] : void 0;
			const answerFor = (id) => Object.hasOwn(answers, id) ? answers[id] : "";
			const locked = writer.stale;
			(0, react.useEffect)(() => {
				Object.assign(saved, {
					result,
					edited,
					history,
					answers,
					questionIndex,
					intro,
					messages,
					supplement,
					guard: writer.guard || void 0,
					project: writer.origin.current
				});
			});
			function cancel() {
				generation.current++;
				request.current?.abort();
				request.current = null;
				setBusy(null);
			}
			(0, react.useEffect)(() => {
				if (!saved.started) generate({ start: true });
				return () => {
					generation.current++;
					request.current?.abort();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (locked && busy && !restarting.current) cancel();
			}, [locked, busy]);
			(0, react.useEffect)(() => {
				if (!selected && !result?.text || busy || locked) return;
				const card = root.current?.closest(".pk-card");
				const active = document.activeElement;
				if (card && (!active || active === document.body || active.closest(".pk-tools") && !card.contains(active))) {
					card.tabIndex = -1;
					card.focus({ preventScroll: true });
				}
			}, [
				selected,
				result?.kind,
				busy,
				locked
			]);
			function busyText({ start, forceFinal, addition }) {
				if (mode === "rewrite") return t(!start && addition ? "revising" : "rewriting");
				if (forceFinal) return t(result?.kind === "final" ? "revising" : "writing");
				return t("thinkingQuestions");
			}
			async function generate(run = {}) {
				if (request.current && !request.current.signal.aborted && !run.start) return;
				const { start = false, forceFinal = false, supplementOnly = false } = run;
				if (!start && locked) return;
				const addition = run.addition ?? "";
				const current = run.answers ?? answers;
				let rounds = start ? [] : run.rounds ?? history;
				if (!start && run.rounds === void 0 && result?.kind === "questions") {
					const confirmed = result.questions.filter((q) => (Object.hasOwn(current, q.id) ? current[q.id] : "").trim()).map((q) => ({
						questionId: q.id,
						answer: current[q.id].trim()
					}));
					if (!supplementOnly || confirmed.length) rounds = [{
						questions: result.questions,
						answers: confirmed
					}];
				}
				const nextMessages = start || run.rounds ? [] : [
					...messages,
					...supplementOnly && selected ? [{
						role: "assistant",
						text: JSON.stringify(selected),
						round: rounds.length
					}] : [],
					...result?.text ? [{
						role: "assistant",
						text: edited,
						round: rounds.length
					}] : [],
					...addition.trim() ? [{
						role: "user",
						text: addition.trim(),
						round: rounds.length
					}] : []
				];
				request.current?.abort();
				const controller = new AbortController(), token = ++generation.current;
				request.current = controller;
				last.current = () => void generate(run);
				task.setError("");
				setOther(null);
				setBusy(busyText(run));
				restarting.current = start;
				try {
					const guard = start ? await writer.reset(controller.signal) : writer.guard;
					if (!guard || token !== generation.current) return;
					const introText = start ? "" : run.intro ?? intro;
					if (start) {
						saved.started = false;
						setResult(null);
						setEdited("");
						setHistory([]);
						setMessages([]);
						setAnswers({});
						setQuestionIndex(0);
						setIntro("");
						setSupplement("");
					}
					const prompt = guard.draft.trim() ? guard.draft : introText;
					if (!prompt.trim()) throw new Error(t("emptyDraft"));
					const output = await api.call("generate", {
						sessionId: guard.sessionId,
						prompt,
						mode,
						detail: config.settings.detail,
						scenario: "general",
						history: rounds,
						forceFinal,
						messages: nextMessages.map(({ role, text }) => ({
							role,
							text
						})),
						currentText: start || run.rounds ? "" : edited
					}, controller.signal);
					const live = writer.current.current;
					if (token !== generation.current || !live.input || !draftUnchanged(guard, live.sessionId, live.input)) return;
					saved.started = true;
					setIntro(introText);
					const queue = output.kind === "questions" ? mergeQuestionnaire(rounds, output.questions) : null;
					setResult(queue ? {
						...output,
						questions: queue.questions
					} : output);
					setEdited(output.text ?? "");
					setHistory(rounds);
					setMessages(nextMessages);
					setSupplement("");
					if (addition.trim() && output.text?.trim() === edited.trim()) {
						task.setError(t("unchangedResult"));
						setSupplement(addition);
					}
					setAnswers(queue?.answers ?? {});
					setQuestionIndex(queue?.index ?? 0);
					setExtra(null);
					setExtraText("");
				} catch (error) {
					if (!controller.signal.aborted && token === generation.current) task.setError(error.message);
				} finally {
					if (token === generation.current) {
						request.current = null;
						restarting.current = false;
						setBusy(null);
					}
				}
			}
			/** 多选即时记录，翻页继续；所有题答完后交给模型检查。 */
			function pick(answer) {
				if (!selected || !result || locked) return;
				let value = answer;
				const decision = [deferredAnswer, delegatedAnswer].includes(answer);
				if (selected.multiSelect && !decision) {
					const values = answerValues(answerFor(selected.id));
					const next = values.includes(answer) ? values.filter((item) => item !== answer) : [...values, answer];
					value = next.length ? JSON.stringify(next) : "";
				}
				const questions = result.questions;
				const next = {
					...answers,
					[selected.id]: value
				};
				setAnswers(next);
				setOther(null);
				if (selected.multiSelect && !decision) return;
				if (questionIndex < questions.length - 1) setQuestionIndex(questionIndex + 1);
				else {
					const missing = questions.findIndex((q) => !next[q.id]?.trim());
					if (missing >= 0) setQuestionIndex(missing);
					else generate({ answers: next });
				}
			}
			function editAnswers() {
				const index = history.length - 1, round = history[index];
				if (!round || !result) return;
				setHistory(history.slice(0, index));
				setMessages(messages.filter((message) => (message.round ?? 0) <= index));
				setEdited("");
				setResult({
					...result,
					kind: "questions",
					text: "",
					questions: round.questions
				});
				setAnswers(Object.fromEntries(round.answers.map((a) => [a.questionId, a.answer])));
				setQuestionIndex(0);
				task.setError("");
			}
			(0, react.useEffect)(() => {
				if (!selected || busy || locked || other !== null) return;
				const question = selected;
				function onKey(event) {
					const target = event.target;
					if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || target?.closest("input,textarea,select,[contenteditable=true]") || target && target !== document.body && !target.closest(".pk-card")) return;
					const n = Number(event.key);
					if (n >= 1 && n <= question.options.length) pick(question.options[n - 1].label);
					else if (n === question.options.length + 1) setOther(customAnswer(question));
					else if (event.key === "ArrowRight" && (questionIndex < result.questions.length - 1 || canSubmitAnswers)) advance();
					else if (event.key === "ArrowLeft" && questionIndex > 0) setQuestionIndex(questionIndex - 1);
					else return;
					event.preventDefault();
				}
				document.addEventListener("keydown", onKey);
				return () => document.removeEventListener("keydown", onKey);
			});
			function customAnswer(question) {
				return answerValues(answerFor(question.id)).find((answer) => !question.options.some((option) => option.label === answer)) || "";
			}
			const canSubmitAnswers = result?.kind === "questions" && result.questions.length > 0 && result.questions.every((q) => answerFor(q.id).trim());
			/** 完整问卷在末题通过箭头提交检查。 */
			function advance() {
				if (!selected || !result) return;
				if (questionIndex >= result.questions.length - 1) {
					if (canSubmitAnswers) generate();
					return;
				}
				setQuestionIndex(questionIndex + 1);
				setOther(null);
			}
			async function saveFavorite() {
				await task.perform(async () => {
					const item = await api.call("favorites.add", {
						body: edited,
						sessionId: composer.sessionId || ""
					});
					notify(t("savedPrompt"), {
						label: t("edit"),
						run: () => onEditFavorite(item.id)
					});
				});
			}
			async function use(how) {
				await task.perform(async () => {
					const before = writer.current.current.input?.draft ?? "";
					const message = await writer.useText(edited, how);
					if (how === "copy") notify(message);
					else onWrite(how, before, composer.inputActions.captureInsertion().draftRev);
				});
			}
			const view = busy ? "busy" : result?.kind === "questions" && selected ? "questions" : result?.kind === "summary" ? "summary" : result?.kind === "final" ? "final" : mode === "grill" && saved.started && !writer.guard?.draft.trim() && !task.error ? "intro" : "empty";
			const meta = view === "questions" ? format(t("questionCount"), {
				n: questionIndex + 1,
				total: result.questions.length
			}) : view === "summary" ? t("summaryMeta") : view === "final" ? t("resultMeta") : "";
			const files = result?.context.sections.flatMap((s) => s.files) ?? [];
			const contextDetail = result?.context.sections.map((s) => [`${s.kind}: ${s.files.join(", ")}`, ...s.skipped.map((reason) => reason.split(" / ")[api.language === "en" ? 1 : 0] || reason)].join("\n")).join("\n\n");
			const unsafe = !!composer.input && !replacementEdits(composer.input, edited);
			const canWrite = !!composer.inputActions && !!writer.guard;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: root,
				className: "pk-workflow",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardHeader, {
						title,
						meta,
						t,
						onClose
					}),
					locked && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "pk-stale",
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("stale") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pk-link",
							onClick: () => generate({ start: true }),
							children: t("restartWithDraft")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `pk-body${view === "final" ? " is-result" : ""}`,
						children: [
							view === "busy" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loading, { text: busy }),
							view === "empty" && !task.error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								onClick: () => generate({ start: true }),
								children: t("restart")
							}),
							view === "intro" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "pk-question",
								children: t("intro")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "pk-input",
								"aria-label": t("intro"),
								placeholder: t("introPlaceholder"),
								maxLength: 2e4,
								autoFocus: true,
								disabled: locked,
								onKeyDown: (event) => {
									event.stopPropagation();
									const value = event.currentTarget.value.trim();
									if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229 && value) {
										event.preventDefault();
										generate({ intro: value });
									}
								}
							})] }),
							view === "questions" && selected && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "pk-question-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										className: "pk-question",
										children: selected.question
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: t("rephrase"),
										disabled: locked,
										onClick: () => generate({
											supplementOnly: true,
											addition: t("rephraseRequest")
										}),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RotateCw, {
											size: 15,
											"aria-hidden": true
										})
									})]
								}),
								selected.basis && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "pk-caption pk-basis",
									children: selected.basis
								}),
								selected.multiSelect && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "pk-caption",
									children: t("multipleChoices")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									role: selected.multiSelect ? "group" : "radiogroup",
									"aria-label": selected.question,
									className: "pk-options",
									children: [selected.options.map((option, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										role: selected.multiSelect ? "checkbox" : "radio",
										className: "pk-option",
										"aria-checked": answerValues(answerFor(selected.id)).includes(option.label),
										disabled: locked,
										onClick: () => pick(option.label),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "pk-option-number",
											"aria-hidden": true,
											children: index + 1
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: option.label }),
											selected.recommended === index && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "pk-badge",
												children: t("recommended")
											}),
											option.description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: option.description })
										] })]
									}, index)), other !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "pk-option pk-option-editing",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "pk-option-number",
											"aria-hidden": true,
											children: selected.options.length + 1
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											"aria-label": t("other"),
											placeholder: t("otherPlaceholder"),
											maxLength: 3e3,
											autoFocus: true,
											value: other,
											onChange: (event) => setOther(event.target.value),
											onBlur: () => !other.trim() && setOther(null),
											onKeyDown: (event) => {
												event.stopPropagation();
												if (event.nativeEvent.isComposing || event.keyCode === 229) return;
												if (event.key === "Enter" && other.trim()) {
													event.preventDefault();
													pick(other.trim());
												} else if (event.key === "Escape") {
													event.preventDefault();
													event.stopPropagation();
													setOther(null);
												}
											}
										})]
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										role: selected.multiSelect ? "checkbox" : "radio",
										className: "pk-option",
										"aria-checked": !!customAnswer(selected),
										disabled: locked,
										onClick: () => setOther(customAnswer(selected)),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "pk-option-number",
											"aria-hidden": true,
											children: selected.options.length + 1
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: customAnswer(selected) || t("other") }) })]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "pk-decisions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "pk-link",
										disabled: locked,
										"aria-pressed": answerFor(selected.id) === "暂不决定：保留为待定，不替我选择",
										title: t("deferHint"),
										onClick: () => pick("暂不决定：保留为待定，不替我选择"),
										children: t("defer")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "pk-link",
										disabled: locked,
										"aria-pressed": answerFor(selected.id) === "你来决定：根据已确认需求选择，并说明依据",
										title: t("delegateHint"),
										onClick: () => pick("你来决定：根据已确认需求选择，并说明依据"),
										children: t("delegate")
									})]
								}),
								extra && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
									className: "pk-follow-row",
									onSubmit: (event) => {
										event.preventDefault();
										const value = extraText.trim();
										if (!value || locked) return;
										if (extra === "option") {
											setResult({
												...result,
												questions: result.questions.map((q) => q.id === selected.id ? {
													...q,
													options: [...q.options, {
														label: value,
														description: ""
													}]
												} : q)
											});
											setExtra(null);
											setExtraText("");
										} else generate({
											supplementOnly: true,
											addition: `${t("addQuestionRequest")} ${value}`
										});
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "pk-input",
										autoFocus: true,
										"aria-label": t(extra === "option" ? "addOption" : "addQuestion"),
										placeholder: t(extra === "option" ? "addOption" : "addQuestion"),
										maxLength: extra === "option" ? 160 : 3e3,
										value: extraText,
										onChange: (event) => setExtraText(event.target.value)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										type: "submit",
										disabled: locked || !extraText.trim(),
										children: t("confirm")
									})]
								})
							] }),
							view === "summary" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "pk-caption",
								children: t("summaryHint")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "pk-summary",
								children: edited
							})] }),
							view === "final" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: "pk-input pk-result",
									"aria-label": t("result"),
									rows: 10,
									value: edited,
									onChange: (e) => setEdited(e.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "pk-follow-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "pk-input pk-follow",
										"aria-label": t("revise"),
										placeholder: t("revise"),
										maxLength: 3e3,
										disabled: locked,
										value: supplement,
										onChange: (e) => setSupplement(e.target.value),
										onKeyDown: (event) => {
											event.stopPropagation();
											if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229 && supplement.trim()) {
												event.preventDefault();
												generate({
													forceFinal: true,
													addition: supplement
												});
											}
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										disabled: locked || !supplement.trim(),
										onClick: () => generate({
											forceFinal: true,
											addition: supplement
										}),
										children: t("improve")
									})]
								}),
								files.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "pk-caption pk-context",
									title: contextDetail,
									children: format(t("contextUsed"), { files: files.join(api.language === "en" ? ", " : "、") })
								})
							] })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBar, {
						error: task.error,
						t,
						onRetry: busy ? void 0 : () => last.current()
					}),
					view === "busy" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							onClick: cancel,
							children: t("cancel")
						})]
					}),
					view === "questions" && selected && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "pk-pager",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: t("previousQuestion"),
										disabled: questionIndex === 0 || locked,
										onClick: () => setQuestionIndex(questionIndex - 1),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronLeft, {
											size: 16,
											"aria-hidden": true
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "pk-dots",
										role: "group",
										"aria-label": t("questions"),
										children: result.questions.map((q, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "pk-dot",
											"aria-label": `${index + 1}. ${q.title}`,
											"aria-current": index === questionIndex ? "step" : void 0,
											"data-answered": !!answerFor(q.id),
											disabled: locked,
											onClick: () => {
												setQuestionIndex(index);
												setOther(null);
												setExtra(null);
											},
											children: index + 1
										}, q.id))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										label: t(questionIndex === result.questions.length - 1 && canSubmitAnswers ? "continueAnswers" : "nextQuestion"),
										disabled: locked || questionIndex >= result.questions.length - 1 && !canSubmitAnswers,
										onClick: advance,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronRight, {
											size: 16,
											"aria-hidden": true
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: "pk-more",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("more") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "pk-more-menu",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											disabled: locked || selected.options.length >= 6,
											onClick: (event) => {
												event.currentTarget.closest("details")?.removeAttribute("open");
												setExtra("option");
												setExtraText("");
											},
											children: t("addOption")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											disabled: locked,
											onClick: (event) => {
												event.currentTarget.closest("details")?.removeAttribute("open");
												setExtra("question");
												setExtraText("");
											},
											children: t("addQuestion")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											disabled: locked,
											onClick: () => generate({ start: true }),
											children: t("restart")
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: locked,
								onClick: () => generate({ forceFinal: true }),
								children: t("direct")
							})
						]
					}),
					view === "summary" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [
							history.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "pk-link",
								disabled: locked,
								onClick: editAnswers,
								children: ["‹ ", t("changeAnswers")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: locked,
								onClick: () => generate({ addition: t("askMoreRequest") }),
								children: t("askMore")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								primary: true,
								disabled: locked,
								onClick: () => generate({ forceFinal: true }),
								children: t("writePrompt")
							})
						]
					}),
					view === "final" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [
							mode === "grill" && history.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "pk-link",
								disabled: locked,
								onClick: editAnswers,
								children: t("changeAnswers")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								label: t("regenerate"),
								disabled: locked,
								onClick: () => generate({
									forceFinal: true,
									addition: t("regenerateRequest")
								}),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RotateCw, {
									size: 16,
									"aria-hidden": true
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								label: t("copy"),
								disabled: !edited.trim(),
								onClick: () => use("copy"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Copy, {
									size: 16,
									"aria-hidden": true
								})
							}),
							config.settings.favoritesEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								label: t("savePrompt"),
								disabled: !edited.trim(),
								onClick: saveFavorite,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Bookmark, {
									size: 16,
									"aria-hidden": true
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: !edited.trim() || !canWrite,
								onClick: () => use("append"),
								children: t("append")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								primary: true,
								title: unsafe ? t("unsafeReplace") : void 0,
								disabled: !edited.trim() || !canWrite || locked || unsafe,
								onClick: () => use("replace"),
								children: t("replace")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/Library.tsx
		const BUILT_IN = ["all", "untagged"];
		function blank() {
			return {
				id: crypto.randomUUID(),
				title: "",
				body: "",
				tags: [],
				pinned: false,
				project: null,
				createdAt: 0,
				updatedAt: 0,
				lastUsedAt: 0
			};
		}
		function Library({ api, t, editId, management = false, notify, onClose, onWrite, ...composer }) {
			const memory = (0, react.useRef)(libraryState(api, composer.sessionId || "", management)).current;
			const [search, setSearch] = (0, react.useState)(memory.search), [filter, setFilter] = (0, react.useState)(memory.filter), [limit, setLimit] = (0, react.useState)(memory.limit), [editing, setEditing] = (0, react.useState)(editId ? null : memory.editing), [tagText, setTagText] = (0, react.useState)(memory.tagText);
			const builtIn = BUILT_IN.includes(filter);
			const { data, error, reload } = useData(api, "favorites.list", {
				sessionId: composer.sessionId || "",
				query: search,
				scope: builtIn ? filter : "all",
				tag: builtIn ? "" : filter,
				sort: "manual",
				limit
			});
			const [items, setItems] = (0, react.useState)([]);
			(0, react.useEffect)(() => setItems(data?.items ?? []), [data]);
			(0, react.useEffect)(() => {
				Object.assign(memory, {
					editing,
					tagText,
					search,
					filter,
					limit
				});
			});
			const [importData, setImportData] = (0, react.useState)(null);
			const [dragging, setDragging] = (0, react.useState)(null), [over, setOver] = (0, react.useState)(null);
			const task = useTask(), { perform } = task, writer = useDraft(api, t, composer, data?.project);
			(0, react.useEffect)(() => {
				if (!editId) return;
				perform(() => edit(editId));
			}, [editId]);
			async function edit(id) {
				const item = await api.call("favorites.get", { id });
				setEditing(item);
				setTagText(item.tags.join(api.language === "en" ? ", " : "，"));
			}
			async function save() {
				if (!editing || !data) return;
				await perform(async () => {
					await api.call("favorites.save", {
						favorite: {
							...editing,
							project: null,
							title: editing.title.trim() || t("untitled"),
							tags: tagText.split(/[,，]/).map((value) => value.trim()).filter(Boolean)
						},
						sessionId: composer.sessionId || "",
						revision: data.revision
					});
					setEditing(null);
					reload();
					notify(t("saved"));
				});
			}
			async function saveDraft() {
				const body = composer.input?.draft ?? "";
				if (!body.trim()) return;
				await perform(async () => {
					const item = await api.call("favorites.add", {
						body,
						sessionId: composer.sessionId || ""
					});
					reload();
					notify(t("savedPrompt"), {
						label: t("edit"),
						run: () => void perform(() => edit(item.id))
					});
				});
			}
			async function use(item, how) {
				await perform(async () => {
					const { body } = await api.call("favorites.get", { id: item.id });
					const live = writer.current.current;
					const before = live.input?.draft ?? "";
					if (how === "replace" && live.input && !replacementEdits(live.input, body)) throw new Error(t("unsafeReplace"));
					const message = await writer.useText(body, how, live.input && captureDraft(live.sessionId, live.input));
					api.call("favorites.touch", { id: item.id }).catch(() => {});
					if (how === "copy") notify(message);
					else onWrite?.(how, before, composer.inputActions.captureInsertion().draftRev);
				});
			}
			async function remove(item) {
				if (!data) return;
				await perform(async () => {
					const removed = await api.call("favorites.delete", {
						id: item.id,
						revision: data.revision
					});
					reload();
					notify(format(t("deleted"), { title: item.title }), {
						label: t("undo"),
						run: () => void perform(async () => {
							await api.call("favorites.restore", removed);
							reload();
						})
					});
				});
			}
			async function move(id, target) {
				if (!data || id === target) return;
				const next = [...items], to = next.findIndex((v) => v.id === target), [moved] = next.splice(next.findIndex((v) => v.id === id), 1);
				next.splice(to, 0, moved);
				setItems(next);
				await perform(async () => {
					try {
						await api.call("favorites.reorder", {
							ids: next.map((v) => v.id),
							revision: data.revision
						});
					} finally {
						reload();
					}
				});
			}
			async function importFile(file) {
				if (!file || !data) return;
				await perform(async () => {
					if (file.size > 8 * 1024 * 1024) throw new Error(t("invalidFile"));
					const raw = await file.text(), preview = await api.call("favorites.import", {
						raw,
						revision: data.revision,
						commit: false
					});
					setImportData({
						raw,
						...preview
					});
				});
			}
			const canWrite = !management && !!composer.inputActions;
			const hasDraft = !!composer.input?.draft.trim();
			if (editing) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-library",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardHeader, {
						title: t("editPrompt"),
						t,
						onClose
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "pk-body pk-edit",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "pk-label",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "pk-input",
									value: editing.title,
									maxLength: 200,
									onChange: (e) => setEditing({
										...editing,
										title: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "pk-label",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("body") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: "pk-input pk-textarea",
									rows: 6,
									maxLength: 2e4,
									value: editing.body,
									onChange: (e) => setEditing({
										...editing,
										body: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "pk-label",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("tags") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "pk-input",
									placeholder: t("tagsPlaceholder"),
									value: tagText,
									onChange: (e) => setTagText(e.target.value)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBar, {
						error: task.error,
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								onClick: () => setEditing(null),
								children: t("cancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								primary: true,
								disabled: !data || !editing.body.trim() || task.busy,
								onClick: save,
								children: t("save")
							})
						]
					})
				]
			});
			const filters = [...BUILT_IN, ...data?.tags ?? []];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-library",
				children: [
					!management && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardHeader, {
						title: t("library"),
						t,
						onClose
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "pk-body",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "pk-input",
								type: "search",
								"aria-label": t("search"),
								placeholder: t("search"),
								value: search,
								onChange: (e) => {
									setSearch(e.target.value);
									setLimit(management ? 200 : 50);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "pk-chips",
								role: "group",
								"aria-label": t("tags"),
								children: filters.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "pk-chip",
									"aria-pressed": filter === value,
									onClick: () => {
										setFilter(value);
										setLimit(management ? 200 : 50);
									},
									children: value === "all" ? t("all") : value === "untagged" ? t("global") : value
								}, value))
							}),
							importData && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "pk-box",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("importPreview") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
										t("added"),
										": ",
										importData.added,
										" · ",
										t("duplicates"),
										":",
										" ",
										importData.duplicates
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "pk-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											primary: true,
											onClick: () => perform(async () => {
												await api.call("favorites.import", {
													...importData,
													commit: true
												});
												setImportData(null);
												reload();
												notify(t("imported"));
											}),
											children: t("importConfirm")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
											onClick: () => setImportData(null),
											children: t("cancel")
										})]
									})
								]
							}),
							!data && !error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loading, { text: t("loading") }),
							data && !items.length && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "pk-empty",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: data.total || search || filter !== "all" ? t("noMatch") : t("emptyLibrary") })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: "pk-list",
								"aria-label": t("library"),
								children: items.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: "pk-row-item",
									"data-dragging": dragging === item.id || void 0,
									"data-over": over === item.id && dragging !== item.id || void 0,
									onDragOver: (event) => {
										if (!dragging) return;
										event.preventDefault();
										setOver(item.id);
									},
									onDragLeave: () => setOver((v) => v === item.id ? null : v),
									onDrop: (event) => {
										event.preventDefault();
										const id = dragging;
										setDragging(null);
										setOver(null);
										if (id) move(id, item.id);
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "pk-grip",
											draggable: true,
											title: t("drag"),
											"aria-label": `${t("drag")}: ${item.title}`,
											onDragStart: (event) => {
												event.dataTransfer.effectAllowed = "move";
												event.dataTransfer.setData("text/plain", item.id);
												setDragging(item.id);
											},
											onDragEnd: () => {
												setDragging(null);
												setOver(null);
											},
											onKeyDown: (event) => {
												const target = event.key === "ArrowUp" ? items[index - 1] : event.key === "ArrowDown" ? items[index + 1] : void 0;
												if (!target) return;
												event.preventDefault();
												move(item.id, target.id);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripVertical, {
												size: 14,
												"aria-hidden": true
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "pk-row-main",
											title: canWrite ? t("append") : t("edit"),
											onClick: () => canWrite ? void use(item, "append") : void perform(() => edit(item.id)),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "pk-row-title",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: item.title }), item.tags.map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "pk-pill",
													children: tag
												}, tag))]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: item.excerpt })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "pk-row-actions",
											children: [
												canWrite && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: t("replace"),
													onClick: () => use(item, "replace"),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowLeftRight, {
														size: 15,
														"aria-hidden": true
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: t("copy"),
													onClick: () => use(item, "copy"),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Copy, {
														size: 15,
														"aria-hidden": true
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: t("edit"),
													onClick: () => perform(() => edit(item.id)),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Pencil, {
														size: 15,
														"aria-hidden": true
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
													label: t("delete"),
													onClick: () => remove(item),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Trash, {
														size: 15,
														"aria-hidden": true
													})
												})
											]
										})
									]
								}, item.id))
							}),
							data && data.total > items.length && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
								onClick: () => setLimit((value) => Math.min(value + 50, 5e3)),
								children: [
									t("showMore"),
									" (",
									items.length,
									"/",
									data.total,
									")"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBar, {
						error: error || task.error,
						t,
						onRetry: error ? reload : void 0
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "pk-foot",
						children: [
							management ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									onClick: () => {
										setEditing({
											...blank(),
											project: null
										});
										setTagText("");
									},
									children: t("newPrompt")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "pk-button pk-import",
									children: [t("import"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "pk-file",
										type: "file",
										accept: "application/json,.json",
										onChange: (e) => {
											importFile(e.target.files?.[0]);
											e.target.value = "";
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									onClick: () => perform(async () => download("promptkit-favorites.json", await api.call("favorites.export", {}))),
									children: t("export")
								})
							] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: !hasDraft || task.busy,
								title: hasDraft ? void 0 : t("emptyDraftHint"),
								onClick: saveDraft,
								children: t("saveDraft")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "pk-grow" }),
							items.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "pk-caption",
								children: t("dragHint")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/Popover.tsx
		/** 输入框容器：从图标往上找第一个包含编辑区的祖先，找不到就用图标本身。 */
		function composerOf(anchor) {
			for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) if (node.querySelector("[contenteditable=true],textarea")) return node;
			return anchor;
		}
		/**
		* 原生 popover="auto"：Esc 和点击外部由浏览器关闭。
		* 菜单贴着图标弹出；卡片浮在输入框上方，与输入框同宽。
		* 鼠标打开时聚焦容器，键盘打开时聚焦第一个控件。
		*/
		function Popover({ anchor, label, onClose, children, menu = false, focusFirst = false }) {
			const panel = (0, react.useRef)(null), close = (0, react.useRef)(onClose);
			close.current = onClose;
			(0, react.useLayoutEffect)(() => {
				const element = panel.current, composer = composerOf(anchor), before = document.activeElement;
				element.setAttribute("popover", "auto");
				function position() {
					if (menu) {
						const rect = anchor.getBoundingClientRect(), bounds = element.getBoundingClientRect();
						element.style.left = `${Math.max(8, Math.min(rect.right - bounds.width, innerWidth - bounds.width - 8))}px`;
						const above = rect.top - bounds.height - 8;
						element.style.top = `${Math.max(8, Math.min(above >= 8 ? above : rect.bottom + 8, innerHeight - bounds.height - 8))}px`;
						return;
					}
					const box = composer.getBoundingClientRect(), width = Math.max(0, Math.min(box.width, innerWidth - 16)), room = box.top - 16;
					element.style.width = `${width}px`;
					element.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`;
					if (room >= 240) {
						element.style.maxHeight = `${Math.min(room, innerHeight * .62)}px`;
						element.style.top = "auto";
						element.style.bottom = `${innerHeight - box.top + 8}px`;
					} else {
						const below = innerHeight - box.bottom - 16;
						element.style.maxHeight = `${Math.max(0, Math.min(below >= 240 ? below : innerHeight - 16, innerHeight * .62))}px`;
						element.style.bottom = below >= 240 ? "auto" : "8px";
						element.style.top = below >= 240 ? `${box.bottom + 8}px` : "auto";
					}
				}
				const toggle = (event) => {
					if (event.newState === "closed") close.current();
				};
				element.addEventListener("toggle", toggle);
				element.showPopover();
				position();
				const observer = new ResizeObserver(position);
				observer.observe(element);
				observer.observe(composer);
				window.addEventListener("resize", position);
				window.addEventListener("scroll", position, true);
				if (focusFirst) element.querySelector("[role=menuitem],.pk-body input,.pk-body textarea,.pk-body button,.pk-foot button")?.focus();
				else element.focus({ preventScroll: true });
				return () => {
					element.removeEventListener("toggle", toggle);
					observer.disconnect();
					window.removeEventListener("resize", position);
					window.removeEventListener("scroll", position, true);
					element.hidePopover();
					if (element.contains(document.activeElement) && before?.isConnected) before.focus();
				};
			}, [anchor, menu]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: panel,
				className: `pk-panel pk-flyout${menu ? " pk-menu" : " pk-card"}`,
				tabIndex: -1,
				role: menu ? "menu" : "dialog",
				"aria-label": label,
				"data-keyboard": focusFirst || void 0,
				onKeyDownCapture: (event) => {
					event.currentTarget.dataset.keyboard = "true";
				},
				onPointerDownCapture: (event) => {
					event.currentTarget.dataset.keyboard = "false";
				},
				children
			});
		}
		/**
		* 卡片关闭后的提示条：manual popover 放进顶层，压在输入框上方居中。
		* 卡片打开时提示条直接渲染在卡片里，避免点击它触发卡片的点击外部关闭。
		*/
		function Floating({ anchor, children }) {
			const box = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				const element = box.current;
				element.setAttribute("popover", "manual");
				element.showPopover();
				const rect = composerOf(anchor).getBoundingClientRect(), bounds = element.getBoundingClientRect();
				element.style.left = `${Math.max(8, Math.min(rect.left + (rect.width - bounds.width) / 2, innerWidth - bounds.width - 8))}px`;
				element.style.top = `${Math.max(8, rect.top - bounds.height - 8)}px`;
				return () => element.hidePopover();
			}, [anchor, children]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: box,
				className: "pk-flyout pk-floating",
				children
			});
		}
		//#endregion
		//#region src/client/App.tsx
		function App({ api, t, ...composer }) {
			api.language = t("settings") === "设置" ? "zh" : "en";
			const [config, setConfig] = (0, react.useState)(() => api.configuration ?? null);
			const [detailOverride, setDetailOverride] = (0, react.useState)(null);
			const detail = detailOverride ?? config?.settings.detail ?? "standard";
			const [scene, setScene] = (0, react.useState)(null);
			const [anchor, setAnchor] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)("");
			const [focusFirst, setFocusFirst] = (0, react.useState)(false);
			const { toast, notify, clear } = useToast();
			const pressedOpen = (0, react.useRef)(false), latest = (0, react.useRef)(composer);
			latest.current = composer;
			const entry = !scene ? null : scene.kind === "library" ? "library" : "enhance";
			function close() {
				setScene(null);
			}
			(0, react.useEffect)(() => {
				let controller;
				function refresh() {
					controller?.abort();
					const active = controller = new AbortController();
					api.call("config.read", {}, active.signal).then((value) => {
						if (active.signal.aborted) return;
						setConfig(value);
						setError("");
					}).catch((error) => {
						if (!active.signal.aborted) setError(error.message);
					});
				}
				refresh();
				const unsubscribe = api.onConfigurationChange(refresh);
				return () => {
					controller?.abort();
					unsubscribe();
				};
			}, [api]);
			const modes = config ? enabledModes(config) : [];
			const favorites = !!config?.settings.favoritesEnabled;
			const emptyDraft = !composer.input?.draft.trim();
			(0, react.useEffect)(() => {
				if (scene?.kind === "library" && !favorites || scene?.kind === "enhance" && !modes.includes(scene.mode) || scene?.kind === "menu" && (modes.length < 2 || emptyDraft)) close();
			}, [
				config,
				scene,
				emptyDraft
			]);
			(0, react.useEffect)(() => {
				close();
				clear();
			}, [composer.sessionId]);
			(0, react.useEffect)(() => {
				close();
			}, [config?.settings.detail, config?.settings.audience]);
			function open(kind, event) {
				if (pressedOpen.current || entry === kind) {
					pressedOpen.current = false;
					close();
					return;
				}
				clear();
				setAnchor(event.currentTarget);
				setFocusFirst(event.detail === 0);
				if (kind === "library") setScene({ kind: "library" });
				else if (modes.length === 1) setScene({
					kind: "enhance",
					mode: modes[0]
				});
				else setScene({ kind: "menu" });
			}
			const written = (how, before, revision) => {
				close();
				if (how === "append") return notify(t("appended"));
				const sessionId = composer.sessionId || "";
				notify(t("replaced"), {
					label: t("undo"),
					run: () => {
						if (latest.current.sessionId !== composer.sessionId || !revertDraft(latest.current.inputActions, () => latest.current.input, sessionId, before, revision)) notify(t("undoFailed"));
					}
				});
			};
			const single = modes.length === 1 ? modes[0] : null;
			const enhanceLabel = t(single === "grill" ? "grill" : "generate");
			const singleBlocked = emptyDraft;
			const toastView = toast && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toast, { toast });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-tools",
				children: [
					modes.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pk-tool pk-enhance-tool",
						"data-active": entry === "enhance" || void 0,
						title: singleBlocked ? t("emptyDraftHint") : enhanceLabel,
						"aria-label": enhanceLabel,
						"aria-disabled": singleBlocked || void 0,
						disabled: singleBlocked,
						"aria-expanded": entry === "enhance",
						"aria-haspopup": single ? "dialog" : "menu",
						onPointerDown: () => pressedOpen.current = entry === "enhance",
						onClick: (event) => {
							if (singleBlocked && entry !== "enhance") return;
							open("enhance", event);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sparkles, {
							size: 16,
							"aria-hidden": true
						})
					}),
					favorites && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pk-tool pk-library-tool",
						"data-active": entry === "library" || void 0,
						title: t("library"),
						"aria-label": t("library"),
						"aria-expanded": entry === "library",
						"aria-haspopup": "dialog",
						onPointerDown: () => pressedOpen.current = entry === "library",
						onClick: (event) => open("library", event),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Bookmark, {
							size: 16,
							"aria-hidden": true
						})
					}),
					scene?.kind === "menu" && anchor && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Popover, {
						anchor,
						label: t("enhanceBoth"),
						onClose: close,
						focusFirst,
						menu: true,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "pk-mode-menu",
							onKeyDown: navigateTabs,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "pk-depth-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("detail") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "pk-depth",
									role: "group",
									"aria-label": t("detail"),
									children: promptDetails.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": detail === item.value,
										title: api.language === "en" ? promptDetailLabelsEn[index] : item.description,
										onClick: () => setDetailOverride(item.value),
										children: api.language === "en" ? promptDetailLabelsEn[index] : item.label
									}, item.value))
								})]
							}), modes.map((mode) => {
								const blocked = emptyDraft;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "menuitem",
									"aria-disabled": blocked || void 0,
									disabled: blocked,
									title: blocked ? t("emptyDraftHint") : void 0,
									onClick: () => !blocked && setScene({
										kind: "enhance",
										mode
									}),
									children: [mode === "grill" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListChecks, {
										size: 16,
										"aria-hidden": true
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sparkles, {
										size: 16,
										"aria-hidden": true
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(mode === "grill" ? "grill" : "generate") })]
								}, mode);
							})]
						})
					}, "menu"),
					(scene?.kind === "enhance" || scene?.kind === "library") && anchor && config && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Popover, {
						anchor,
						label: t(scene.kind === "library" ? "library" : scene.mode === "grill" ? "grill" : "generate"),
						onClose: close,
						focusFirst,
						children: [scene.kind === "enhance" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Enhance, {
							api,
							t,
							config: {
								...config,
								settings: {
									...config.settings,
									detail
								}
							},
							mode: scene.mode,
							notify,
							onClose: close,
							onWrite: written,
							onEditFavorite: (id) => setScene({
								kind: "library",
								editId: id
							}),
							...composer
						}, `${composer.sessionId}:${scene.mode}:${detail}:${config.settings.audience}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Library, {
							api,
							t,
							editId: scene.editId,
							notify,
							onClose: close,
							onWrite: written,
							...composer
						}, `${composer.sessionId}:${scene.editId ?? ""}`), toastView]
					}, "card"),
					!scene && toastView && anchor && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Floating, {
						anchor,
						children: toastView
					}),
					!config && error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "pk-caption",
						role: "alert",
						title: error,
						children: error
					})
				]
			});
		}
		function enabledModes({ settings }) {
			return [settings.defaultMode, settings.defaultMode === "rewrite" ? "grill" : "rewrite"].filter((mode) => mode === "rewrite" ? settings.rewriteEnabled : settings.grillEnabled);
		}
		//#endregion
		//#region src/client/Settings.tsx
		function Settings({ api, t, onSaved }) {
			const { data, error, reload } = useData(api, "settings.read", {});
			const [draftSettings, setDraftSettings] = (0, react.useState)(null), [customRef, setCustomRef] = (0, react.useState)(false), [key, setKey] = (0, react.useState)("");
			const models = useData(api, "models.list", {}, draftSettings?.connection === "host");
			const credentials = useData(api, "credentials.list", {}, !!draftSettings);
			const efforts = useData(api, "models.efforts", {
				provider: draftSettings?.provider,
				model: draftSettings?.model
			}, draftSettings?.connection === "host" && !!draftSettings.provider);
			const task = useTask(), { perform } = task;
			(0, react.useEffect)(() => {
				if (data) setDraftSettings(data.settings);
			}, [data]);
			async function load() {
				reload();
				onSaved();
			}
			async function fillRule(key) {
				await perform(async () => {
					const rules = await api.call("rules.defaults", {});
					setDraftSettings((value) => value ? {
						...value,
						[key]: rules[key]
					} : value);
				});
			}
			if (!data || !draftSettings) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Status, { error }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				onClick: reload,
				children: t(error ? "retry" : "loading")
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Status, {
				error: task.error || error || models.error,
				notice: task.notice
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "pk-stack",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("features") }),
					[
						"rewriteEnabled",
						"grillEnabled",
						"favoritesEnabled"
					].map((k) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
						label: t(k),
						checked: draftSettings[k],
						onChange: (v) => setDraftSettings({
							...draftSettings,
							[k]: v
						})
					}, k)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("defaultMode"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: "pk-input",
							value: draftSettings.defaultMode,
							onChange: (e) => setDraftSettings({
								...draftSettings,
								defaultMode: e.target.value
							}),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "rewrite",
								children: t("generate")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "grill",
								children: t("grill")
							})]
						})
					}),
					["detail", "audience"].map((key) => {
						const options = key === "detail" ? promptDetails : promptAudiences;
						const english = key === "detail" ? promptDetailLabelsEn : promptAudienceLabelsEn;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Field, {
							label: t(key),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								className: "pk-input",
								value: draftSettings[key],
								onChange: (event) => setDraftSettings({
									...draftSettings,
									[key]: event.target.value
								}),
								children: options.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: item.value,
									children: api.language === "en" ? english[index] : item.label
								}, item.value))
							}), api.language !== "en" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "pk-caption",
								children: options.find((item) => item.value === draftSettings[key])?.description
							})]
						}, key);
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("rules") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "pk-stack",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "pk-caption",
							children: t("rulesHint")
						}), ["systemPrompt", "grillSystemPrompt"].map((k) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "pk-stack",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
								label: t(k === "systemPrompt" ? "rewriteRule" : "grillRule"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: "pk-input pk-textarea",
									value: draftSettings[k],
									onChange: (e) => setDraftSettings({
										...draftSettings,
										[k]: e.target.value
									})
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "pk-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									onClick: () => fillRule(k),
									children: t("fillDefault")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									onClick: () => setDraftSettings({
										...draftSettings,
										[k]: ""
									}),
									children: t("useDefault")
								})]
							})]
						}, k))]
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { className: "pk-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
						label: t("contextEnabled"),
						checked: draftSettings.context.enabled,
						onChange: (v) => setDraftSettings({
							...draftSettings,
							context: {
								...draftSettings.context,
								enabled: v
							}
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "pk-caption",
						children: t("contextWarning")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("contextItems") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "pk-stack",
						children: [
							"project",
							"instructions",
							"directory",
							"manifests"
						].map((k) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
							label: t(k === "project" ? "projectInfo" : k),
							disabled: !draftSettings.context.enabled,
							checked: draftSettings.context[k],
							onChange: (v) => setDraftSettings({
								...draftSettings,
								context: {
									...draftSettings.context,
									[k]: v
								}
							})
						}, k))
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { className: "pk-divider" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("connection"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: "pk-input",
							value: draftSettings.connection,
							onChange: (e) => setDraftSettings({
								...draftSettings,
								connection: e.target.value
							}),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "host",
								children: t("host")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "independent",
								children: t("independent")
							})]
						})
					}),
					draftSettings.connection === "host" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("hostModel"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: "pk-input",
							value: draftSettings.provider ? `${draftSettings.provider}\n${draftSettings.model}` : "",
							onChange: (e) => {
								const [provider = "", model = ""] = e.target.value.split("\n");
								setDraftSettings({
									...draftSettings,
									provider,
									model
								});
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t("defaultModel")
							}), (models.data || []).map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: `${m.provider}\n${m.model}`,
								children: m.label
							}, `${m.provider}/${m.model}`))]
						})
					}), !!efforts.data?.efforts?.length && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("reasoningEffort"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: "pk-input",
							value: draftSettings.reasoningEffort,
							onChange: (e) => setDraftSettings({
								...draftSettings,
								reasoningEffort: e.target.value
							}),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t("effortAuto")
							}), efforts.data.efforts.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: effort.id,
								children: effort.name
							}, effort.id))]
						})
					})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: t("baseUrl"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "pk-input",
								type: "url",
								value: draftSettings.baseUrl,
								onChange: (e) => setDraftSettings({
									...draftSettings,
									baseUrl: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: t("model"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "pk-input",
								value: draftSettings.model,
								onChange: (e) => setDraftSettings({
									...draftSettings,
									model: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: t("protocol"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								className: "pk-input",
								value: draftSettings.protocol,
								onChange: (e) => setDraftSettings({
									...draftSettings,
									protocol: e.target.value
								}),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "chat_completions",
										children: "Chat Completions"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "responses",
										children: "Responses"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "anthropic_messages",
										children: "Anthropic Messages"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "auto",
										children: t("auto")
									})
								]
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: t("key"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "pk-input",
								type: "password",
								autoComplete: "new-password",
								value: key,
								onChange: (e) => setKey(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "pk-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: !key,
								onClick: () => perform(async () => {
									await api.call("settings.save", { settings: draftSettings });
									await api.call("credential.save", { key });
									setKey("");
									await load();
								}, t("saved")),
								children: t("saveKey")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								disabled: !data.credentialConfigured,
								onClick: () => perform(async () => {
									await api.call("credential.remove", {});
									await load();
								}, t("saved")),
								children: t("removeKey")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "pk-caption",
							children: t(credentials.data?.find((item) => item.name === draftSettings.credentialRef)?.configured ?? (draftSettings.credentialRef === data.settings.credentialRef && data.credentialConfigured) ? "keyConfigured" : "keyMissing")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("credentialRef") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "pk-stack",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "pk-caption",
									children: t("credentialRefHint")
								}),
								customRef ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "pk-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "pk-input",
										autoComplete: "off",
										placeholder: t("newCredentialRef"),
										value: draftSettings.credentialRef,
										onChange: (e) => setDraftSettings({
											...draftSettings,
											credentialRef: e.target.value
										})
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										onClick: () => setCustomRef(false),
										children: t("chooseExisting")
									})]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: "pk-input",
									"aria-label": t("credentialRef"),
									value: draftSettings.credentialRef,
									onChange: (e) => {
										if (e.target.value === "__custom__") setCustomRef(true);
										else setDraftSettings({
											...draftSettings,
											credentialRef: e.target.value
										});
									},
									children: [
										!credentials.data?.some((item) => item.name === draftSettings.credentialRef) && draftSettings.credentialRef && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: draftSettings.credentialRef,
											children: draftSettings.credentialRef
										}),
										(credentials.data || []).map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: item.name,
											children: [item.name, item.configured ? " ✓" : ""]
										}, item.name)),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "__custom__",
											children: t("newCredentialRef")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "pk-caption",
									children: t("keyHint")
								})
							]
						})] })
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("timeout"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "pk-input",
							type: "number",
							min: 5,
							max: 300,
							value: draftSettings.timeoutSeconds,
							onChange: (e) => setDraftSettings({
								...draftSettings,
								timeoutSeconds: Number(e.target.value)
							})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
						primary: true,
						onClick: () => perform(async () => {
							await api.call("settings.save", { settings: draftSettings });
							await load();
						}, t("saved")),
						children: t("save")
					})
				]
			})] });
		}
		//#endregion
		//#region src/client/Management.tsx
		function Management({ api, t }) {
			api.language = t("settings") === "设置" ? "zh" : "en";
			const [tab, setTab] = (0, react.useState)("settings");
			const { toast, notify } = useToast();
			const { data, error, reload } = useData(api, "config.read", {});
			const tabs = ["settings", ...data?.settings.favoritesEnabled ? ["library"] : []];
			const active = tabs.includes(tab) ? tab : "settings";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "pk-panel pk-management",
				"aria-label": "PromptKit",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "pk-tabs",
					role: "tablist",
					"aria-label": "PromptKit",
					onKeyDown: navigateTabs,
					children: tabs.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "pk-tab",
						role: "tab",
						"aria-selected": active === name,
						tabIndex: active === name ? 0 : -1,
						onClick: () => setTab(name),
						children: t(name)
					}, name))
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "pk-content",
					role: "tabpanel",
					"aria-label": t(active),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Status, { error }),
						active === "settings" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Settings, {
							api,
							t,
							onSaved: reload
						}),
						active === "library" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Library, {
							api,
							t,
							management: true,
							notify
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toast, { toast })
					]
				})]
			});
		}
		//#endregion
		//#region src/client/style.ts
		const css = `
.pk-tools{display:flex;align-items:center;gap:2px}
.pk-tool,.pk-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pk-tool:hover,.pk-icon:hover:not(:disabled),.pk-tool[data-active]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pk-tool[aria-disabled=true]{opacity:.35;cursor:default;background:transparent}
.pk-library-tool{order:0}.pk-enhance-tool{order:1}
.pk-follow-row{display:flex;align-items:center;gap:8px;flex:none}.pk-follow-row .pk-follow{flex:1;min-width:0}
.pk-tool svg,.pk-icon svg{display:block;flex:none}
.pk-icon:disabled{opacity:.35;cursor:default}
.pk-tool:focus-visible,.pk-icon:focus-visible,.pk-button:focus-visible,.pk-input:focus-visible,.pk-tab:focus-visible,.pk-chip:focus-visible,.pk-link:focus-visible,.pk-grip:focus-visible,.pk-row-main:focus-visible,.pk-option:focus-visible,.pk-mode-menu button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.pk-flyout{position:fixed;inset:auto;margin:0;padding:0;z-index:1200}
.pk-flyout:not(:popover-open){display:none}
.pk-flyout::backdrop{background:transparent;pointer-events:none}
.pk-panel{box-sizing:border-box;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;font-size:13px;line-height:1.55;overflow:hidden}
.pk-menu{width:280px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:4px}
.pk-mode-menu{display:flex;flex-direction:column;gap:2px}
.pk-mode-menu button{font:inherit;color:inherit;text-align:left;border:0;background:transparent;border-radius:8px;padding:7px 10px;cursor:pointer}
.pk-mode-menu button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.pk-mode-menu button[aria-disabled=true]{opacity:.5;cursor:default;background:transparent}
.pk-mode-menu [role=menuitem]{display:flex;align-items:center;gap:10px;padding:10px 12px}
.pk-mode-menu small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-mode-menu .pk-depth-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 5px 10px;margin-bottom:4px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary)}
.pk-depth{display:flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-mode-menu .pk-depth button{padding:4px 9px;font-size:12px;text-align:center;color:var(--dsw-alias-label-secondary)}
.pk-mode-menu .pk-depth button[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.pk-flyout:focus{outline:none}
.pk-flyout button:focus{outline:none;box-shadow:none}
.pk-flyout[data-keyboard=true] button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.pk-mode-menu button:focus:not(:focus-visible),.pk-tool:focus:not(:focus-visible),.pk-option:focus:not(:focus-visible){outline:none;box-shadow:none}
.pk-card>.pk-workflow,.pk-card>.pk-library{flex:1;min-height:0;display:flex;flex-direction:column}
.pk-head{display:flex;align-items:center;gap:8px;padding:10px 10px 8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}
.pk-head h2{font-size:14px;font-weight:600;margin:0}
.pk-meta{color:var(--dsw-alias-label-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-grow{flex:1}
.pk-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent}
.pk-foot{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l2);flex:none;flex-wrap:wrap}
.pk-stale{display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);flex:none}
.pk-error-bar{display:flex;align-items:flex-start;gap:10px;padding:8px 16px;color:var(--dsw-alias-state-error-primary);border-top:1px solid var(--dsw-alias-border-l2);white-space:pre-wrap;overflow-wrap:anywhere;flex:none}
.pk-error-bar>span{flex:1}
.pk-link{font:inherit;font-size:13px;border:0;background:transparent;color:var(--dsw-alias-state-business-primary);padding:2px 4px;border-radius:4px;cursor:pointer;white-space:nowrap}
.pk-foot .pk-link{color:var(--dsw-alias-label-secondary)}
.pk-foot .pk-link:hover{color:var(--dsw-alias-label-primary)}
.pk-link:disabled{opacity:.45;cursor:default}
.pk-loading{display:flex;align-items:center;gap:10px;color:var(--dsw-alias-label-secondary);padding:20px 0}
.pk-spin{width:14px;height:14px;box-sizing:border-box;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-label-secondary);border-radius:50%;animation:pk-spin .8s linear infinite}
@keyframes pk-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.pk-spin{animation:none}}
.pk-question-row{display:flex;align-items:flex-start;gap:8px}
.pk-question{flex:1;font-size:14px;font-weight:600;line-height:1.5;margin:0;overflow-wrap:anywhere}
.pk-options{display:flex;flex-direction:column;gap:2px}
.pk-option{font:inherit;color:inherit;display:flex;align-items:flex-start;gap:10px;width:100%;box-sizing:border-box;text-align:left;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer}
.pk-option:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.pk-option[aria-checked=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
.pk-option:disabled{opacity:.5;cursor:default}
.pk-option>span:last-child{min-width:0;overflow-wrap:anywhere}
.pk-option strong{font-weight:500}
.pk-option small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:2px}
.pk-option-number{display:inline-flex;align-items:center;justify-content:center;flex:none;width:22px;height:22px;border-radius:5px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:1px}
.pk-option-editing{align-items:center;border-color:var(--dsw-alias-state-business-primary);cursor:text}
.pk-option-editing input{flex:1;min-width:0;font:inherit;color:inherit;background:transparent;border:0;outline:none;padding:2px 0}
.pk-badge{color:var(--dsw-alias-state-business-primary);font-size:11px;margin-left:6px}
.pk-answered{list-style:none;margin:4px 0 0;padding:0;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-answered li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-answered span{color:var(--dsw-alias-label-primary)}
.pk-pager{display:inline-flex;align-items:center;gap:2px;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-pager{min-width:0;max-width:100%;flex:0 1 auto}.pk-dots{display:flex;gap:4px;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;padding:3px 1px;max-width:440px}
.pk-dot{font:inherit;font-size:11px;width:23px;height:23px;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);padding:0;cursor:pointer}
.pk-dot[aria-current=step]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary)}
.pk-dot[data-answered=true]{background:var(--dsw-alias-interactive-bg-hover)}
.pk-decisions{position:sticky;bottom:0;display:flex;align-items:center;gap:12px;padding:12px 0 4px;background:var(--dsw-alias-bg-base);flex:none}.pk-decisions .pk-link{font-size:12px;color:var(--dsw-alias-label-secondary)}.pk-decisions [aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
.pk-basis{line-height:1.7;margin-bottom:2px}.pk-options{gap:8px}.pk-option{padding:12px 10px}.pk-head{padding:14px 18px}.pk-body{padding:18px;gap:16px}.pk-foot{padding:12px 18px}.pk-question{font-size:15px}
.pk-more{position:relative;font-size:12px}.pk-more summary{list-style:none;border:1px solid var(--dsw-alias-border-l2);padding:5px 10px;border-radius:8px}
.pk-more-menu{position:fixed;z-index:2;transform:translate(-95px,-135px);padding:5px;display:flex;flex-direction:column;gap:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-more-menu .pk-button{border:0;text-align:left}
.pk-summary{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.75;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover)}
.pk-body.is-result{overflow:hidden}
.pk-result{flex:1 1 280px;resize:none;min-height:60px;border:0;background:transparent;padding:2px;line-height:1.75;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent}
.pk-context{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default}
.pk-toast{display:flex;align-items:center;gap:12px;padding:7px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;white-space:nowrap}
.pk-card>.pk-toast{position:absolute;left:50%;bottom:52px;transform:translateX(-50%);z-index:1}
.pk-floating{border:0;background:transparent}
.pk-chips{display:flex;gap:6px;flex-wrap:wrap}
.pk-chip{font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:1px 10px;cursor:pointer}
.pk-chip:hover{color:var(--dsw-alias-label-primary)}
.pk-chip[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-interactive-bg-hover));border-color:transparent}
.pk-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.pk-row-item{position:relative;display:flex;align-items:flex-start;gap:4px;padding:2px 4px 2px 0;border-radius:8px}
.pk-row-item:hover,.pk-row-item:focus-within{background:var(--dsw-alias-interactive-bg-hover)}
.pk-row-item[data-dragging]{opacity:.4}
.pk-row-item[data-over]{box-shadow:inset 0 2px 0 var(--dsw-alias-state-business-primary)}
.pk-grip{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:28px;margin-top:4px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:grab;opacity:.55}
.pk-row-item:hover .pk-grip,.pk-grip:focus-visible{opacity:1}
.pk-row-main{flex:1;min-width:0;font:inherit;color:inherit;text-align:left;background:transparent;border:0;padding:6px 4px;cursor:pointer;border-radius:6px}
.pk-row-title{display:flex;align-items:center;gap:6px;min-width:0}
.pk-row-title strong{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-row-main small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-pill{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;padding:0 7px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-row-actions{display:none;align-items:center;gap:1px;padding-top:5px;flex:none}
.pk-row-item:hover .pk-row-actions,.pk-row-item:focus-within .pk-row-actions{display:flex}
.pk-row-actions .pk-icon{width:26px;height:26px}
.pk-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-secondary);padding:30px 12px;min-height:100px;text-align:center}
.pk-empty p{margin:0}
.pk-edit{gap:12px}
.pk-check{display:flex;align-items:center;gap:6px}
.pk-check input{accent-color:var(--dsw-alias-state-business-primary)}
.pk-button{font:inherit;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 12px;cursor:pointer;white-space:nowrap;min-height:30px}
.pk-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.pk-button:disabled{opacity:.45;cursor:default}
.pk-button[data-primary=true]{background:var(--dsw-alias-button-info-fill);color:var(--dsw-alias-label-primary-bluish);border-color:transparent}
.pk-input{box-sizing:border-box;width:100%;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}
.pk-input:disabled{opacity:.5}
.pk-input.pk-result{border:0;background:transparent;padding:2px}
.pk-textarea{resize:vertical;min-height:120px;line-height:1.65}
.pk-label{display:flex;flex-direction:column;gap:5px}
.pk-label>span{color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-caption{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0}
.pk-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px}
.pk-switch input{accent-color:var(--dsw-alias-state-business-primary)}
.pk-box{padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-box p{margin:6px 0}
.pk-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pk-stack{display:flex;flex-direction:column;gap:12px}
.pk-divider{border:0;border-top:1px solid var(--dsw-alias-border-l2);margin:10px 0}
.pk-error{color:var(--dsw-alias-state-error-primary);padding:8px 0;white-space:pre-wrap}
.pk-notice{padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;color:var(--dsw-alias-label-secondary)}
.pk-panel summary{cursor:pointer}
.pk-management{border:0;border-radius:0;background:transparent;overflow:visible}
.pk-tabs{display:flex;gap:4px;overflow:auto;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}
.pk-tab{font:inherit;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:6px 10px;border-radius:7px;cursor:pointer;white-space:nowrap}
.pk-tab[aria-selected=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-interactive-bg-hover))}
.pk-content{padding:16px 0}
.pk-management .pk-body{padding:0;overflow:visible}
.pk-management .pk-foot{padding:12px 0 0;border:0}
.pk-management .pk-error-bar{padding:8px 0}
.pk-management .pk-toast{position:sticky;bottom:8px;width:max-content;margin:8px auto 0}
.pk-import{position:relative;display:inline-flex;align-items:center}
.pk-import .pk-file{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}
.pk-import:focus-within{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
@media(hover:none){.pk-row-actions{display:flex}.pk-grip{opacity:1}}
@media(max-width:600px){.pk-body{padding:10px 12px}.pk-head{padding:8px 8px 6px 12px}.pk-foot{padding:8px}}
`;
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"remote"
		];
		async function apply(ctx) {
			try {
				const host = ctx;
				ctx.effect(() => host.locale.register("promptkit", {
					en,
					zh
				}));
				const unmountRemote = await host.remote.$mount(remoteContribution);
				ctx.effect(() => unmountRemote);
				ctx.inject([
					"remote.promptkit",
					"remote",
					"slots",
					"locale"
				], (child) => {
					const services = child;
					const api = new Api(services.remote.promptkit);
					child.effect(() => () => api.dispose());
					child.effect(() => {
						const style = document.createElement("style");
						style.dataset.plugin = "@nk33-dev/dsh-promptkit";
						style.textContent = css;
						document.head.appendChild(style);
						return () => style.remove();
					});
					const Composer = (props) => react.default.createElement(App, {
						api,
						t: props.t,
						sessionId: props.sessionId,
						input: props.useInput((s) => s),
						inputActions: props.inputActions
					});
					services.slots.inject("conversation.input.right", () => services.slots.register({
						name: "conversation.input.right",
						id: "nk33-promptkit",
						order: 20,
						locale: "promptkit"
					}, Composer));
					const Settings = (props) => react.default.createElement(Management, {
						api,
						t: props.t
					});
					services.slots.inject("settings.section", () => services.slots.register({
						name: "settings.section",
						id: "nk33-promptkit",
						order: 80,
						label: "PromptKit",
						locale: "promptkit"
					}, Settings));
				});
			} catch (error) {
				console.error("PromptKit activation failed", error);
				throw error;
			}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
