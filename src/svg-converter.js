import React, { useEffect, useRef } from 'react';
import opentype from 'opentype.js';



export function SvgConverter({ text,
    fontUrl = '//Noto_Sans_JP/static/NotoSansJP-Bold.ttf',
     fontSize = '14' }) {
  const svgRef = useRef(null);

  useEffect(() => {
    async function convertTextToSvgPath() {
      const font = await opentype.load(fontUrl);
      const path = font.getPath(text, 0, 0, fontSize);
      const svgPath = path.toSVG();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `${path.x1} ${-path.y1} ${path.width} ${path.height}`);
      svg.innerHTML = `<path d="${svgPath}" />`;
      svgRef.current.appendChild(svg);
    }

    convertTextToSvgPath();
  }, [text, fontUrl, fontSize]);

  return <div ref={svgRef} />;
}