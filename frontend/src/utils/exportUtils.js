import jsPDF from 'jspdf';

// Renders the full extent of all objects on the canvas
export function renderFullBoardToDataURL(fabricCanvas, { padding = 40 } = {}) {

  const objects = fabricCanvas.getObjects();  //gets every object on the canvas

  if (objects.length === 0) { //empty canvas
    return {
      dataUrl: fabricCanvas.toDataURL({ format: 'png' }),
      width: fabricCanvas.getWidth(),
      height: fabricCanvas.getHeight(),
    };
  }

  //to get top, bottom, left, right most objects coordinates
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objects.forEach((obj) => {
    const rect = obj.getBoundingRect(true, true);
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.left + rect.width);
    maxY = Math.max(maxY, rect.top + rect.height);
  });

  //export height and width
  const width = Math.max(1, maxX - minX + padding * 2);
  const height = Math.max(1, maxY - minY + padding * 2);

  const prevVpt = fabricCanvas.viewportTransform.slice(); //stores zoom, pan, scale
  const prevWidth = fabricCanvas.getWidth();
  const prevHeight = fabricCanvas.getHeight();

  fabricCanvas.setDimensions({ width, height });
  fabricCanvas.setViewportTransform([1, 0, 0, 1, -minX + padding, -minY + padding]);
  fabricCanvas.renderAll(); //redraw everything

  const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1 });

  // Restore original viewport/size
  fabricCanvas.setDimensions({ width: prevWidth, height: prevHeight });
  fabricCanvas.setViewportTransform(prevVpt);
  fabricCanvas.renderAll();

  return { dataUrl, width, height };
}

//to download png image
export function exportAsPNG(fabricCanvas, filename = 'whiteboard.png') {
  const { dataUrl } = renderFullBoardToDataURL(fabricCanvas);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

//to download as pdf
export function exportAsPDF(fabricCanvas, filename = 'whiteboard.pdf') {
  const { dataUrl, width, height } = renderFullBoardToDataURL(fabricCanvas);
  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  pdf.save(filename);
}