
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
            const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            (style as any)[camelCaseKey] = properties[key];
        }
    }
    return style;
}


function renderElementToJsx(element: CanvasElementData, level: number, isInsideLoop = false): string {
    const { type, properties, children, id } = element;
    const style = propertiesToStyleObject(properties);
    const className = properties['className'] || '';

    const attributes: Record<string, any> = {
        style,
        className,
    };
    
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
    
    // Replace handlebars with dynamic props if inside a loop
    const processValue = (value: any): string => {
        if (isInsideLoop && typeof value === 'string') {
            const match = value.match(/\{\{((item\.)?[\w\.]+)\}\}/);
            if (match) {
                 // It's a dynamic variable
                return `{${match[1]}}`;
            }
        }
        return JSON.stringify(value);
    };

    const attributesString = Object.entries(attributes)
        .map(([key, value]) => {
            if (key === 'style' && Object.keys(value).length === 0) return '';
            if (value === '' || value === undefined || value === null) return '';
            if (key === 'style') {
                return `style={${JSON.stringify(value)}}`;
            }
            if (typeof value === 'string') {
                const dynamicVal = processValue(value);
                if (dynamicVal.startsWith('{') && dynamicVal.endsWith('}')) {
                    return `${key}=${dynamicVal}`;
                }
                const escapedValue = value.replace(/"/g, '&quot;');
                return `${key}="${escapedValue}"`;
            }
            return `${key}={${JSON.stringify(value)}}`;
        })
        .filter(Boolean)
        .join(' ');
        
    const indent = '  '.repeat(level);
    
    let textContent = properties['text'] || '';
    if (isInsideLoop) {
        textContent = textContent.replace(/\{\{((item\.)?[\w\.]+)\}\}/g, '{$1}');
    }

    switch (type) {
        case 'heading': {
            const level = properties['level'] || 1;
            const Tag = `h${level}`;
            return `${indent}<${Tag} ${attributesString}>${textContent}</${Tag}>`;
        }
        case 'text': {
            if (textContent.includes('<a')) {
                return `${indent}<div ${attributesString} dangerouslySetInnerHTML={{ __html: \`${textContent.replace(/`/g, '\\`')}\` }} />`;
            }
            return `${indent}<div ${attributesString}>${textContent}</div>`;
        }
        case 'button': {
            return `${indent}<button ${attributesString}>${textContent}</button>`;
        }
        case 'image':
            const { style: _, ...restAttrs } = attributes;
            const imgAttributesString = Object.entries(restAttrs)
                .map(([key, value]) => {
                    if (value === '' || value === undefined || value === null) return '';
                     const dynamicVal = processValue(value);
                    if (dynamicVal.startsWith('{') && dynamicVal.endsWith('}')) {
                         return `${key}=${dynamicVal}`;
                    }
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
             return `${indent}<label ${attributesString}>${textContent}</label>`;
        case 'section':
        case 'div':
        case 'container':
        case 'form':
        case 'list': {
            const Tag = type === 'container' ? 'div' : (type === 'list' ? 'ul' : type);
            const childrenJsx = children ? children.map(child => renderElementToJsx(child, level + 1, isInsideLoop)).join('\n') : '';
            return `${indent}<${Tag} ${attributesString}>\n${childrenJsx}\n${indent}</${Tag}>`;
        }
        case 'list-item': {
            return `${indent}<li ${attributesString}>${textContent}</li>`;
        }
        case 'html': {
            const htmlContent = properties['htmlContent'] || '';
            let finalHtml = htmlContent;
             if (isInsideLoop) {
                finalHtml = finalHtml.replace(/\{\{((item\.)?[\w\.]+)\}\}/g, '{$1}');
            }
            return `${indent}<div ${attributesString} dangerouslySetInnerHTML={{ __html: \`${finalHtml.replace(/`/g, '\\`')}\` }} />`;
        }
        default:
            return '';
    }
}


export function convertJsonToJsx(elements: CanvasElementData[]): string {
  const hasImage = JSON.stringify(elements).includes('"type":"image"');
  let imports = `import React from 'react';\n`;
  if (hasImage) {
      imports += `import Image from 'next/image';\n`;
  }
  
  const componentBody = elements.map((element, index) => {
    const singleElementJsx = renderElementToJsx(element, 3, true);
    // Add key to the root element in the loop
    return singleElementJsx.replace(/<(\w+)/, `<\$1 key={item.id || index}`);
  }).join('\n');

  return `
${imports}

export default function GeneratedComponent({ items }) {
  if (!items || !Array.isArray(items)) {
    return <div>No items to display.</div>;
  }
  
  return (
    <>
      {items.map((item, index) => (
${componentBody}
      ))}
    </>
  );
}
  `.trim();
}
