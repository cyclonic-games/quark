import { render } from './core/render';
import { Context } from './Context';
import { Element } from './Element';
/**
 * Symbol which represents a component's element tree
 */
declare const template: unique symbol;
/**
 * Sumbol which represents whether or not there are changes during updates
 */
declare const staged: unique symbol;
/**
 * Proxy used in order to register a custom element before it is instantiated for the first time
 */
declare const CustomHTMLElement: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
/**
 * Base component class from which all custom components must extend
 */
export declare class Component extends CustomHTMLElement {
    /**
     * Field in which component's template is stored
     */
    private [template];
    /**
     * Field in which component render status is stored
     */
    private [staged];
    /**
     * Part of custom elements API: called when element mounts to a DOM
     */
    protected connectedCallback(): void;
    /**
     * Part of custom elements API: called when element is removed from its DOM
     */
    protected disconnectedCallback(): void;
    /**
     * Custom lifecycle hook: called when element is ready or updated
     */
    protected updatedCallback(): void;
    /**
     * Used to hook into the connection lifecycle
     * @param event Connect lifecycle event
     */
    protected handleComponentConnect(event: Component.LifecycleEvent): void;
    /**
     * Used to hook into the create lifecycle
     * @param event Create lifecycle event
     */
    protected handleComponentCreate(event: Component.LifecycleEvent): void;
    /**
     * Used to hook into the disconnect lifecycle
     * @param event Disconnect lifecycle event
     */
    protected handleComponentDisconnect(event: Component.LifecycleEvent): void;
    /**
     * Used to hook into the ready lifecycle
     * @param event Ready lifecycle event
     */
    protected handleComponentReady(event: Component.LifecycleEvent): void;
    /**
     * Used to hook into the render lifecycle
     * @param event Render lifecycle event
     */
    protected handleComponentRender(event: Component.LifecycleEvent): void;
    /**
     * Used to hook into the update lifecycle
     * @param event Update lifecycle event
     */
    protected handleComponentUpdate(event: Component.LifecycleEvent): void;
    /**
     * Retrieves a dependency from context.
     * @param key Object which acts as the key of the stored value.
     */
    protected getContext<Dependency extends Context>(dependency: new () => Dependency): Dependency['value'];
    /**
     * Constructs a component's template
     */
    protected render(): Element.Child[];
    /**
     * Constructs a component's stylesheet
     */
    protected theme(): string;
    /**
     * Attaches lifecycle listeners upon instantiation, initializes shadow root
     */
    constructor();
    /**
     * Triggers an update
     * @param props Optional properties to update with
     * @param immediate Whether or not to attempt an update this frame
     */
    update(props?: object, immediate?: boolean): Promise<void>;
}
export declare namespace Component {
    /**
     * JSX component factory
     */
    const Factory: typeof render;
    /**
     * Defines any component
     */
    type Any<Props> = Constructor<Node & Props> | Fn<Props>;
    /**
     * Defines a class-based component
     */
    interface Constructor<Type extends Node = Node> {
        new (): Type & Node;
    }
    /**
     * Defines a function-based component
     */
    interface Fn<Props = unknown> {
        (props: Partial<Props> | undefined, children: Element.Child[]): Element[];
    }
    /**
     * Decides if a node is a Component
     * @param node
     */
    function isComponent(node: Node | undefined): node is Component;
    /**
     * Decides if a component is a classical component
     * @param constructor
     */
    function isConstructor<Props>(constructor: Any<Props>): constructor is Constructor<Node & Props>;
    /**
     * Decides if a component is a functional component
     * @param constructor
     */
    function isFn<Props>(constructor: Any<Props>): constructor is Fn<Props>;
    /**
     * Event interface used for component lifecycle triggers
     */
    class LifecycleEvent extends Event {
    }
}
export {};
