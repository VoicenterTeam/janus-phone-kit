// @ts-nocheck

import Konva from "konva";

export class KonvaDrawer {
  private stage: any | null = null

  constructor (config) {
    const { container, width, height } = config
    const stage = new Konva.Stage({
      container: container,
      width: width,
      height: height,
    });

    this.stage = stage
  }

  /**
   * Initiate a Camera instance and wait for the camera stream to be ready.
   * @param cameraParam From app `STATE.camera`.
   */
  addLayer () {
    let layer = new Konva.Layer();
    this.stage.add(layer);
    return layer
  }

  initFreeDrawing (layer) {
    let isPaint = false
    let mode = 'brush'
    let lastLine

    this.stage.on('mousedown touchstart', (e) => {
      isPaint = true;
      let pos = this.stage.getPointerPosition();
      lastLine = new Konva.Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation:
          mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      layer.add(lastLine);
    });

    this.stage.on('mouseup touchend', () => {
      isPaint = false;
    });

    // and core function - drawing
    this.stage.on('mousemove touchmove', (e) => {
      if (!isPaint) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = this.stage.getPointerPosition();
      let newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
    });
  }

  addRect (layer, width, height, color = 'white') {
    let backgroundRect = new Konva.Rect({
      width: width,
      height: height,
      fill: color, // Set the fill color to white
    });
    layer.add(backgroundRect);
    return backgroundRect
  }

  addImage (layer, imageObj) {
    let konvaImage = new Konva.Image({
      image: imageObj,
      x: (this.stage.width() - imageObj.width) / 2, // Center horizontally
      y: (this.stage.height() - imageObj.height) / 2, // Center vertically
    });

    // Add the image to the layer
    layer.add(konvaImage);
    return konvaImage
  }

  // Hack to make the drawings visible after canvas resize
  addWakeupLine (layer) {
    const lastLine = new Konva.Line({
      stroke: '#ffffff',
      strokeWidth: 1,
      globalCompositeOperation: 'source-over',
      lineCap: 'round',
      lineJoin: 'round',
      points: [0, 0, 0, 0],
    });
    layer.add(lastLine);
  }

}
