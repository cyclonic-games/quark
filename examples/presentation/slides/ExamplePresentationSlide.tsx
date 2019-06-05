import * as Cortex from 'cortex';

import Logo from '../components/Logo';
import Presentation from '../components/Presentation';

export default class ExamplePresentationSlide extends Cortex.Component {

    public render(): Cortex.Node[] {
        return [
            <Logo/>,
            <Presentation.Layout direction='vertical' grow={ 1 }>
                <Presentation.Heading level={ 2 }>
                    Example: Presentation
                </Presentation.Heading>
                <Presentation.Text>
                    This presentation was also built using web components!
                </Presentation.Text>
            </Presentation.Layout>
        ];
    }

    public theme(): string {
        return `
            :host {
                display: contents;
            }

            code {
                background: rgba(0, 0, 0, 1);
                color: rgba(255, 255, 255, 0.85);
                padding: 4px 8px;
            }

            .${ HTMLIFrameElement.name } {
                border-radius: 4px;
                flex-grow: 1;
            }
        `;
    }
}