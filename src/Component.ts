import { connect } from './core/connect'
import { create } from './core/create'
import { depend } from './core/depend'
import { diff } from './core/diff'
import { render } from './core/render'

import { Context } from './Context'
import { Element } from './Element'
import { Tag } from './Tag'

/**
 * Symbol which represents a component's element tree
 */
const cache = Symbol('cache')

/**
 * Sumbol which represents whether or not there are changes during updates
 */
const dirty = Symbol('dirty')

/**
 * Proxy used to capture custom element lifecycle before any consturctors are called 
 * in order to enable automatic registration upon initialization
 * Trust me, it makes sense
 */
const CustomHTMLElement = new Proxy(HTMLElement, {

    construct(element, args, component): object {

        /**
         * Automatically register custom element prior to instantiation
         */
        if (!window.customElements.get(Tag.of(component))) {
            window.customElements.define(Tag.of(component), component)
        }

        return Reflect.construct(element, args, component)
    }
})

/**
 * Base component class from which all custom components must extend
 */
export class Component extends CustomHTMLElement {

    /**
     * Field in which component's template is stored
     */
    protected [ cache ]: Element[]

    /**
     * Field in which component render state is stored
     */
    protected [ dirty ]: boolean
    
    /**
     * Part of custom elements API: called when element mounts to a DOM
     */
    protected connectedCallback(): void {
        window.requestAnimationFrame(() => {
            this.dispatchEvent(new Component.LifecycleEvent('componentconnect'))
            this.updatedCallback();

            /**
             * In order to increase type safety, each element receives a `className` equal to its class' name
             */
            if (!this.classList.contains(this.constructor.name)) {
                this.classList.add(this.constructor.name)
            }

            window.requestAnimationFrame(() => {
                this.dispatchEvent(new Component.LifecycleEvent('componentready'))
            })
        })
    }

    /**
     * Part of custom elements API: called when element is removed from its DOM
     */
    protected disconnectedCallback(): void {
        window.requestAnimationFrame(() => {
            this.dispatchEvent(new Component.LifecycleEvent('componentdisconnect'))
        })
    }

    /**
     * Custom lifecycle hook: called when element is ready or updated
     */
    protected updatedCallback(): void {
        const style = render(HTMLStyleElement, { textContent: this.theme() })
        const tree = this.render().concat(style)

        /**
         * If first time render, just save new tree
         * Otherwise diff tree recursively
         */
        if (!this[ cache ]) {
            this[ cache ] = tree
        }
        else {
            this[ cache ] = diff(this[ cache ], tree)
        }

        /**
         * Wire up any new component elements with DOM elements
         */
        for (const element of this[ cache ]) if (element) {

            if (!element.node) {
                element.node = create(element)
            }

            connect(element, this.shadowRoot)
        }

        window.requestAnimationFrame(() => {
            this.dispatchEvent(new Component.LifecycleEvent('componentrender'))
        })
    }

    /**
     * Used to hook into the connection lifecycle
     * @param event Connect lifecycle event
     */
    protected handleComponentConnect(event: Component.LifecycleEvent): void {}

    /**
     * Used to hook into the create lifecycle
     * @param event Create lifecycle event
     */
    protected handleComponentCreate(event: Component.LifecycleEvent): void {}

    /**
     * Used to hook into the disconnect lifecycle
     * @param event Disconnect lifecycle event
     */
    protected handleComponentDisconnect(event: Component.LifecycleEvent): void {}

    /**
     * Used to hook into the ready lifecycle
     * @param event Ready lifecycle event
     */
    protected handleComponentReady(event: Component.LifecycleEvent): void {}

    /**
     * Used to hook into the render lifecycle
     * @param event Render lifecycle event
     */
    protected handleComponentRender(event: Component.LifecycleEvent): void {}

    /**
     * Used to hook into the update lifecycle
     * @param event Update lifecycle event
     */
    protected handleComponentUpdate(event: Component.LifecycleEvent): void {}

    /**
     * Retrieves a dependency from context.
     * @param key Object which acts as the key of the stored value.
     */
    protected getContext<Dependency extends Context>(dependency: new() => Dependency): Dependency[ 'value' ] {
        const found = depend(this, dependency)

        /**
         * Since it will be unknown whether you are within the specified context, throw if not found
         */
        if (!found) {
            throw new Context.RuntimeError(`Missing context: ${ dependency.name }`)
        }

        return found.value
    }

    /**
     * Constructs a component's template
     */
    protected render(): Element[] {
        return []
    }

    /**
     * Constructs a component's stylesheet
     */
    protected theme(): string {
        return ''
    }

    /**
     * Triggers an update
     * @param props Optional properties to update with
     * @param immediate Whether or not to attempt an update this frame
     */
    protected update(props: object = {}, immediate = false): Promise<void> {
        this[ dirty ] = true;

        for (const prop of Object.keys(props)) {

            if (this[ prop ] === props[ prop ]) {
                continue;
            }

            if (this[ prop ] && typeof this[ prop ] === 'object') {
                Object.assign(this[ prop ], props[ prop ]);
            }
            else {
                this[ prop ] = props[ prop ];
            }
        }

        if (immediate) {
            this[ dirty ] = false;
            
            this.dispatchEvent(new Component.LifecycleEvent('componentupdate'));
            
            try {
                this.updatedCallback();
                return Promise.resolve();
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
        
        return new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {

                if (!this[ dirty ]) {
                    return;
                }

                this[ dirty ] = false;
                this.dispatchEvent(new Component.LifecycleEvent('componentupdate'));

                try {
                    this.updatedCallback();
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Attaches lifecycle listeners upon instantiation, initializes shadow root
     */
    public constructor() { super();
        this.attachShadow({ mode: 'open' });
        this.addEventListener('componentconnect', event => {this.handleComponentConnect(event)});
        this.addEventListener('componentcreate', event => this.handleComponentCreate(event));
        this.addEventListener('componentdisconnect', event => this.handleComponentDisconnect(event));
        this.addEventListener('componentready', event => this.handleComponentReady(event));
        this.addEventListener('componentrender', event => this.handleComponentRender(event));
        this.addEventListener('componentupdate', event => this.handleComponentUpdate(event));
        this.dispatchEvent(new Component.LifecycleEvent('componentcreate'));
    }
}

export namespace Component {

    /**
     * Event interface used for component lifecycle triggers
     */
    export class LifecycleEvent extends Event {
        
    }
}
