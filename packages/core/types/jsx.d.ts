type Booleanish = boolean | 'true' | 'false';

type Ref<T> = { value: T };
type Getter<T> = (...args: any[]) => T;
type MaybeRefLike<T> = T | Ref<T> | Getter<T>;

declare namespace JSX {
  export interface IntrinsicAttributes {
    key?: any;
    children?: any;
  }

  export interface ElementAttributesProperty {
    props: any;
  }

  export interface ElementChildrenAttribute {
    children?: any;
  }

  export type RefLike<T> = MaybeRefLike<T>;

  export type UnRef<T> = T extends RefLike<infer V> ? V : T;

  export interface SVGAttributes<Target extends EventTarget = SVGElement>
    extends HTMLAttributes<Target> {
    accentHeight?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    accumulate?:
      | 'none'
      | 'sum'
      | undefined
      | RefLike<'none' | 'sum' | undefined>;
    additive?:
      | 'replace'
      | 'sum'
      | undefined
      | RefLike<'replace' | 'sum' | undefined>;
    alignmentBaseline?:
      | 'auto'
      | 'baseline'
      | 'before-edge'
      | 'text-before-edge'
      | 'middle'
      | 'central'
      | 'after-edge'
      | 'text-after-edge'
      | 'ideographic'
      | 'alphabetic'
      | 'hanging'
      | 'mathematical'
      | 'inherit'
      | undefined
      | RefLike<
          | 'auto'
          | 'baseline'
          | 'before-edge'
          | 'text-before-edge'
          | 'middle'
          | 'central'
          | 'after-edge'
          | 'text-after-edge'
          | 'ideographic'
          | 'alphabetic'
          | 'hanging'
          | 'mathematical'
          | 'inherit'
          | undefined
        >;
    allowReorder?: 'no' | 'yes' | undefined | RefLike<'no' | 'yes' | undefined>;
    alphabetic?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    amplitude?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    arabicForm?:
      | 'initial'
      | 'medial'
      | 'terminal'
      | 'isolated'
      | undefined
      | RefLike<'initial' | 'medial' | 'terminal' | 'isolated' | undefined>;
    ascent?: number | string | undefined | RefLike<number | string | undefined>;
    attributeName?: string | undefined | RefLike<string | undefined>;
    attributeType?: string | undefined | RefLike<string | undefined>;
    autoReverse?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    azimuth?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    baseFrequency?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    baselineShift?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    baseProfile?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    bbox?: number | string | undefined | RefLike<number | string | undefined>;
    begin?: number | string | undefined | RefLike<number | string | undefined>;
    bias?: number | string | undefined | RefLike<number | string | undefined>;
    by?: number | string | undefined | RefLike<number | string | undefined>;
    calcMode?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    capHeight?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    clip?: number | string | undefined | RefLike<number | string | undefined>;
    clipPath?: string | undefined | RefLike<string | undefined>;
    clipPathUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    clipRule?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    colorInterpolation?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    colorInterpolationFilters?:
      | 'auto'
      | 'sRGB'
      | 'linearRGB'
      | 'inherit'
      | undefined
      | RefLike<'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined>;
    colorProfile?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    colorRendering?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    contentScriptType?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    contentStyleType?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    cursor?: number | string | undefined | RefLike<number | string | undefined>;
    cx?: number | string | undefined | RefLike<number | string | undefined>;
    cy?: number | string | undefined | RefLike<number | string | undefined>;
    d?: string | undefined | RefLike<string | undefined>;
    decelerate?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    descent?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    diffuseConstant?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    direction?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    display?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    divisor?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    dominantBaseline?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    dur?: number | string | undefined | RefLike<number | string | undefined>;
    dx?: number | string | undefined | RefLike<number | string | undefined>;
    dy?: number | string | undefined | RefLike<number | string | undefined>;
    edgeMode?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    elevation?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    enableBackground?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    end?: number | string | undefined | RefLike<number | string | undefined>;
    exponent?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    externalResourcesRequired?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fill?: string | undefined | RefLike<string | undefined>;
    fillOpacity?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fillRule?:
      | 'nonzero'
      | 'evenodd'
      | 'inherit'
      | undefined
      | RefLike<'nonzero' | 'evenodd' | 'inherit' | undefined>;
    filter?: string | undefined | RefLike<string | undefined>;
    filterRes?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    filterUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    floodColor?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    floodOpacity?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    focusable?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontFamily?: string | undefined | RefLike<string | undefined>;
    fontSize?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontSizeAdjust?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontStretch?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontStyle?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontVariant?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    fontWeight?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    format?: number | string | undefined | RefLike<number | string | undefined>;
    from?: number | string | undefined | RefLike<number | string | undefined>;
    fx?: number | string | undefined | RefLike<number | string | undefined>;
    fy?: number | string | undefined | RefLike<number | string | undefined>;
    g1?: number | string | undefined | RefLike<number | string | undefined>;
    g2?: number | string | undefined | RefLike<number | string | undefined>;
    glyphName?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    glyphOrientationHorizontal?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    glyphOrientationVertical?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    glyphRef?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    gradientTransform?: string | undefined | RefLike<string | undefined>;
    gradientUnits?: string | undefined | RefLike<string | undefined>;
    hanging?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    horizAdvX?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    horizOriginX?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    ideographic?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    imageRendering?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    in2?: number | string | undefined | RefLike<number | string | undefined>;
    in?: string | undefined | RefLike<string | undefined>;
    intercept?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    k1?: number | string | undefined | RefLike<number | string | undefined>;
    k2?: number | string | undefined | RefLike<number | string | undefined>;
    k3?: number | string | undefined | RefLike<number | string | undefined>;
    k4?: number | string | undefined | RefLike<number | string | undefined>;
    k?: number | string | undefined | RefLike<number | string | undefined>;
    kernelMatrix?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    kernelUnitLength?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    kerning?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    keyPoints?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    keySplines?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    keyTimes?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    lengthAdjust?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    letterSpacing?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    lightingColor?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    limitingConeAngle?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    local?: number | string | undefined | RefLike<number | string | undefined>;
    markerEnd?: string | undefined | RefLike<string | undefined>;
    markerHeight?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    markerMid?: string | undefined | RefLike<string | undefined>;
    markerStart?: string | undefined | RefLike<string | undefined>;
    markerUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    markerWidth?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    mask?: string | undefined | RefLike<string | undefined>;
    maskContentUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    maskUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    mathematical?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    mode?: number | string | undefined | RefLike<number | string | undefined>;
    numOctaves?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    offset?: number | string | undefined | RefLike<number | string | undefined>;
    opacity?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    operator?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    order?: number | string | undefined | RefLike<number | string | undefined>;
    orient?: number | string | undefined | RefLike<number | string | undefined>;
    orientation?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    origin?: number | string | undefined | RefLike<number | string | undefined>;
    overflow?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    overlinePosition?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    overlineThickness?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    paintOrder?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    panose1?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    pathLength?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    patternContentUnits?: string | undefined | RefLike<string | undefined>;
    patternTransform?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    patternUnits?: string | undefined | RefLike<string | undefined>;
    pointerEvents?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    points?: string | undefined | RefLike<string | undefined>;
    pointsAtX?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    pointsAtY?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    pointsAtZ?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    preserveAlpha?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    preserveAspectRatio?: string | undefined | RefLike<string | undefined>;
    primitiveUnits?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    r?: number | string | undefined | RefLike<number | string | undefined>;
    radius?: number | string | undefined | RefLike<number | string | undefined>;
    refX?: number | string | undefined | RefLike<number | string | undefined>;
    refY?: number | string | undefined | RefLike<number | string | undefined>;
    renderingIntent?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    repeatCount?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    repeatDur?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    requiredExtensions?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    requiredFeatures?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    restart?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    result?: string | undefined | RefLike<string | undefined>;
    rotate?: number | string | undefined | RefLike<number | string | undefined>;
    rx?: number | string | undefined | RefLike<number | string | undefined>;
    ry?: number | string | undefined | RefLike<number | string | undefined>;
    scale?: number | string | undefined | RefLike<number | string | undefined>;
    seed?: number | string | undefined | RefLike<number | string | undefined>;
    shapeRendering?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    slope?: number | string | undefined | RefLike<number | string | undefined>;
    spacing?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    specularConstant?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    specularExponent?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    speed?: number | string | undefined | RefLike<number | string | undefined>;
    spreadMethod?: string | undefined | RefLike<string | undefined>;
    startOffset?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    stdDeviation?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    stemh?: number | string | undefined | RefLike<number | string | undefined>;
    stemv?: number | string | undefined | RefLike<number | string | undefined>;
    stitchTiles?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    stopColor?: string | undefined | RefLike<string | undefined>;
    stopOpacity?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    strikethroughPosition?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    strikethroughThickness?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    string?: number | string | undefined | RefLike<number | string | undefined>;
    stroke?: string | undefined | RefLike<string | undefined>;
    strokeDasharray?:
      | string
      | number
      | undefined
      | RefLike<number | string | undefined>;
    strokeDashoffset?:
      | string
      | number
      | undefined
      | RefLike<number | string | undefined>;
    strokeLinecap?:
      | 'butt'
      | 'round'
      | 'square'
      | 'inherit'
      | undefined
      | RefLike<'butt' | 'round' | 'square' | 'inherit' | undefined>;
    strokeLinejoin?:
      | 'miter'
      | 'round'
      | 'bevel'
      | 'inherit'
      | undefined
      | RefLike<'miter' | 'round' | 'bevel' | 'inherit' | undefined>;
    strokeMiterlimit?:
      | string
      | number
      | undefined
      | RefLike<number | string | undefined>;
    strokeOpacity?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    strokeWidth?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    surfaceScale?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    systemLanguage?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    tableValues?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    targetX?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    targetY?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    textAnchor?: string | undefined | RefLike<string | undefined>;
    textDecoration?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    textLength?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    textRendering?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    to?: number | string | undefined | RefLike<number | string | undefined>;
    transform?: string | undefined | RefLike<string | undefined>;
    u1?: number | string | undefined | RefLike<number | string | undefined>;
    u2?: number | string | undefined | RefLike<number | string | undefined>;
    underlinePosition?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    underlineThickness?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    unicode?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    unicodeBidi?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    unicodeRange?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    unitsPerEm?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vAlphabetic?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    values?: string | undefined | RefLike<string | undefined>;
    vectorEffect?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    version?: string | undefined | RefLike<string | undefined>;
    vertAdvY?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vertOriginX?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vertOriginY?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vHanging?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vIdeographic?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    viewBox?: string | undefined | RefLike<string | undefined>;
    viewTarget?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    visibility?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    vMathematical?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    widths?: number | string | undefined | RefLike<number | string | undefined>;
    wordSpacing?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    writingMode?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    x1?: number | string | undefined | RefLike<number | string | undefined>;
    x2?: number | string | undefined | RefLike<number | string | undefined>;
    x?: number | string | undefined | RefLike<number | string | undefined>;
    xChannelSelector?: string | undefined | RefLike<string | undefined>;
    xHeight?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    xlinkActuate?: string | undefined | RefLike<string | undefined>;
    xlinkArcrole?: string | undefined | RefLike<string | undefined>;
    xlinkHref?: string | undefined | RefLike<string | undefined>;
    xlinkRole?: string | undefined | RefLike<string | undefined>;
    xlinkShow?: string | undefined | RefLike<string | undefined>;
    xlinkTitle?: string | undefined | RefLike<string | undefined>;
    xlinkType?: string | undefined | RefLike<string | undefined>;
    xmlBase?: string | undefined | RefLike<string | undefined>;
    xmlLang?: string | undefined | RefLike<string | undefined>;
    xmlns?: string | undefined | RefLike<string | undefined>;
    xmlnsXlink?: string | undefined | RefLike<string | undefined>;
    xmlSpace?: string | undefined | RefLike<string | undefined>;
    y1?: number | string | undefined | RefLike<number | string | undefined>;
    y2?: number | string | undefined | RefLike<number | string | undefined>;
    y?: number | string | undefined | RefLike<number | string | undefined>;
    yChannelSelector?: string | undefined | RefLike<string | undefined>;
    z?: number | string | undefined | RefLike<number | string | undefined>;
    zoomAndPan?: string | undefined | RefLike<string | undefined>;
  }

  export interface PathAttributes {
    d: string;
  }

  export type TargetedEvent<
    Target extends EventTarget = EventTarget,
    TypedEvent extends Event = Event
  > = Omit<TypedEvent, 'currentTarget'> & {
    readonly currentTarget: Target;
  };

  export type TargetedAnimationEvent<Target extends EventTarget> =
    TargetedEvent<Target, AnimationEvent>;
  export type TargetedClipboardEvent<Target extends EventTarget> =
    TargetedEvent<Target, ClipboardEvent>;
  export type TargetedCompositionEvent<Target extends EventTarget> =
    TargetedEvent<Target, CompositionEvent>;
  export type TargetedDragEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    DragEvent
  >;
  export type TargetedFocusEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    FocusEvent
  >;
  export type TargetedKeyboardEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    KeyboardEvent
  >;
  export type TargetedMouseEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    MouseEvent
  >;
  export type TargetedPointerEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    PointerEvent
  >;
  export type TargetedTouchEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    TouchEvent
  >;
  export type TargetedTransitionEvent<Target extends EventTarget> =
    TargetedEvent<Target, TransitionEvent>;
  export type TargetedUIEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    UIEvent
  >;
  export type TargetedWheelEvent<Target extends EventTarget> = TargetedEvent<
    Target,
    WheelEvent
  >;

  export interface EventHandler<E extends TargetedEvent> {
    (this: void, event: E): void;
  }

  export type AnimationEventHandler<Target extends EventTarget> = EventHandler<
    TargetedAnimationEvent<Target>
  >;
  export type ClipboardEventHandler<Target extends EventTarget> = EventHandler<
    TargetedClipboardEvent<Target>
  >;
  export type CompositionEventHandler<Target extends EventTarget> =
    EventHandler<TargetedCompositionEvent<Target>>;
  export type DragEventHandler<Target extends EventTarget> = EventHandler<
    TargetedDragEvent<Target>
  >;
  export type FocusEventHandler<Target extends EventTarget> = EventHandler<
    TargetedFocusEvent<Target>
  >;
  export type GenericEventHandler<Target extends EventTarget> = EventHandler<
    TargetedEvent<Target>
  >;
  export type KeyboardEventHandler<Target extends EventTarget> = EventHandler<
    TargetedKeyboardEvent<Target>
  >;
  export type MouseEventHandler<Target extends EventTarget> = EventHandler<
    TargetedMouseEvent<Target>
  >;
  export type PointerEventHandler<Target extends EventTarget> = EventHandler<
    TargetedPointerEvent<Target>
  >;
  export type TouchEventHandler<Target extends EventTarget> = EventHandler<
    TargetedTouchEvent<Target>
  >;
  export type TransitionEventHandler<Target extends EventTarget> = EventHandler<
    TargetedTransitionEvent<Target>
  >;
  export type UIEventHandler<Target extends EventTarget> = EventHandler<
    TargetedUIEvent<Target>
  >;
  export type WheelEventHandler<Target extends EventTarget> = EventHandler<
    TargetedWheelEvent<Target>
  >;

  export interface DOMAttributes<Target extends EventTarget> {
    // Image Events
    onLoad?: GenericEventHandler<Target> | undefined;
    onLoadCapture?: GenericEventHandler<Target> | undefined;
    onError?: GenericEventHandler<Target> | undefined;
    onErrorCapture?: GenericEventHandler<Target> | undefined;

    // Clipboard Events
    onCopy?: ClipboardEventHandler<Target> | undefined;
    onCopyCapture?: ClipboardEventHandler<Target> | undefined;
    onCut?: ClipboardEventHandler<Target> | undefined;
    onCutCapture?: ClipboardEventHandler<Target> | undefined;
    onPaste?: ClipboardEventHandler<Target> | undefined;
    onPasteCapture?: ClipboardEventHandler<Target> | undefined;

    // Composition Events
    onCompositionEnd?: CompositionEventHandler<Target> | undefined;
    onCompositionEndCapture?: CompositionEventHandler<Target> | undefined;
    onCompositionStart?: CompositionEventHandler<Target> | undefined;
    onCompositionStartCapture?: CompositionEventHandler<Target> | undefined;
    onCompositionUpdate?: CompositionEventHandler<Target> | undefined;
    onCompositionUpdateCapture?: CompositionEventHandler<Target> | undefined;

    // Details Events
    onToggle?: GenericEventHandler<Target> | undefined;

    // Focus Events
    onFocus?: FocusEventHandler<Target> | undefined;
    onFocusCapture?: FocusEventHandler<Target> | undefined;
    onfocusin?: FocusEventHandler<Target> | undefined;
    onfocusinCapture?: FocusEventHandler<Target> | undefined;
    onfocusout?: FocusEventHandler<Target> | undefined;
    onfocusoutCapture?: FocusEventHandler<Target> | undefined;
    onBlur?: FocusEventHandler<Target> | undefined;
    onBlurCapture?: FocusEventHandler<Target> | undefined;

    // Form Events
    onChange?: GenericEventHandler<Target> | undefined;
    onChangeCapture?: GenericEventHandler<Target> | undefined;
    onInput?: GenericEventHandler<Target> | undefined;
    onInputCapture?: GenericEventHandler<Target> | undefined;
    onBeforeInput?: GenericEventHandler<Target> | undefined;
    onBeforeInputCapture?: GenericEventHandler<Target> | undefined;
    onSearch?: GenericEventHandler<Target> | undefined;
    onSearchCapture?: GenericEventHandler<Target> | undefined;
    onSubmit?: GenericEventHandler<Target> | undefined;
    onSubmitCapture?: GenericEventHandler<Target> | undefined;
    onInvalid?: GenericEventHandler<Target> | undefined;
    onInvalidCapture?: GenericEventHandler<Target> | undefined;
    onReset?: GenericEventHandler<Target> | undefined;
    onResetCapture?: GenericEventHandler<Target> | undefined;
    onFormData?: GenericEventHandler<Target> | undefined;
    onFormDataCapture?: GenericEventHandler<Target> | undefined;

    // Keyboard Events
    onKeyDown?: KeyboardEventHandler<Target> | undefined;
    onKeyDownCapture?: KeyboardEventHandler<Target> | undefined;
    onKeyPress?: KeyboardEventHandler<Target> | undefined;
    onKeyPressCapture?: KeyboardEventHandler<Target> | undefined;
    onKeyUp?: KeyboardEventHandler<Target> | undefined;
    onKeyUpCapture?: KeyboardEventHandler<Target> | undefined;

    // Media Events
    onAbort?: GenericEventHandler<Target> | undefined;
    onAbortCapture?: GenericEventHandler<Target> | undefined;
    onCanPlay?: GenericEventHandler<Target> | undefined;
    onCanPlayCapture?: GenericEventHandler<Target> | undefined;
    onCanPlayThrough?: GenericEventHandler<Target> | undefined;
    onCanPlayThroughCapture?: GenericEventHandler<Target> | undefined;
    onDurationChange?: GenericEventHandler<Target> | undefined;
    onDurationChangeCapture?: GenericEventHandler<Target> | undefined;
    onEmptied?: GenericEventHandler<Target> | undefined;
    onEmptiedCapture?: GenericEventHandler<Target> | undefined;
    onEncrypted?: GenericEventHandler<Target> | undefined;
    onEncryptedCapture?: GenericEventHandler<Target> | undefined;
    onEnded?: GenericEventHandler<Target> | undefined;
    onEndedCapture?: GenericEventHandler<Target> | undefined;
    onLoadedData?: GenericEventHandler<Target> | undefined;
    onLoadedDataCapture?: GenericEventHandler<Target> | undefined;
    onLoadedMetadata?: GenericEventHandler<Target> | undefined;
    onLoadedMetadataCapture?: GenericEventHandler<Target> | undefined;
    onLoadStart?: GenericEventHandler<Target> | undefined;
    onLoadStartCapture?: GenericEventHandler<Target> | undefined;
    onPause?: GenericEventHandler<Target> | undefined;
    onPauseCapture?: GenericEventHandler<Target> | undefined;
    onPlay?: GenericEventHandler<Target> | undefined;
    onPlayCapture?: GenericEventHandler<Target> | undefined;
    onPlaying?: GenericEventHandler<Target> | undefined;
    onPlayingCapture?: GenericEventHandler<Target> | undefined;
    onProgress?: GenericEventHandler<Target> | undefined;
    onProgressCapture?: GenericEventHandler<Target> | undefined;
    onRateChange?: GenericEventHandler<Target> | undefined;
    onRateChangeCapture?: GenericEventHandler<Target> | undefined;
    onSeeked?: GenericEventHandler<Target> | undefined;
    onSeekedCapture?: GenericEventHandler<Target> | undefined;
    onSeeking?: GenericEventHandler<Target> | undefined;
    onSeekingCapture?: GenericEventHandler<Target> | undefined;
    onStalled?: GenericEventHandler<Target> | undefined;
    onStalledCapture?: GenericEventHandler<Target> | undefined;
    onSuspend?: GenericEventHandler<Target> | undefined;
    onSuspendCapture?: GenericEventHandler<Target> | undefined;
    onTimeUpdate?: GenericEventHandler<Target> | undefined;
    onTimeUpdateCapture?: GenericEventHandler<Target> | undefined;
    onVolumeChange?: GenericEventHandler<Target> | undefined;
    onVolumeChangeCapture?: GenericEventHandler<Target> | undefined;
    onWaiting?: GenericEventHandler<Target> | undefined;
    onWaitingCapture?: GenericEventHandler<Target> | undefined;

    // MouseEvents
    onClick?: MouseEventHandler<Target> | undefined;
    onClickCapture?: MouseEventHandler<Target> | undefined;
    onContextMenu?: MouseEventHandler<Target> | undefined;
    onContextMenuCapture?: MouseEventHandler<Target> | undefined;
    onDblClick?: MouseEventHandler<Target> | undefined;
    onDblClickCapture?: MouseEventHandler<Target> | undefined;
    onDrag?: DragEventHandler<Target> | undefined;
    onDragCapture?: DragEventHandler<Target> | undefined;
    onDragEnd?: DragEventHandler<Target> | undefined;
    onDragEndCapture?: DragEventHandler<Target> | undefined;
    onDragEnter?: DragEventHandler<Target> | undefined;
    onDragEnterCapture?: DragEventHandler<Target> | undefined;
    onDragExit?: DragEventHandler<Target> | undefined;
    onDragExitCapture?: DragEventHandler<Target> | undefined;
    onDragLeave?: DragEventHandler<Target> | undefined;
    onDragLeaveCapture?: DragEventHandler<Target> | undefined;
    onDragOver?: DragEventHandler<Target> | undefined;
    onDragOverCapture?: DragEventHandler<Target> | undefined;
    onDragStart?: DragEventHandler<Target> | undefined;
    onDragStartCapture?: DragEventHandler<Target> | undefined;
    onDrop?: DragEventHandler<Target> | undefined;
    onDropCapture?: DragEventHandler<Target> | undefined;
    onMouseDown?: MouseEventHandler<Target> | undefined;
    onMouseDownCapture?: MouseEventHandler<Target> | undefined;
    onMouseEnter?: MouseEventHandler<Target> | undefined;
    onMouseEnterCapture?: MouseEventHandler<Target> | undefined;
    onMouseLeave?: MouseEventHandler<Target> | undefined;
    onMouseLeaveCapture?: MouseEventHandler<Target> | undefined;
    onMouseMove?: MouseEventHandler<Target> | undefined;
    onMouseMoveCapture?: MouseEventHandler<Target> | undefined;
    onMouseOut?: MouseEventHandler<Target> | undefined;
    onMouseOutCapture?: MouseEventHandler<Target> | undefined;
    onMouseOver?: MouseEventHandler<Target> | undefined;
    onMouseOverCapture?: MouseEventHandler<Target> | undefined;
    onMouseUp?: MouseEventHandler<Target> | undefined;
    onMouseUpCapture?: MouseEventHandler<Target> | undefined;

    // Selection Events
    onSelect?: GenericEventHandler<Target> | undefined;
    onSelectCapture?: GenericEventHandler<Target> | undefined;

    // Touch Events
    onTouchCancel?: TouchEventHandler<Target> | undefined;
    onTouchCancelCapture?: TouchEventHandler<Target> | undefined;
    onTouchEnd?: TouchEventHandler<Target> | undefined;
    onTouchEndCapture?: TouchEventHandler<Target> | undefined;
    onTouchMove?: TouchEventHandler<Target> | undefined;
    onTouchMoveCapture?: TouchEventHandler<Target> | undefined;
    onTouchStart?: TouchEventHandler<Target> | undefined;
    onTouchStartCapture?: TouchEventHandler<Target> | undefined;

    // Pointer Events
    onPointerOver?: PointerEventHandler<Target> | undefined;
    onPointerOverCapture?: PointerEventHandler<Target> | undefined;
    onPointerEnter?: PointerEventHandler<Target> | undefined;
    onPointerEnterCapture?: PointerEventHandler<Target> | undefined;
    onPointerDown?: PointerEventHandler<Target> | undefined;
    onPointerDownCapture?: PointerEventHandler<Target> | undefined;
    onPointerMove?: PointerEventHandler<Target> | undefined;
    onPointerMoveCapture?: PointerEventHandler<Target> | undefined;
    onPointerUp?: PointerEventHandler<Target> | undefined;
    onPointerUpCapture?: PointerEventHandler<Target> | undefined;
    onPointerCancel?: PointerEventHandler<Target> | undefined;
    onPointerCancelCapture?: PointerEventHandler<Target> | undefined;
    onPointerOut?: PointerEventHandler<Target> | undefined;
    onPointerOutCapture?: PointerEventHandler<Target> | undefined;
    onPointerLeave?: PointerEventHandler<Target> | undefined;
    onPointerLeaveCapture?: PointerEventHandler<Target> | undefined;
    onGotPointerCapture?: PointerEventHandler<Target> | undefined;
    onGotPointerCaptureCapture?: PointerEventHandler<Target> | undefined;
    onLostPointerCapture?: PointerEventHandler<Target> | undefined;
    onLostPointerCaptureCapture?: PointerEventHandler<Target> | undefined;

    // UI Events
    onScroll?: UIEventHandler<Target> | undefined;
    onScrollCapture?: UIEventHandler<Target> | undefined;

    // Wheel Events
    onWheel?: WheelEventHandler<Target> | undefined;
    onWheelCapture?: WheelEventHandler<Target> | undefined;

    // Animation Events
    onAnimationStart?: AnimationEventHandler<Target> | undefined;
    onAnimationStartCapture?: AnimationEventHandler<Target> | undefined;
    onAnimationEnd?: AnimationEventHandler<Target> | undefined;
    onAnimationEndCapture?: AnimationEventHandler<Target> | undefined;
    onAnimationIteration?: AnimationEventHandler<Target> | undefined;
    onAnimationIterationCapture?: AnimationEventHandler<Target> | undefined;

    // Transition Events
    onTransitionEnd?: TransitionEventHandler<Target>;
    onTransitionEndCapture?: TransitionEventHandler<Target>;
  }

  // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
  export interface AriaAttributes {
    /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
    'aria-activedescendant'?: RefLike<string | undefined>;
    /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
    'aria-atomic'?: RefLike<Booleanish | undefined>;
    /**
     * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
     * presented if they are made.
     */
    'aria-autocomplete'?: RefLike<
      'none' | 'inline' | 'list' | 'both' | undefined
    >;
    /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
    'aria-busy'?: RefLike<Booleanish | undefined>;
    /**
     * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
     * @see aria-pressed
     * @see aria-selected.
     */
    'aria-checked'?: RefLike<Booleanish | 'mixed' | undefined>;
    /**
     * Defines the total number of columns in a table, grid, or treegrid.
     * @see aria-colindex.
     */
    'aria-colcount'?: RefLike<number | undefined>;
    /**
     * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
     * @see aria-colcount
     * @see aria-colspan.
     */
    'aria-colindex'?: RefLike<number | undefined>;
    /**
     * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-colindex
     * @see aria-rowspan.
     */
    'aria-colspan'?: RefLike<number | undefined>;
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current element.
     * @see aria-owns.
     */
    'aria-controls'?: RefLike<string | undefined>;
    /** Indicates the element that represents the current item within a container or set of related elements. */
    'aria-current'?: RefLike<
      Booleanish | 'page' | 'step' | 'location' | 'date' | 'time' | undefined
    >;
    /**
     * Identifies the element (or elements) that describes the object.
     * @see aria-labelledby
     */
    'aria-describedby'?: RefLike<string | undefined>;
    /**
     * Identifies the element that provides a detailed, extended description for the object.
     * @see aria-describedby.
     */
    'aria-details'?: RefLike<string | undefined>;
    /**
     * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
     * @see aria-hidden
     * @see aria-readonly.
     */
    'aria-disabled'?: RefLike<Booleanish | undefined>;
    /**
     * Indicates what functions can be performed when a dragged object is released on the drop target.
     * @deprecated in ARIA 1.1
     */
    'aria-dropeffect'?: RefLike<
      'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | undefined
    >;
    /**
     * Identifies the element that provides an error message for the object.
     * @see aria-invalid
     * @see aria-describedby.
     */
    'aria-errormessage'?: RefLike<string | undefined>;
    /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
    'aria-expanded'?: RefLike<Booleanish | undefined>;
    /**
     * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
     * allows assistive technology to override the general default of reading in document source order.
     */
    'aria-flowto'?: RefLike<string | undefined>;
    /**
     * Indicates an element's "grabbed" state in a drag-and-drop operation.
     * @deprecated in ARIA 1.1
     */
    'aria-grabbed'?: RefLike<Booleanish | undefined>;
    /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
    'aria-haspopup'?: RefLike<
      Booleanish | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | undefined
    >;
    /**
     * Indicates whether the element is exposed to an accessibility API.
     * @see aria-disabled.
     */
    'aria-hidden'?: RefLike<Booleanish | undefined>;
    /**
     * Indicates the entered value does not conform to the format expected by the application.
     * @see aria-errormessage.
     */
    'aria-invalid'?: RefLike<Booleanish | 'grammar' | 'spelling' | undefined>;
    /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
    'aria-keyshortcuts'?: RefLike<string | undefined>;
    /**
     * Defines a string value that labels the current element.
     * @see aria-labelledby.
     */
    'aria-label'?: RefLike<string | undefined>;
    /**
     * Identifies the element (or elements) that labels the current element.
     * @see aria-describedby.
     */
    'aria-labelledby'?: RefLike<string | undefined>;
    /** Defines the hierarchical level of an element within a structure. */
    'aria-level'?: RefLike<number | undefined>;
    /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
    'aria-live'?: RefLike<'off' | 'assertive' | 'polite' | undefined>;
    /** Indicates whether an element is modal when displayed. */
    'aria-modal'?: RefLike<Booleanish | undefined>;
    /** Indicates whether a text box accepts multiple lines of input or only a single line. */
    'aria-multiline'?: RefLike<Booleanish | undefined>;
    /** Indicates that the user may select more than one item from the current selectable descendants. */
    'aria-multiselectable'?: RefLike<Booleanish | undefined>;
    /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
    'aria-orientation'?: RefLike<'horizontal' | 'vertical' | undefined>;
    /**
     * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
     * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
     * @see aria-controls.
     */
    'aria-owns'?: RefLike<string | undefined>;
    /**
     * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
     * A hint could be a sample value or a brief description of the expected format.
     */
    'aria-placeholder'?: RefLike<string | undefined>;
    /**
     * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-setsize.
     */
    'aria-posinset'?: RefLike<number | undefined>;
    /**
     * Indicates the current "pressed" state of toggle buttons.
     * @see aria-checked
     * @see aria-selected.
     */
    'aria-pressed'?: RefLike<Booleanish | 'mixed' | undefined>;
    /**
     * Indicates that the element is not editable, but is otherwise operable.
     * @see aria-disabled.
     */
    'aria-readonly'?: RefLike<Booleanish | undefined>;
    /**
     * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
     * @see aria-atomic.
     */
    'aria-relevant'?: RefLike<
      | 'additions'
      | 'additions removals'
      | 'additions text'
      | 'all'
      | 'removals'
      | 'removals additions'
      | 'removals text'
      | 'text'
      | 'text additions'
      | 'text removals'
      | undefined
    >;
    /** Indicates that user input is required on the element before a form may be submitted. */
    'aria-required'?: RefLike<Booleanish | undefined>;
    /** Defines a human-readable, author-localized description for the role of an element. */
    'aria-roledescription'?: RefLike<string | undefined>;
    /**
     * Defines the total number of rows in a table, grid, or treegrid.
     * @see aria-rowindex.
     */
    'aria-rowcount'?: RefLike<number | undefined>;
    /**
     * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
     * @see aria-rowcount
     * @see aria-rowspan.
     */
    'aria-rowindex'?: RefLike<number | undefined>;
    /**
     * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-rowindex
     * @see aria-colspan.
     */
    'aria-rowspan'?: RefLike<number | undefined>;
    /**
     * Indicates the current "selected" state of various widgets.
     * @see aria-checked
     * @see aria-pressed.
     */
    'aria-selected'?: RefLike<Booleanish | undefined>;
    /**
     * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-posinset.
     */
    'aria-setsize'?: RefLike<number | undefined>;
    /** Indicates if items in a table or grid are sorted in ascending or descending order. */
    'aria-sort'?: RefLike<
      'none' | 'ascending' | 'descending' | 'other' | undefined
    >;
    /** Defines the maximum allowed value for a range widget. */
    'aria-valuemax'?: RefLike<number | undefined>;
    /** Defines the minimum allowed value for a range widget. */
    'aria-valuemin'?: RefLike<number | undefined>;
    /**
     * Defines the current value for a range widget.
     * @see aria-valuetext.
     */
    'aria-valuenow'?: RefLike<number | undefined>;
    /** Defines the human readable text alternative of aria-valuenow for a range widget. */
    'aria-valuetext'?: RefLike<string | undefined>;
  }

  // All the WAI-ARIA 1.1 role attribute values from https://www.w3.org/TR/wai-aria-1.1/#role_definitions
  type AriaRole =
    | 'alert'
    | 'alertdialog'
    | 'application'
    | 'article'
    | 'banner'
    | 'button'
    | 'cell'
    | 'checkbox'
    | 'columnheader'
    | 'combobox'
    | 'complementary'
    | 'contentinfo'
    | 'definition'
    | 'dialog'
    | 'directory'
    | 'document'
    | 'feed'
    | 'figure'
    | 'form'
    | 'grid'
    | 'gridcell'
    | 'group'
    | 'heading'
    | 'img'
    | 'link'
    | 'list'
    | 'listbox'
    | 'listitem'
    | 'log'
    | 'main'
    | 'marquee'
    | 'math'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'menuitemcheckbox'
    | 'menuitemradio'
    | 'navigation'
    | 'none'
    | 'note'
    | 'option'
    | 'presentation'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'region'
    | 'row'
    | 'rowgroup'
    | 'rowheader'
    | 'scrollbar'
    | 'search'
    | 'searchbox'
    | 'separator'
    | 'slider'
    | 'spinbutton'
    | 'status'
    | 'switch'
    | 'tab'
    | 'table'
    | 'tablist'
    | 'tabpanel'
    | 'term'
    | 'textbox'
    | 'timer'
    | 'toolbar'
    | 'tooltip'
    | 'tree'
    | 'treegrid'
    | 'treeitem'
    | 'none presentation';

  type DirectivePrefix = `$${string}`;

  export interface HTMLAttributes<RefType extends EventTarget = EventTarget>
    extends DOMAttributes<RefType>,
      AriaAttributes {
    // custom directives
    [K: DirectivePrefix]: any;
    // JSX attributes
    children?: any;
    // RhJS attributes
    ref?: any;
    effect?: any;

    // Standard HTML Attributes
    accept?: string | undefined | RefLike<string | undefined>;
    acceptCharset?: string | undefined | RefLike<string | undefined>;
    accessKey?: string | undefined | RefLike<string | undefined>;
    action?: string | undefined | RefLike<string | undefined>;
    allow?: string | undefined | RefLike<string | undefined>;
    allowFullScreen?: boolean | undefined | RefLike<boolean | undefined>;
    allowTransparency?: boolean | undefined | RefLike<boolean | undefined>;
    alt?: string | undefined | RefLike<string | undefined>;
    as?: string | undefined | RefLike<string | undefined>;
    async?: boolean | undefined | RefLike<boolean | undefined>;
    autocomplete?: string | undefined | RefLike<string | undefined>;
    autoComplete?: string | undefined | RefLike<string | undefined>;
    autocorrect?: string | undefined | RefLike<string | undefined>;
    autoCorrect?: string | undefined | RefLike<string | undefined>;
    autofocus?: boolean | undefined | RefLike<boolean | undefined>;
    autoFocus?: boolean | undefined | RefLike<boolean | undefined>;
    autoPlay?: boolean | undefined | RefLike<boolean | undefined>;
    capture?: boolean | string | undefined | RefLike<string | undefined>;
    cellPadding?: number | string | undefined | RefLike<string | undefined>;
    cellSpacing?: number | string | undefined | RefLike<string | undefined>;
    charSet?: string | undefined | RefLike<string | undefined>;
    challenge?: string | undefined | RefLike<string | undefined>;
    checked?: boolean | undefined | RefLike<boolean | undefined>;
    cite?: string | undefined | RefLike<string | undefined>;
    class?: string | undefined | RefLike<string | undefined>;
    className?: string | undefined | RefLike<string | undefined>;
    cols?: number | undefined | RefLike<number | undefined>;
    colSpan?: number | undefined | RefLike<number | undefined>;
    content?: string | undefined | RefLike<string | undefined>;
    contentEditable?: boolean | undefined | RefLike<boolean | undefined>;
    contextMenu?: string | undefined | RefLike<string | undefined>;
    controls?: boolean | undefined | RefLike<boolean | undefined>;
    controlsList?: string | undefined | RefLike<string | undefined>;
    coords?: string | undefined | RefLike<string | undefined>;
    crossOrigin?: string | undefined | RefLike<string | undefined>;
    data?: string | undefined | RefLike<string | undefined>;
    dateTime?: string | undefined | RefLike<string | undefined>;
    default?: boolean | undefined | RefLike<boolean | undefined>;
    defaultChecked?: boolean | undefined | RefLike<boolean | undefined>;
    defaultValue?: string | undefined | RefLike<string | undefined>;
    defer?: boolean | undefined | RefLike<boolean | undefined>;
    dir?:
      | 'auto'
      | 'rtl'
      | 'ltr'
      | undefined
      | RefLike<'auto' | 'rtl' | 'ltr' | undefined>;
    disabled?: boolean | undefined | RefLike<boolean | undefined>;
    disableRemotePlayback?: boolean | undefined | RefLike<boolean | undefined>;
    download?: any | undefined;
    decoding?:
      | 'sync'
      | 'async'
      | 'auto'
      | undefined
      | RefLike<'sync' | 'async' | 'auto' | undefined>;
    draggable?: boolean | undefined | RefLike<boolean | undefined>;
    encType?: string | undefined | RefLike<string | undefined>;
    enterkeyhint?:
      | 'enter'
      | 'done'
      | 'go'
      | 'next'
      | 'previous'
      | 'search'
      | 'send'
      | undefined
      | RefLike<
          | 'enter'
          | 'done'
          | 'go'
          | 'next'
          | 'previous'
          | 'search'
          | 'send'
          | undefined
        >;
    for?: string | undefined | RefLike<string | undefined>;
    form?: string | undefined | RefLike<string | undefined>;
    formAction?: string | undefined | RefLike<string | undefined>;
    formEncType?: string | undefined | RefLike<string | undefined>;
    formMethod?: string | undefined | RefLike<string | undefined>;
    formNoValidate?: boolean | undefined | RefLike<boolean | undefined>;
    formTarget?: string | undefined | RefLike<string | undefined>;
    frameBorder?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    headers?: string | undefined | RefLike<string | undefined>;
    height?: number | string | undefined | RefLike<number | string | undefined>;
    hidden?: boolean | undefined | RefLike<boolean | undefined>;
    high?: number | undefined | RefLike<number | undefined>;
    href?: string | undefined | RefLike<string | undefined>;
    hrefLang?: string | undefined | RefLike<string | undefined>;
    htmlFor?: string | undefined | RefLike<string | undefined>;
    httpEquiv?: string | undefined | RefLike<string | undefined>;
    icon?: string | undefined | RefLike<string | undefined>;
    id?: string | undefined | RefLike<string | undefined>;
    indeterminate?: boolean | undefined | RefLike<boolean>;
    inputMode?: string | undefined | RefLike<string | undefined>;
    integrity?: string | undefined | RefLike<string | undefined>;
    is?: string | undefined | RefLike<string | undefined>;
    keyParams?: string | undefined | RefLike<string | undefined>;
    keyType?: string | undefined | RefLike<string | undefined>;
    kind?: string | undefined | RefLike<string | undefined>;
    label?: string | undefined | RefLike<string | undefined>;
    lang?: string | undefined | RefLike<string | undefined>;
    list?: string | undefined | RefLike<string | undefined>;
    loading?:
      | 'eager'
      | 'lazy'
      | undefined
      | RefLike<'eager' | 'lazy' | undefined>;
    loop?: boolean | undefined | RefLike<boolean | undefined>;
    low?: number | undefined | RefLike<number | undefined>;
    manifest?: string | undefined | RefLike<string | undefined>;
    marginHeight?: number | undefined | RefLike<number | undefined>;
    marginWidth?: number | undefined | RefLike<number | undefined>;
    max?: number | string | undefined | RefLike<string | undefined>;
    maxLength?: number | undefined | RefLike<number | undefined>;
    media?: string | undefined | RefLike<string | undefined>;
    mediaGroup?: string | undefined | RefLike<string | undefined>;
    method?: string | undefined | RefLike<string | undefined>;
    min?: number | string | undefined | RefLike<string | undefined>;
    minLength?: number | undefined | RefLike<number | undefined>;
    multiple?: boolean | undefined | RefLike<boolean | undefined>;
    muted?: boolean | undefined | RefLike<boolean | undefined>;
    name?: string | undefined | RefLike<string | undefined>;
    nomodule?: boolean | undefined | RefLike<boolean | undefined>;
    nonce?: string | undefined | RefLike<string | undefined>;
    noValidate?: boolean | undefined | RefLike<boolean | undefined>;
    open?: boolean | undefined | RefLike<boolean | undefined>;
    optimum?: number | undefined | RefLike<number | undefined>;
    part?: string | undefined | RefLike<string | undefined>;
    pattern?: string | undefined | RefLike<string | undefined>;
    ping?: string | undefined | RefLike<string | undefined>;
    placeholder?: string | undefined | RefLike<string | undefined>;
    playsInline?: boolean | undefined | RefLike<boolean | undefined>;
    poster?: string | undefined | RefLike<string | undefined>;
    preload?: string | undefined | RefLike<string | undefined>;
    radioGroup?: string | undefined | RefLike<string | undefined>;
    readonly?: boolean | undefined | RefLike<boolean | undefined>;
    readOnly?: boolean | undefined | RefLike<boolean | undefined>;
    referrerpolicy?:
      | 'no-referrer'
      | 'no-referrer-when-downgrade'
      | 'origin'
      | 'origin-when-cross-origin'
      | 'same-origin'
      | 'strict-origin'
      | 'strict-origin-when-cross-origin'
      | 'unsafe-url'
      | undefined
      | RefLike<
          | 'no-referrer'
          | 'no-referrer-when-downgrade'
          | 'origin'
          | 'origin-when-cross-origin'
          | 'same-origin'
          | 'strict-origin'
          | 'strict-origin-when-cross-origin'
          | 'unsafe-url'
          | undefined
        >;
    rel?: string | undefined | RefLike<string | undefined>;
    required?: boolean | undefined | RefLike<boolean | undefined>;
    reversed?: boolean | undefined | RefLike<boolean | undefined>;
    role?: AriaRole | undefined | RefLike<AriaRole | undefined>;
    rows?: number | undefined | RefLike<number | undefined>;
    rowSpan?: number | undefined | RefLike<number | undefined>;
    sandbox?: string | undefined | RefLike<string | undefined>;
    scope?: string | undefined | RefLike<string | undefined>;
    scoped?: boolean | undefined | RefLike<boolean | undefined>;
    scrolling?: string | undefined | RefLike<string | undefined>;
    seamless?: boolean | undefined | RefLike<boolean | undefined>;
    selected?: boolean | undefined | RefLike<boolean | undefined>;
    shape?: string | undefined | RefLike<string | undefined>;
    size?: number | undefined | RefLike<number | undefined>;
    sizes?: string | undefined | RefLike<string | undefined>;
    slot?: string | undefined | RefLike<string | undefined>;
    span?: number | undefined | RefLike<number | undefined>;
    spellcheck?: boolean | undefined | RefLike<boolean | undefined>;
    spellCheck?: boolean | undefined | RefLike<boolean | undefined>;
    src?: string | undefined | RefLike<string | undefined>;
    srcset?: string | undefined | RefLike<string | undefined>;
    srcDoc?: string | undefined | RefLike<string | undefined>;
    srcLang?: string | undefined | RefLike<string | undefined>;
    srcSet?: string | undefined | RefLike<string | undefined>;
    start?: number | undefined | RefLike<number | undefined>;
    step?: number | string | undefined | RefLike<number | string | undefined>;
    style?: string | undefined | RefLike<string | undefined>;
    summary?: string | undefined | RefLike<string | undefined>;
    tabIndex?: number | undefined | RefLike<number | undefined>;
    target?: string | undefined | RefLike<string | undefined>;
    title?: string | undefined | RefLike<string | undefined>;
    type?: string | undefined | RefLike<string | undefined>;
    useMap?: string | undefined | RefLike<string | undefined>;
    value?:
      | string
      | string[]
      | number
      | undefined
      | RefLike<string | string[] | number | undefined>;
    volume?: string | number | undefined | RefLike<string | number | undefined>;
    width?: number | string | undefined | RefLike<number | string | undefined>;
    wmode?: string | undefined | RefLike<string | undefined>;
    wrap?: string | undefined | RefLike<string | undefined>;

    // Non-standard Attributes
    autocapitalize?:
      | 'off'
      | 'none'
      | 'on'
      | 'sentences'
      | 'words'
      | 'characters'
      | undefined
      | RefLike<
          | 'off'
          | 'none'
          | 'on'
          | 'sentences'
          | 'words'
          | 'characters'
          | undefined
        >;
    autoCapitalize?:
      | 'off'
      | 'none'
      | 'on'
      | 'sentences'
      | 'words'
      | 'characters'
      | undefined
      | RefLike<
          | 'off'
          | 'none'
          | 'on'
          | 'sentences'
          | 'words'
          | 'characters'
          | undefined
        >;
    disablePictureInPicture?:
      | boolean
      | undefined
      | RefLike<boolean | undefined>;
    results?: number | undefined | RefLike<number | undefined>;
    translate?: 'yes' | 'no' | undefined | RefLike<'yes' | 'no' | undefined>;

    // RDFa Attributes
    about?: string | undefined | RefLike<string | undefined>;
    datatype?: string | undefined | RefLike<string | undefined>;
    inlist?: any;
    prefix?: string | undefined | RefLike<string | undefined>;
    property?: string | undefined | RefLike<string | undefined>;
    resource?: string | undefined | RefLike<string | undefined>;
    typeof?: string | undefined | RefLike<string | undefined>;
    vocab?: string | undefined | RefLike<string | undefined>;

    // Microdata Attributes
    itemProp?: string | undefined | RefLike<string | undefined>;
    itemScope?: boolean | undefined | RefLike<boolean | undefined>;
    itemType?: string | undefined | RefLike<string | undefined>;
    itemID?: string | undefined | RefLike<string | undefined>;
    itemRef?: string | undefined | RefLike<string | undefined>;
  }

  export type DetailedHTMLProps<
    HA extends HTMLAttributes<RefType>,
    RefType extends EventTarget = EventTarget
  > = HA;

  export interface HTMLMarqueeElement extends HTMLElement {
    behavior?:
      | 'scroll'
      | 'slide'
      | 'alternate'
      | undefined
      | RefLike<'scroll' | 'slide' | 'alternate' | undefined>;
    bgColor?: string | undefined | RefLike<string | undefined>;
    direction?:
      | 'left'
      | 'right'
      | 'up'
      | 'down'
      | undefined
      | RefLike<'left' | 'right' | 'up' | 'down' | undefined>;
    height?: number | string | undefined | RefLike<number | string | undefined>;
    hspace?: number | string | undefined | RefLike<number | string | undefined>;
    loop?: number | string | undefined | RefLike<number | string | undefined>;
    scrollAmount?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    scrollDelay?:
      | number
      | string
      | undefined
      | RefLike<number | string | undefined>;
    trueSpeed?: boolean | undefined | RefLike<boolean | undefined>;
    vspace?: number | string | undefined | RefLike<number | string | undefined>;
    width?: number | string | undefined | RefLike<number | string | undefined>;
  }

  export interface IntrinsicElements {
    // HTML
    a: HTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: HTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: HTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: HTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    big: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLTableCaptionElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: HTMLAttributes<HTMLTableColElement>;
    colgroup: HTMLAttributes<HTMLTableColElement>;
    data: HTMLAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLModElement>;
    details: HTMLAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: HTMLAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: HTMLAttributes<HTMLEmbedElement>;
    fieldset: HTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: HTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: HTMLAttributes<HTMLIFrameElement>;
    img: HTMLAttributes<HTMLImageElement>;
    input: HTMLAttributes<HTMLInputElement>;
    ins: HTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    keygen: HTMLAttributes<HTMLUnknownElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    link: HTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: HTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    marquee: HTMLAttributes<HTMLMarqueeElement>;
    menu: HTMLAttributes<HTMLMenuElement>;
    menuitem: HTMLAttributes<HTMLUnknownElement>;
    meta: HTMLAttributes<HTMLMetaElement>;
    meter: HTMLAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: HTMLAttributes<HTMLObjectElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    optgroup: HTMLAttributes<HTMLOptGroupElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    output: HTMLAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    param: HTMLAttributes<HTMLParamElement>;
    picture: HTMLAttributes<HTMLPictureElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: HTMLAttributes<HTMLProgressElement>;
    q: HTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: HTMLAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    slot: HTMLAttributes<HTMLSlotElement>;
    small: HTMLAttributes<HTMLElement>;
    source: HTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: HTMLAttributes<HTMLTableCellElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: HTMLAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: HTMLAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: HTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    var: HTMLAttributes<HTMLElement>;
    video: HTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;

    //SVG
    svg: SVGAttributes<SVGSVGElement>;
    animate: SVGAttributes<SVGAnimateElement>;
    circle: SVGAttributes<SVGCircleElement>;
    animateMotion: SVGAttributes<SVGAnimateMotionElement>;
    animateTransform: SVGAttributes<SVGAnimateElement>;
    clipPath: SVGAttributes<SVGClipPathElement>;
    defs: SVGAttributes<SVGDefsElement>;
    desc: SVGAttributes<SVGDescElement>;
    ellipse: SVGAttributes<SVGEllipseElement>;
    feBlend: SVGAttributes<SVGFEBlendElement>;
    feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>;
    feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>;
    feComposite: SVGAttributes<SVGFECompositeElement>;
    feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>;
    feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>;
    feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>;
    feDistantLight: SVGAttributes<SVGFEDistantLightElement>;
    feDropShadow: SVGAttributes<SVGFEDropShadowElement>;
    feFlood: SVGAttributes<SVGFEFloodElement>;
    feFuncA: SVGAttributes<SVGFEFuncAElement>;
    feFuncB: SVGAttributes<SVGFEFuncBElement>;
    feFuncG: SVGAttributes<SVGFEFuncGElement>;
    feFuncR: SVGAttributes<SVGFEFuncRElement>;
    feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>;
    feImage: SVGAttributes<SVGFEImageElement>;
    feMerge: SVGAttributes<SVGFEMergeElement>;
    feMergeNode: SVGAttributes<SVGFEMergeNodeElement>;
    feMorphology: SVGAttributes<SVGFEMorphologyElement>;
    feOffset: SVGAttributes<SVGFEOffsetElement>;
    fePointLight: SVGAttributes<SVGFEPointLightElement>;
    feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>;
    feSpotLight: SVGAttributes<SVGFESpotLightElement>;
    feTile: SVGAttributes<SVGFETileElement>;
    feTurbulence: SVGAttributes<SVGFETurbulenceElement>;
    filter: SVGAttributes<SVGFilterElement>;
    foreignObject: SVGAttributes<SVGForeignObjectElement>;
    g: SVGAttributes<SVGGElement>;
    image: SVGAttributes<SVGImageElement>;
    line: SVGAttributes<SVGLineElement>;
    linearGradient: SVGAttributes<SVGLinearGradientElement>;
    marker: SVGAttributes<SVGMarkerElement>;
    mask: SVGAttributes<SVGMaskElement>;
    metadata: SVGAttributes<SVGMetadataElement>;
    mpath: SVGAttributes<SVGMPathElement>;
    path: SVGAttributes<SVGPathElement>;
    pattern: SVGAttributes<SVGPatternElement>;
    polygon: SVGAttributes<SVGPolygonElement>;
    polyline: SVGAttributes<SVGPolylineElement>;
    radialGradient: SVGAttributes<SVGRadialGradientElement>;
    rect: SVGAttributes<SVGRectElement>;
    set: SVGAttributes<SVGSetElement>;
    stop: SVGAttributes<SVGStopElement>;
    switch: SVGAttributes<SVGSwitchElement>;
    symbol: SVGAttributes<SVGSymbolElement>;
    text: SVGAttributes<SVGTextElement>;
    textPath: SVGAttributes<SVGTextPathElement>;
    tspan: SVGAttributes<SVGTSpanElement>;
    use: SVGAttributes<SVGUseElement>;
    view: SVGAttributes<SVGViewElement>;
  }
}
