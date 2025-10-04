
import type { CanvasElementData } from '@/schemas/canvas';

function propertiesToStyleString(properties: Record<string, any>): string {
    const style: React.CSSProperties = {};
    const directProperties = [
        'width', 'height', 'minHeight', 'display', 'padding', 'margin', 
        'color', 'fontSize', 'fontWeight', 'textAlign', 'backgroundColor', 
        'backgroundImage', 'backgroundRepeat', 'border', 'borderRadius', 
        'boxShadow', 'flexDirection', 'justifyContent', 'alignItems', 
        'flexWrap', 'gap', 'borderTop', 'paddingTop', 'visibility'
    ];

    for (const key of directProperties) {
        if (properties[key]) {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            (style as any)[cssKey] = properties[key];
        }
    }
    
    return Object.entries(style)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');
}

function renderElementToHtml(element: CanvasElementData): string {
    const { type, properties, children, id } = element;
    
    // Check for visibility property
    if (properties && properties['visibility'] === 'hidden') {
        return ''; // Don't render the element if it's hidden
    }
    
    const styleString = propertiesToStyleString(properties);
    const classString = properties['className'] || '';

    const attributes = `id="${id}" style="${styleString}" class="${classString}"`;

    switch (type) {
        case 'heading': {
            const level = properties['level'] || 1;
            const text = properties['text'] || '';
            return `<h${level} ${attributes}>${text}</h${level}>`;
        }
        case 'text': {
            const text = properties['text'] || '';
            return `<div ${attributes}>${text}</div>`;
        }
        case 'button': {
            const text = properties['text'] || 'Button';
            return `<button ${attributes}>${text}</button>`;
        }
        case 'image': {
            const src = properties['src'] || '';
            const alt = properties['alt'] || '';
            return `<img src="${src}" alt="${alt}" ${attributes} />`;
        }
        case 'video': {
            const src = properties['src'] || '';
            return `<video src="${src}" controls ${attributes}></video>`;
        }
        case 'input': {
            const inputType = properties['type'] || 'text';
            const placeholder = properties['placeholder'] || '';
            const value = properties['value'] || '';
            return `<input type="${inputType}" placeholder="${placeholder}" value="${value}" ${attributes} />`;
        }
        case 'textarea': {
             const placeholder = properties['placeholder'] || '';
             const value = properties['value'] || '';
             return `<textarea placeholder="${placeholder}" ${attributes}>${value}</textarea>`;
        }
        case 'label': {
             const text = properties['text'] || '';
             return `<label ${attributes}>${text}</label>`;
        }
        case 'section':
        case 'div':
        case 'container':
        case 'form': {
            const Tag = type === 'container' ? 'div' : type;
            const childrenHtml = children ? children.map(renderElementToHtml).join('') : '';
            return `<${Tag} ${attributes}>${childrenHtml}</${Tag}>`;
        }
        case 'list': {
            const childrenHtml = children ? children.map(renderElementToHtml).join('') : '';
            return `<ul ${attributes}>${childrenHtml}</ul>`;
        }
        case 'list-item': {
             const text = properties['text'] || '';
            return `<li ${attributes}>${text}</li>`;
        }
        case 'html': {
            return `<div ${attributes}>${properties['htmlContent'] || ''}</div>`;
        }
        default:
            return '';
    }
}

function hexToHsl(hex: string): string | null {
    if (!hex.startsWith('#')) return null;

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    } else {
        return null;
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


export function convertJsonToHtml(elements: CanvasElementData[], theme?: { primary?: string, accent?: string }): string {
  const bodyContent = elements.map(renderElementToHtml).join('');
  
  const primaryHsl = theme?.primary ? hexToHsl(theme.primary) : null;
  const accentHsl = theme?.accent ? hexToHsl(theme.accent) : null;

  const themeStyles = `
    :root {
      ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
      ${accentHsl ? `--accent: ${accentHsl};` : ''}
    }
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; }
          * { box-sizing: border-box; }
          ${themeStyles}
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}
