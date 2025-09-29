
import type { CanvasElementData } from '@/lib/schemas';

function propertiesToStyleString(properties: Record<string, any>): string {
    const style: React.CSSProperties = {};
    const directProperties = [
        'width', 'height', 'minHeight', 'display', 'padding', 'margin', 
        'color', 'fontSize', 'fontWeight', 'textAlign', 'backgroundColor', 
        'backgroundImage', 'backgroundRepeat', 'border', 'borderRadius', 
        'boxShadow', 'flexDirection', 'justifyContent', 'alignItems', 
        'flexWrap', 'gap', 'borderTop', 'paddingTop'
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


export function convertJsonToHtml(elements: CanvasElementData[]): string {
  const bodyContent = elements.map(renderElementToHtml).join('');
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
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}
