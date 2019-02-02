import { Component, ChangeDetectionStrategy, Input } from "@angular/core";

@Component({
  selector: 'tooltip',
  template: `
    <h1>{{config.position}}</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent  {

  @Input() config;

}
