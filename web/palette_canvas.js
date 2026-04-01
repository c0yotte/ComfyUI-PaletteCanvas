import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Gradient Direction Widget
class GradientDirectionWidget {
    constructor(node, inputName, inputData, app) {
        this.node = node;
        this.inputName = inputName;
        this.inputData = inputData;
        this.app = app;
        this.value = inputData[1]?.default ?? 0.0;
        this.min = inputData[1]?.min ?? 0.0;
        this.max = inputData[1]?.max ?? 360.0;
        this.step = inputData[1]?.step ?? 1.0;
        this.isDragging = false;
        this.widgetY = 0;
        this.widget = this.createWidget();
    }

    createWidget() {
        const widget = {
            type: "gradient_direction",
            name: this.inputName,
            value: this.value,
            options: {},
            draw: (ctx, node, width, y) => {
                this.widgetY = y;
                this.draw(ctx, node, width, y);
            },
            mouse: (event, pos, node) => this.mouse(event, pos, node),
            computeSize: () => [200, 160],
            serialize: true,
            getValue: () => this.value,
            setValue: (v) => {
                this.value = Math.max(this.min, Math.min(this.max, v % 360));
                if (this.node.onResize) {
                    this.node.setDirtyCanvas(true, true);
                }
                app.graph.setDirtyCanvas(true, true);
            }
        };

        Object.defineProperty(widget, 'value', {
            get: () => this.value,
            set: (v) => {
                this.value = Math.max(this.min, Math.min(this.max, v % 360));
                // Sync to linked native widget so ComfyUI serialization picks it up
                if (widget.linkedWidget) {
                    widget.linkedWidget.value = this.value;
                }
                this.node.setDirtyCanvas(true, true);
                app.graph.setDirtyCanvas(true, true);
            }
        });

        return widget;
    }

    draw(ctx, node, width, y) {
        const labelHeight = 15;
        const circleRadius = 45;
        const centerX = width / 2;
        const centerY = y + labelHeight + circleRadius + 20;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Gradient Direction', centerX, y + 12);

        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, circleRadius);
        gradient.addColorStop(0, '#333');
        gradient.addColorStop(1, '#111');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const startX = centerX + Math.cos(angle) * (circleRadius - 5);
            const startY = centerY + Math.sin(angle) * (circleRadius - 5);
            const endX = centerX + Math.cos(angle) * circleRadius;
            const endY = centerY + Math.sin(angle) * circleRadius;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        ctx.fillStyle = '#ccc';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0°', centerX + circleRadius + 15, centerY + 3);
        ctx.fillText('90°', centerX, centerY - circleRadius - 8);
        ctx.fillText('180°', centerX - circleRadius - 15, centerY + 3);
        ctx.fillText('270°', centerX, centerY + circleRadius + 15);

        const angleRad = (this.value) * Math.PI / 180;
        const arrowLength = circleRadius - 10;
        const arrowX = centerX + Math.cos(angleRad) * arrowLength;
        const arrowY = centerY - Math.sin(angleRad) * arrowLength;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.stroke();

        const arrowHeadLength = 8;
        const arrowHeadAngle = 0.5;
        // Canvas Y is inverted: arrow tip in canvas coords has direction angle = -angleRad
        // Wings point back from tip, rotated ±arrowHeadAngle from that back-direction
        const backAngle = Math.PI + angleRad; // direction from tip back to center, in math coords
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX + arrowHeadLength * Math.cos(backAngle - arrowHeadAngle),
            arrowY - arrowHeadLength * Math.sin(backAngle - arrowHeadAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX + arrowHeadLength * Math.cos(backAngle + arrowHeadAngle),
            arrowY - arrowHeadLength * Math.sin(backAngle + arrowHeadAngle)
        );
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.value.toFixed(0)}°`, centerX, centerY + circleRadius + 35);
    }

    mouse(event, pos, node) {
        const labelHeight = 15;
        const circleRadius = 45;
        const centerX = node.size[0] / 2;
        const centerY = this.widgetY + labelHeight + circleRadius + 20;
        
        const dx = pos[0] - centerX;
        const dy = pos[1] - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (event.type === "pointerdown") {
            if (distance <= circleRadius + 10) {
                this.isDragging = true;
                this.updateAngle(dx, dy);
                return true;
            }
        } else if (event.type === "pointermove") {
            if (this.isDragging) {
                this.updateAngle(dx, dy);
                return true;
            }
        } else if (event.type === "pointerup") {
            if (this.isDragging) {
                this.isDragging = false;
                return true;
            }
        }
        return false;
    }

    updateAngle(dx, dy) {
        let angle = Math.atan2(-dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        angle = Math.round(angle / this.step) * this.step;
        angle = angle % 360;
        this.widget.setValue(angle);
        this.node.setDirtyCanvas(true, true);
        app.graph.change();
    }
}

// Shape Position Widget - adaptive to aspect ratio
class ShapePositionWidget {
    constructor(node, app) {
        this.node = node;
        this.app = app;
        this.offsetX = node.hiddenOffsetXWidget?.value ?? 0.0;
        this.offsetY = node.hiddenOffsetYWidget?.value ?? 0.0;
        this.isDragging = false;
        this.widgetY = 0;
        this.baseSize = 120; // Base size for calculation
        this.widget = this.createWidget();
        this.setupCallbacks();
    }

    setupCallbacks() {
        // Watch for width/height changes
        const widthWidget = this.node.widgets?.find(w => w.name === 'width');
        const heightWidget = this.node.widgets?.find(w => w.name === 'height');
        
        if (widthWidget) {
            const originalCallback = widthWidget.callback;
            widthWidget.callback = (v) => {
                if (originalCallback) originalCallback(v);
                this.node.setDirtyCanvas(true, true);
            };
        }
        if (heightWidget) {
            const originalCallback = heightWidget.callback;
            heightWidget.callback = (v) => {
                if (originalCallback) originalCallback(v);
                this.node.setDirtyCanvas(true, true);
            };
        }
    }

    getAspectRatio() {
        const widthWidget = this.node.widgets?.find(w => w.name === 'width');
        const heightWidget = this.node.widgets?.find(w => w.name === 'height');
        
        const w = widthWidget?.value ?? 512;
        const h = heightWidget?.value ?? 512;
        
        return w / h;
    }

    getDimensions() {
        const aspect = this.getAspectRatio();
        const maxSize = this.baseSize;
        
        let areaWidth, areaHeight;
        
        if (aspect >= 1) {
            // Width >= Height - landscape or square
            areaWidth = maxSize;
            areaHeight = maxSize / aspect;
        } else {
            // Height > Width - portrait
            areaHeight = maxSize;
            areaWidth = maxSize * aspect;
        }
        
        return { width: areaWidth, height: areaHeight, aspect };
    }

    createWidget() {
        const self = this;
        const widget = {
            type: "shape_position",
            name: "shape_position_control",
            options: {},
            draw: (ctx, node, width, y) => {
                this.widgetY = y;
                this.draw(ctx, node, width, y);
            },
            mouse: (event, pos, node) => this.mouse(event, pos, node),
            computeSize: () => [200, 160],
            serialize: false, // Hidden widgets shape_offset_x/y handle serialization
            getValue: () => [this.offsetX, this.offsetY],
            setValue: (v) => {
                if (Array.isArray(v)) {
                    this.offsetX = v[0];
                    this.offsetY = v[1];
                }
                this.updateHiddenWidgets();
                app.graph.setDirtyCanvas(true, true);
            }
        };

        // Dynamic value property so serialization always captures current offsetX/offsetY
        Object.defineProperty(widget, 'value', {
            get: () => [self.offsetX, self.offsetY],
            set: (v) => {
                if (Array.isArray(v)) {
                    self.offsetX = v[0] ?? 0;
                    self.offsetY = v[1] ?? 0;
                    self.updateHiddenWidgets();
                    self.node.setDirtyCanvas(true, true);
                }
            }
        });

        return widget;
    }

    updateHiddenWidgets() {
        if (this.node.hiddenOffsetXWidget) {
            this.node.hiddenOffsetXWidget.value = this.offsetX;
            if (this.node.hiddenOffsetXWidget.callback) {
                this.node.hiddenOffsetXWidget.callback(this.offsetX);
            }
        }
        if (this.node.hiddenOffsetYWidget) {
            this.node.hiddenOffsetYWidget.value = this.offsetY;
            if (this.node.hiddenOffsetYWidget.callback) {
                this.node.hiddenOffsetYWidget.callback(this.offsetY);
            }
        }
        
        this.node.setDirtyCanvas(true, true);
    }

    draw(ctx, node, width, y) {
        const labelHeight = 15;
        const { width: areaWidth, height: areaHeight } = this.getDimensions();
        
        const centerX = width / 2;
        const centerY = y + labelHeight + this.baseSize / 2 + 10;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Shape Position', centerX, y + 12);

        const boxLeft = centerX - areaWidth / 2;
        const boxTop = centerY - areaHeight / 2;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxLeft, boxTop, areaWidth, areaHeight);

        const gradient = ctx.createLinearGradient(boxLeft, boxTop, boxLeft + areaWidth, boxTop + areaHeight);
        gradient.addColorStop(0, '#222');
        gradient.addColorStop(1, '#111');
        ctx.fillStyle = gradient;
        ctx.fillRect(boxLeft, boxTop, areaWidth, areaHeight);

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        
        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(centerX, boxTop);
        ctx.lineTo(centerX, boxTop + areaHeight);
        ctx.stroke();
        
        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(boxLeft, centerY);
        ctx.lineTo(boxLeft + areaWidth, centerY);
        ctx.stroke();

        // Handle position - scaled by aspect ratio
        const handleX = centerX + this.offsetX * (areaWidth / 2);
        const handleY = centerY - this.offsetY * (areaHeight / 2);
        const handleRadius = 8;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        const crosshairSize = Math.min(areaWidth, areaHeight) * 0.15;
        ctx.beginPath();
        ctx.moveTo(centerX - crosshairSize, centerY);
        ctx.lineTo(centerX + crosshairSize, centerY);
        ctx.moveTo(centerX, centerY - crosshairSize);
        ctx.lineTo(centerX, centerY + crosshairSize);
        ctx.stroke();

        if (this.offsetX !== 0 || this.offsetY !== 0) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(handleX, handleY);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`X: ${this.offsetX.toFixed(2)}, Y: ${this.offsetY.toFixed(2)}`, centerX, centerY + this.baseSize / 2 + 25);
    }

    mouse(event, pos, node) {
        const labelHeight = 15;
        const { width: areaWidth, height: areaHeight } = this.getDimensions();
        
        const centerX = node.size[0] / 2;
        const centerY = this.widgetY + labelHeight + this.baseSize / 2 + 10;
        
        const boxLeft = centerX - areaWidth / 2;
        const boxTop = centerY - areaHeight / 2;
        
        const dx = pos[0] - centerX;
        const dy = pos[1] - centerY;

        if (event.type === "pointerdown") {
            if (pos[0] >= boxLeft && pos[0] <= boxLeft + areaWidth &&
                pos[1] >= boxTop && pos[1] <= boxTop + areaHeight) {
                this.isDragging = true;
                this.updatePosition(dx, dy, areaWidth / 2, areaHeight / 2);
                return true;
            }
        } else if (event.type === "pointermove") {
            if (this.isDragging) {
                this.updatePosition(dx, dy, areaWidth / 2, areaHeight / 2);
                return true;
            }
        } else if (event.type === "pointerup") {
            if (this.isDragging) {
                this.isDragging = false;
                return true;
            }
        }
        return false;
    }

    updatePosition(dx, dy, maxRadiusX, maxRadiusY) {
        let newX = dx / maxRadiusX;
        let newY = -dy / maxRadiusY;
        
        newX = Math.max(-1, Math.min(1, newX));
        newY = Math.max(-1, Math.min(1, newY));
        
        this.offsetX = Math.round(newX * 100) / 100;
        this.offsetY = Math.round(newY * 100) / 100;
        
        this.updateHiddenWidgets();
        this.node.setDirtyCanvas(true, true);
        app.graph.change();
    }
}

app.registerExtension({
    name: "Comfy.PaletteCanvasRGB",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "PaletteCanvasGradient") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function () {
                const result = onNodeCreated?.apply(this, arguments);
                
                this.compassWidget = null;
                this.compassWidgetObject = null;
                this.shapePositionWidget = null;
                this.shapePositionWidgetObject = null;
                this.shapeTypeWidget = null;
                this.shapeScaleWidget = null;
                this.shapeScaleSliderObject = null;
                this.hiddenOffsetXWidget = null;
                this.hiddenOffsetYWidget = null;
                this.color2Widget = null;
                this.color3Widget = null;

                // Find COLOR widgets and store references
                this.backgroundWidget = this.widgets?.find(w => w.name === 'background');
                this.gradientWidget = this.widgets?.find(w => w.name === 'gradient');
                this.shapeColorWidget = this.widgets?.find(w => w.name === 'shape');
                
                // Add callbacks to force redraw on color change
                const colorWidgets = [
                    { widget: this.backgroundWidget, name: 'background' },
                    { widget: this.gradientWidget, name: 'gradient' },
                    { widget: this.shapeColorWidget, name: 'shape' }
                ];
                
                colorWidgets.forEach(({ widget, name }) => {
                    if (widget) {
                        const originalCallback = widget.callback;
                        widget.callback = function(value) {
                            if (originalCallback) {
                                originalCallback.apply(this, arguments);
                            }
                            // Force immediate update
                            if (widget.value !== value) {
                                widget.value = value;
                            }
                            app.graph.setDirtyCanvas(true, true);
                        };
                    }
                });

                // Store shape widget references (native ComfyUI sliders)
                this.shapeScaleWidget = this.widgets?.find(w => w.name === 'shape_scale');
                if (this.shapeScaleWidget) {
                    this.widgets.splice(this.widgets.indexOf(this.shapeScaleWidget), 1);
                }
                
                this.shapeScaleXWidget = this.widgets?.find(w => w.name === 'shape_scale_x');
                if (this.shapeScaleXWidget) {
                    this.widgets.splice(this.widgets.indexOf(this.shapeScaleXWidget), 1);
                }
                
                this.shapeScaleYWidget = this.widgets?.find(w => w.name === 'shape_scale_y');
                if (this.shapeScaleYWidget) {
                    this.widgets.splice(this.widgets.indexOf(this.shapeScaleYWidget), 1);
                }

                // Store shape_type widget
                const shapeTypeIndex = this.widgets?.findIndex(w => w.name === 'shape_type');
                if (shapeTypeIndex >= 0) {
                    this.shapeTypeWidget = this.widgets[shapeTypeIndex];
                    this.widgets.splice(shapeTypeIndex, 1);
                }

                // Handle hidden offset widgets
                const offsetXIndex = this.widgets?.findIndex(w => w.name === 'shape_offset_x');
                const offsetYIndex = this.widgets?.findIndex(w => w.name === 'shape_offset_y');
                
                if (offsetXIndex >= 0) {
                    this.hiddenOffsetXWidget = this.widgets[offsetXIndex];
                    this.hiddenOffsetXWidget.computeSize = () => [0, 0];
                    this.hiddenOffsetXWidget.draw = () => {};
                }
                if (offsetYIndex >= 0) {
                    this.hiddenOffsetYWidget = this.widgets[offsetYIndex];
                    this.hiddenOffsetYWidget.computeSize = () => [0, 0];
                    this.hiddenOffsetYWidget.draw = () => {};
                }
                
                this.shapePositionWidgetObject = new ShapePositionWidget(this, app);

                // Handle gradient direction widget
                const gradientWidgetIndex = this.widgets?.findIndex(w => w.name === 'gradient_angle');
                if (gradientWidgetIndex >= 0) {
                    const originalGradientWidget = this.widgets[gradientWidgetIndex];
                    this.widgets.splice(gradientWidgetIndex, 1);
                    
                    const inputData = nodeData.input.optional['gradient_angle'];
                    const gradientWidget = new GradientDirectionWidget(
                        this, 'gradient_angle', ['FLOAT', inputData], app
                    );
                    gradientWidget.widget.linkedWidget = originalGradientWidget;
                    originalGradientWidget.customWidget = gradientWidget;
                    
                    this.compassWidgetObject = gradientWidget;
                }

                // Setup toggle callbacks
                const useGradientWidget = this.widgets.find(w => w.name === 'use_gradient');
                if (useGradientWidget) {
                    const originalCallback = useGradientWidget.callback;
                    const self = this;
                    
                    useGradientWidget.callback = function(value) {
                        if (originalCallback) {
                            originalCallback.apply(this, arguments);
                        }
                        self.toggleGradientWidgets(value);
                    };
                    
                    this.toggleGradientWidgets(useGradientWidget.value);
                }

                const useShapeWidget = this.widgets.find(w => w.name === 'use_shape');
                if (useShapeWidget) {
                    const originalCallback = useShapeWidget.callback;
                    const self = this;
                    
                    useShapeWidget.callback = function(value) {
                        if (originalCallback) {
                            originalCallback.apply(this, arguments);
                        }
                        self.toggleShapeWidgets(value);
                    };
                    
                    this.toggleShapeWidgets(useShapeWidget.value);
                }

                return result;
            };
            
            // Serialize ALL widget values by name — immune to widgets_values positional shifts
            const onSerialize = nodeType.prototype.onSerialize;
            nodeType.prototype.onSerialize = function(data) {
                const result = onSerialize?.apply(this, arguments);
                data.palette_canvas_state = {
                    // Custom interactive widgets
                    gradient_angle: this.compassWidgetObject?.value,
                    shape_offset_x: this.shapePositionWidgetObject?.offsetX,
                    shape_offset_y: this.shapePositionWidgetObject?.offsetY,
                    // Color widgets (may be spliced out of widgets array)
                    gradient_color: this.gradientWidget?.value,
                    shape_color: this.shapeColorWidget?.value,
                    // Native widgets kept as references even when spliced out
                    shape_type: this.shapeTypeWidget?.value,
                    shape_scale: this.shapeScaleWidget?.value,
                    shape_scale_x: this.shapeScaleXWidget?.value,
                    shape_scale_y: this.shapeScaleYWidget?.value,
                    shape_offset_x_native: this.hiddenOffsetXWidget?.value,
                    shape_offset_y_native: this.hiddenOffsetYWidget?.value,
                    // Widgets still in the array — read directly
                    background_color: this.backgroundWidget?.value,
                    use_gradient: this.widgets?.find(w => w.name === 'use_gradient')?.value,
                    use_shape: this.widgets?.find(w => w.name === 'use_shape')?.value,
                    dither: this.widgets?.find(w => w.name === 'dither')?.value,
                    dither_strength: this.widgets?.find(w => w.name === 'dither_strength')?.value,
                    width: this.widgets?.find(w => w.name === 'width')?.value,
                    height: this.widgets?.find(w => w.name === 'height')?.value,
                };
                return result;
            };

            // Handle workflow loading/restoring
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function(info) {
                // Read named state BEFORE base onConfigure (which may clobber widgets via widgets_values)
                const state = info?.palette_canvas_state;

                // Skip base onConfigure's broken positional widget restoration if we have our named state.
                // Still call it for any side effects (e.g. node size, connections), but then override all values.
                const result = onConfigure?.apply(this, arguments);

                setTimeout(() => {
                    if (!state) {
                        // No named state (old workflow) — just re-apply toggle visibility
                        const useGradientWidget = this.widgets?.find(w => w.name === 'use_gradient');
                        const useShapeWidget = this.widgets?.find(w => w.name === 'use_shape');
                        if (useGradientWidget) this.toggleGradientWidgets(useGradientWidget.value);
                        if (useShapeWidget) this.toggleShapeWidgets(useShapeWidget.value);
                        this.setSize(this.computeSize());
                        this.setDirtyCanvas(true, true);
                        return;
                    }

                    // Restore all native widgets by name
                    const setWidget = (name, value) => {
                        if (value === undefined) return;
                        const w = this.widgets?.find(w => w.name === name);
                        if (w) w.value = value;
                    };
                    setWidget('width', state.width);
                    setWidget('height', state.height);
                    setWidget('use_gradient', state.use_gradient);
                    setWidget('use_shape', state.use_shape);
                    setWidget('dither', state.dither);
                    setWidget('dither_strength', state.dither_strength);

                    // Restore color widgets (direct references, always valid)
                    if (state.background_color !== undefined && this.backgroundWidget) {
                        this.backgroundWidget.value = state.background_color;
                    }
                    if (state.gradient_color !== undefined && this.gradientWidget) {
                        this.gradientWidget.value = state.gradient_color;
                        this._savedGradientValue = state.gradient_color;
                    }
                    if (state.shape_color !== undefined && this.shapeColorWidget) {
                        this.shapeColorWidget.value = state.shape_color;
                        this._savedShapeColorValue = state.shape_color;
                    }

                    // Restore spliced-out shape widgets
                    if (state.shape_type !== undefined && this.shapeTypeWidget) {
                        this.shapeTypeWidget.value = state.shape_type;
                        this._savedShapeTypeValue = state.shape_type;
                    }
                    if (state.shape_scale !== undefined && this.shapeScaleWidget) {
                        this.shapeScaleWidget.value = state.shape_scale;
                        this._savedShapeScaleValue = state.shape_scale;
                    }
                    if (state.shape_scale_x !== undefined && this.shapeScaleXWidget) {
                        this.shapeScaleXWidget.value = state.shape_scale_x;
                        this._savedShapeScaleXValue = state.shape_scale_x;
                    }
                    if (state.shape_scale_y !== undefined && this.shapeScaleYWidget) {
                        this.shapeScaleYWidget.value = state.shape_scale_y;
                        this._savedShapeScaleYValue = state.shape_scale_y;
                    }

                    // Restore gradient angle
                    if (state.gradient_angle !== undefined && this.compassWidgetObject) {
                        this.compassWidgetObject.widget.value = state.gradient_angle;
                        this._savedGradientAngle = state.gradient_angle;
                    }

                    // Restore shape position
                    if (state.shape_offset_x !== undefined || state.shape_offset_y !== undefined) {
                        const ox = state.shape_offset_x ?? 0;
                        const oy = state.shape_offset_y ?? 0;
                        if (this.shapePositionWidgetObject) {
                            this.shapePositionWidgetObject.offsetX = ox;
                            this.shapePositionWidgetObject.offsetY = oy;
                            this.shapePositionWidgetObject.updateHiddenWidgets();
                        }
                        this._savedOffsetXValue = ox;
                        this._savedOffsetYValue = oy;
                    }

                    // Re-apply toggle visibility with all values now correct
                    if (state.use_gradient !== undefined) {
                        this.toggleGradientWidgets(state.use_gradient);
                    }
                    if (state.use_shape !== undefined) {
                        this.toggleShapeWidgets(state.use_shape);
                    }

                    this.setSize(this.computeSize());
                    this.setDirtyCanvas(true, true);
                }, 100);

                return result;
            };

            nodeType.prototype.toggleGradientWidgets = function(show) {
                if (show) {
                    // Restore saved values if exist
                    const savedGradientValue = this._savedGradientValue;
                    const savedAngleValue = this._savedGradientAngle;
                    
                    // Add gradient widget after background
                    if (this.gradientWidget && !this.widgets.includes(this.gradientWidget)) {
                        const backgroundIndex = this.widgets.findIndex(w => w.name === 'background');
                        if (backgroundIndex >= 0) {
                            this.widgets.splice(backgroundIndex + 1, 0, this.gradientWidget);
                        } else {
                            this.addCustomWidget(this.gradientWidget);
                        }
                        // Restore value after adding
                        if (savedGradientValue && this.gradientWidget) {
                            this.gradientWidget.value = savedGradientValue;
                        }
                    }
                    
                    // Add compass widget after gradient
                    if (!this.compassWidget && this.compassWidgetObject) {
                        const gradientIndex = this.widgets.indexOf(this.gradientWidget);
                        if (gradientIndex >= 0) {
                            this.widgets.splice(gradientIndex + 1, 0, this.compassWidgetObject.widget);
                            this.compassWidget = this.compassWidgetObject.widget;
                        } else {
                            this.addCustomWidget(this.compassWidgetObject.widget);
                            this.compassWidget = this.compassWidgetObject.widget;
                        }
                        // Restore angle value through widget to trigger linkedWidget sync
                        if (savedAngleValue !== undefined && this.compassWidgetObject) {
                            this.compassWidgetObject.widget.value = savedAngleValue;
                        }
                    }
                } else {
                    // Save values before removing
                    if (this.gradientWidget) {
                        this._savedGradientValue = this.gradientWidget.value;
                    }
                    if (this.compassWidgetObject) {
                        this._savedGradientAngle = this.compassWidgetObject.value;
                    }
                    
                    // Remove compass widget first
                    if (this.compassWidget) {
                        const index = this.widgets.indexOf(this.compassWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                        this.compassWidget = null;
                    }
                    
                    // Remove gradient widget
                    if (this.gradientWidget) {
                        const index = this.widgets.indexOf(this.gradientWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }
                }
                
                this.onResize?.(this.size);
                this.setSize(this.computeSize());
                this.setDirtyCanvas(true, true);
            };

            nodeType.prototype.toggleShapeWidgets = function(show) {
                if (show) {
                    // Restore saved values
                    const savedShapeColor = this._savedShapeColorValue;
                    const savedShapeType = this._savedShapeTypeValue;
                    const savedShapeScale = this._savedShapeScaleValue;
                    const savedShapeScaleX = this._savedShapeScaleXValue;
                    const savedShapeScaleY = this._savedShapeScaleYValue;
                    const savedOffsetX = this._savedOffsetXValue;
                    const savedOffsetY = this._savedOffsetYValue;
                    
                    // 1. Add shape color widget after gradient (or after background if no gradient)
                    if (this.shapeColorWidget && !this.widgets.includes(this.shapeColorWidget)) {
                        const gradientIndex = this.widgets.findIndex(w => w.name === 'gradient');
                        if (gradientIndex >= 0) {
                            this.widgets.splice(gradientIndex + 1, 0, this.shapeColorWidget);
                        } else {
                            // No gradient - add after background
                            const backgroundIndex = this.widgets.findIndex(w => w.name === 'background');
                            if (backgroundIndex >= 0) {
                                this.widgets.splice(backgroundIndex + 1, 0, this.shapeColorWidget);
                            } else {
                                this.addCustomWidget(this.shapeColorWidget);
                            }
                        }
                        // Restore value
                        if (savedShapeColor && this.shapeColorWidget) {
                            this.shapeColorWidget.value = savedShapeColor;
                        }
                    }

                    // 2. Add shape_type after shape color
                    if (this.shapeTypeWidget && !this.widgets.includes(this.shapeTypeWidget)) {
                        const shapeColorIndex = this.widgets.indexOf(this.shapeColorWidget);
                        if (shapeColorIndex >= 0) {
                            this.widgets.splice(shapeColorIndex + 1, 0, this.shapeTypeWidget);
                        } else {
                            this.addCustomWidget(this.shapeTypeWidget);
                        }
                        // Restore value
                        if (savedShapeType && this.shapeTypeWidget) {
                            this.shapeTypeWidget.value = savedShapeType;
                        }
                    }
                    
                    // 3. Add shape_scale after shape_type
                    if (this.shapeScaleWidget && !this.widgets.includes(this.shapeScaleWidget)) {
                        const typeIndex = this.widgets.indexOf(this.shapeTypeWidget);
                        if (typeIndex >= 0) {
                            this.widgets.splice(typeIndex + 1, 0, this.shapeScaleWidget);
                        } else {
                            this.addCustomWidget(this.shapeScaleWidget);
                        }
                        // Restore value
                        if (savedShapeScale !== undefined && this.shapeScaleWidget) {
                            this.shapeScaleWidget.value = savedShapeScale;
                        }
                    }
                    
                    // 4. Add shape_scale_x after shape_scale
                    if (this.shapeScaleXWidget && !this.widgets.includes(this.shapeScaleXWidget)) {
                        const scaleIndex = this.widgets.indexOf(this.shapeScaleWidget);
                        if (scaleIndex >= 0) {
                            this.widgets.splice(scaleIndex + 1, 0, this.shapeScaleXWidget);
                        } else {
                            this.addCustomWidget(this.shapeScaleXWidget);
                        }
                        // Restore value
                        if (savedShapeScaleX !== undefined && this.shapeScaleXWidget) {
                            this.shapeScaleXWidget.value = savedShapeScaleX;
                        }
                    }
                    
                    // 5. Add shape_scale_y after shape_scale_x
                    if (this.shapeScaleYWidget && !this.widgets.includes(this.shapeScaleYWidget)) {
                        const scaleXIndex = this.widgets.indexOf(this.shapeScaleXWidget);
                        if (scaleXIndex >= 0) {
                            this.widgets.splice(scaleXIndex + 1, 0, this.shapeScaleYWidget);
                        } else {
                            this.addCustomWidget(this.shapeScaleYWidget);
                        }
                        // Restore value
                        if (savedShapeScaleY !== undefined && this.shapeScaleYWidget) {
                            this.shapeScaleYWidget.value = savedShapeScaleY;
                        }
                    }

                    // 6. Add shape_position at the very end
                    if (this.shapePositionWidgetObject && !this.shapePositionWidget) {
                        this.addCustomWidget(this.shapePositionWidgetObject.widget);
                        this.shapePositionWidget = this.shapePositionWidgetObject.widget;
                        // Restore position values
                        if ((savedOffsetX !== undefined || savedOffsetY !== undefined) && this.shapePositionWidgetObject) {
                            this.shapePositionWidgetObject.offsetX = savedOffsetX ?? 0;
                            this.shapePositionWidgetObject.offsetY = savedOffsetY ?? 0;
                            this.shapePositionWidgetObject.updateHiddenWidgets();
                        }
                    }
                } else {
                    // Save all values before removing
                    if (this.shapeColorWidget) {
                        this._savedShapeColorValue = this.shapeColorWidget.value;
                    }
                    if (this.shapeTypeWidget) {
                        this._savedShapeTypeValue = this.shapeTypeWidget.value;
                    }
                    if (this.shapeScaleWidget) {
                        this._savedShapeScaleValue = this.shapeScaleWidget.value;
                    }
                    if (this.shapeScaleXWidget) {
                        this._savedShapeScaleXValue = this.shapeScaleXWidget.value;
                    }
                    if (this.shapeScaleYWidget) {
                        this._savedShapeScaleYValue = this.shapeScaleYWidget.value;
                    }
                    if (this.shapePositionWidgetObject) {
                        this._savedOffsetXValue = this.shapePositionWidgetObject.offsetX;
                        this._savedOffsetYValue = this.shapePositionWidgetObject.offsetY;
                    }
                    
                    // Remove shape_position first (from bottom)
                    if (this.shapePositionWidget) {
                        const index = this.widgets.indexOf(this.shapePositionWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                        this.shapePositionWidget = null;
                    }
                    
                    // Remove shape_scale_y
                    if (this.shapeScaleYWidget) {
                        const index = this.widgets.indexOf(this.shapeScaleYWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }
                    
                    // Remove shape_scale_x
                    if (this.shapeScaleXWidget) {
                        const index = this.widgets.indexOf(this.shapeScaleXWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }
                    
                    // Remove shape_scale
                    if (this.shapeScaleWidget) {
                        const index = this.widgets.indexOf(this.shapeScaleWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }
                    
                    // Remove shape_type
                    if (this.shapeTypeWidget) {
                        const index = this.widgets.indexOf(this.shapeTypeWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }

                    // Remove shape color widget (from top)
                    if (this.shapeColorWidget) {
                        const index = this.widgets.indexOf(this.shapeColorWidget);
                        if (index >= 0) {
                            this.widgets.splice(index, 1);
                        }
                    }
                }
                
                this.onResize?.(this.size);
                this.setSize(this.computeSize());
                this.setDirtyCanvas(true, true);
            };
        }
    }
});
