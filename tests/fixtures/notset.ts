import { Component, Input } from "@angular/core";

@Component({
  selector: 'tooltip',
  template: `
    <h1>{{config.position}}</h1>
  `
})
export class TooltipComponent  {

  @Input() config;

}
