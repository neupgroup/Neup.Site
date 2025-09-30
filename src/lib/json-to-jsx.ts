
import type { CanvasElementData } from '@/lib/schemas';

function propertiesToStyleObject(properties: Record<string, any>): React.CSSProperties {
    const style: React.CSSProperties = {};
    const directProperties = [
        'width', 'height', 'minHeight', 'display', 'padding', 'margin', 
        'color', 'fontSize', 'fontWeight', 'textAlign', 'backgroundColor', 
        'backgroundImage', 'backgroundRepeat', 'border', 'borderRadius', 
        'boxShadow', 'flexDirection', 'justifyContent', 'alignItems', 
        'flexWrap', 'gap', 'borderTop', 'paddingTop', 'marginLeft', 'marginRight', 'marginBottom'
    ];

    for (const key of directProperties) {
        if (properties[key]) {
            // Convert kebab-case to camelCase for JSX style object
            const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            (style as any)[camelCaseKey] = properties[key];
        }
    }
    return style;
}


function renderElementToJsx(element: CanvasElementData, level: number): string {
    const { type, properties, children, id } = element;
    const style = propertiesToStyleObject(properties);
    const className = properties['className'] || '';

    const attributes: Record<string, any> = {
        id,
        style,
        className,
    };
    
    // Add specific attributes for certain element types
    if (type === 'image') {
        attributes['src'] = properties['src'] || '';
        attributes['alt'] = properties['alt'] || '';
        attributes['width'] = parseInt(String(properties.width)) || 200;
        attributes['height'] = parseInt(String(properties.height)) || 100;
    }
    if (type === 'video') {
        attributes['src'] = properties['src'] || '';
        attributes['controls'] = true;
    }
    if (type === 'input') {
        attributes['type'] = properties['type'] || 'text';
        attributes['placeholder'] = properties['placeholder'] || '';
        attributes['defaultValue'] = properties['value'] || '';
    }
     if (type === 'textarea') {
        attributes['placeholder'] = properties['placeholder'] || '';
        attributes['defaultValue'] = properties['value'] || '';
    }


    const attributesString = Object.entries(attributes)
        .map(([key, value]) => {
            if (key === 'style' && Object.keys(value).length === 0) return '';
            if (value === '' || value === undefined || value === null) return '';
            if (key === 'style') {
                return `style={${JSON.stringify(value)}}`;
            }
            if (typeof value === 'string') {
                 // Escape quotes in string values
                const escapedValue = value.replace(/"/g, '&quot;');
                return `${key}="${escapedValue}"`;
            }
            return `${key}={${JSON.stringify(value)}}`;
        })
        .filter(Boolean)
        .join(' ');
        
    const indent = '  '.repeat(level);

    switch (type) {
        case 'heading': {
            const level = properties['level'] || 1;
            const text = properties['text'] || '';
            const Tag = `h${level}`;
            return `${indent}<${Tag} ${attributesString}>${text}</${Tag}>`;
        }
        case 'text': {
            const text = properties['text'] || '';
             // Handle anchor tags within text
            if (text.includes('<a')) {
                return `${indent}<div ${attributesString} dangerouslySetInnerHTML={{ __html: \`${text.replace(/`/g, '\\`')}\` }} />`;
            }
            return `${indent}<div ${attributesString}>${text}</div>`;
        }
        case 'button': {
            const text = properties['text'] || 'Button';
            return `${indent}<button ${attributesString}>${text}</button>`;
        }
        case 'image':
             // Remove style from attributes string for Next/Image
            const { style: _, ...restAttrs } = attributes;
            const imgAttributesString = Object.entries(restAttrs)
                .map(([key, value]) => {
                    if (value === '' || value === undefined || value === null) return '';
                     if (typeof value === 'string') {
                        const escapedValue = value.replace(/"/g, '&quot;');
                        return `${key}="${escapedValue}"`;
                    }
                    return `${key}={${JSON.stringify(value)}}`;
                })
                .filter(Boolean)
                .join(' ');
            return `${indent}<Image ${imgAttributesString} />`;
        case 'video':
            return `${indent}<video ${attributesString} />`;
        case 'input':
            return `${indent}<input ${attributesString} />`;
        case 'textarea':
             return `${indent}<textarea ${attributesString} />`;
        case 'label':
             const text = properties['text'] || '';
             return `${indent}<label ${attributesString}>${text}</label>`;
        case 'section':
        case 'div':
        case 'container':
        case 'form':
        case 'list': {
            const Tag = type === 'container' ? 'div' : (type === 'list' ? 'ul' : type);
            const childrenJsx = children ? children.map(child => renderElementToJsx(child, level + 1)).join('\n') : '';
            return `${indent}<${Tag} ${attributesString}>\n${childrenJsx}\n${indent}</${Tag}>`;
        }
        case 'list-item': {
             const text = properties['text'] || '';
            return `${indent}<li ${attributesString}>${text}</li>`;
        }
        case 'html': {
            const htmlContent = properties['htmlContent'] || '';
             return `${indent}<div ${attributesString} dangerouslySetInnerHTML={{ __html: \`${htmlContent.replace(/`/g, '\\`')}\` }} />`;
        }
        default:
            return '';
    }
}


export function convertJsonToJsx(elements: CanvasElementData[]): string {
  const bodyContent = elements.map(child => renderElementToJsx(child, 2)).join('\n');
  
  const hasImage = JSON.stringify(elements).includes('"type":"image"');

  let imports = `import React from 'react';\n`;
  if (hasImage) {
      imports += `import Image from 'next/image';\n`;
  }
  
  return `
${imports}

export default function GeneratedPage() {
  return (
    <>
${bodyContent}
    </>
  );
}
  `.trim();
}
