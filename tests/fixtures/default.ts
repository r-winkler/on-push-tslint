import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
    selector: 'tooltip',
    template: `
        <h1>{{config.position}}</h1>
    `,
    changeDetection: ChangeDetectionStrategy.Default
})
export class TooltipComponent {

    @Input() config;

}
