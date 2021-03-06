import { Component } from '../Component';
import { Element } from '../Element';
import { Fragment } from '../Fragment';

import { createDocumentNode } from './createDocumentNode';

const XML_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

type Host = Component | HTMLElement | SVGElement | ShadowRoot

export function connectElementToHost<Constructor extends Node>(element: Element<Constructor>, host: Constructor | Host): void {

    if (!element.constructor) {
        return
    }

    /** 
     * If node hasn't been initialized (unlikely), try again
     */
    if (!element.node) {
        element.node = createDocumentNode(element)
    }

    /**
     * If it still doesn't exist, something is probably wrong
     */
    if (!element.node) {
        console.error('Unable to create node for element:', element)
        return
    }

    if (Element.isText(element)) {
        Object.assign(element.node, element.properties)
    }
    else if ((Element.isNative(element) || Element.isCustom(element)) && element.properties) {

        for (const property of Object.keys(element.properties)) {
            
            /** 
             * Add attribute namespaces to DOM node
             */
            if (property === 'namespaces') {

                for (const [ name, space ] of Object.entries(element.properties[ property ] ?? {})) {
                    element.node?.setAttributeNS(XML_NAMESPACE, `xmlns:${ name }`, space)
                }
            }

            /** 
             * Add attributes to DOM node
             */
            if (property === 'attributes') {

                for (const attribute of Array.from(element.node?.attributes ?? [])) {
                    
                    /**
                     * Remove extra attributes
                     */
                    if (!(attribute.name in (element.properties[ property ] ?? {})) || Reflect.get(element.properties[ property ] ?? {}, attribute.name) === false) {
                        element.node.removeAttributeNode(attribute)
                    }
                }

                for (const [ attribute, object ] of Object.entries(element.properties[ property ] ?? {})) {

                    /**
                     * Skip 'nulled' attributes
                     */
                    if (object === false || object === undefined || object === null) {
                        continue
                    }

                    /**
                     * Apply attributes which are true as ones which are empty
                     * <HTMLDivElement hidden/>
                     */
                    if (object === true) {
                        element.node?.setAttribute(attribute, '')
                    }

                    /**
                     * If attribute is an object, iterate over fields
                     */
                    if (typeof object === 'object') for (const [ key, value ] of Object.entries(object)) {
                        
                        /**
                         * Skip 'nulled' attributes
                         */
                        if (value === false || value === undefined || value === null) {
                            continue
                        }
    
                        /**
                         * Apply namespaced attributes
                         */
                        if ('namespaces' in element.properties && attribute in (element.properties?.namespaces ?? {})) {
                            element.node.setAttributeNS((element.properties?.namespaces ?? {})[ attribute ], `${ attribute }:${ key }`, String(value))
                        }
                        else {
                            const root = (host as Host).querySelector(`xmlns:${ attribute }`)
    
                            if (root) {
                                element.node.setAttributeNS(root.getAttribute(`xmlns:${ attribute }`), `${ attribute }:${ key }`, String(value))
                            }
                            else {
                                element.node.setAttributeNS(null, key, String(value))
                            }
                        }
                    }
                    else {
                        element.node.setAttribute(attribute, String(object))
                    }

                    continue
                }
            }

            /**
             * Allow direct child element insertion by first removing all children, then appending all to target node
             */
            if (property === 'children') {

                for (const child of Array.from(element.node.children ?? [])) {
                    element.node.removeChild(child)
                }

                if (typeof element.properties.children === 'string') {
                    element.node.appendChild(new Text(element.properties.children))
                }
                else for (const child of Array.from(element.properties.children ?? [])) {
                    element.node.appendChild(child)
                }

                continue
            }

            /**
             * Allow direct child node insertion by first removing all child nodes, then appending all to target node
             */
            if (property === 'childNodes') {

                for (const childNode of Array.from(element.node.childNodes ?? [])) {
                    element.node.removeChild(childNode)
                }

                for (const childNode of Array.from(element.properties.childNodes ?? [])) {
                    element.node.appendChild(childNode)
                }

                continue
            }

            if (element.node[ property ] === element.properties[ property ]) {
                continue
            }
    
            if (element.node[ property ] && typeof element.node[ property ] === 'object' && !Array.isArray(element.properties[ property ])) {
                Object.assign(element.node[ property ], element.properties[ property ])
            }
            else {
                element.node[ property ] = element.properties[ property ]
            }
        }
    }

    if (Element.isNative(element) && !element.node.classList.contains(element.constructor.name)) {
        element.node.classList.add(element.constructor.name)
    }

    if (Fragment.isFragment(element.node)) {

        if (element.properties) for (const property of Object.keys(element.properties)) {

            if (element.node[ property ] && typeof element.node[ property ] === 'object' && !Array.isArray(element.properties[ property ])) {
                Object.assign(element.node[ property ], element.properties[ property ])
            }
            else {
                element.node[ property ] = element.properties[ property ]
            }
        }

        element.node.connect(element.children)
    }
    else for (const child of element.children) if (child) {
        connectElementToHost(child, element.node)
    }

    if (element.node instanceof Fragment && typeof (element.node as any).reflect === 'function') {
        (element.node as any).reflect() // OOF I may need to rearchitect some of this project due to circular dependencies
    }
    else if (host !== element.node.parentNode) {
        host.appendChild(element.node)
    }
    else if (Component.isComponent(element.node)) {
        element.node.update() // TODO only do if props changed?
    }
}
