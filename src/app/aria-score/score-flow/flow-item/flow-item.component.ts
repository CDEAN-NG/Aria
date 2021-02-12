import { Component, OnInit, Input, AfterViewInit, SimpleChanges, OnChanges, Output, ViewChild, ElementRef, ComponentFactoryResolver } from '@angular/core';
import { GameScoreType, GameScoreItem } from '../../../common/kokopu-engine';
import { AriaService } from '../../../services/aria.service';
import { ThemeService } from '../../../services/themes.service';

@Component({
  selector: 'flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: ['./flow-item.component.scss']
})
// @ts-ignore
export class FlowItem implements OnInit, AfterViewInit, OnChanges {
  @Input() data: GameScoreItem = new GameScoreItem();
  @Output() typeName = '';
  // visual nodes
  @Output() ply = '';
  @Output() score = '';
  GameScoreType = GameScoreType;
  @ViewChild('gsiPly') gsiPly!: ElementRef;

  constructor(public aria: AriaService, public themes: ThemeService) {
    // use data to actually set type

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      let newData = changes.data.currentValue as GameScoreItem;
      this.data = newData;
      if (this.data && this.gsiPly) {
        let showing = false;
        if (this.isFullPly()) {
          showing = this.aria.showingPly.value;
        } else {
          showing = this.aria.showingHalfPly.value;
        }
        if (!showing) {
          this.gsiPly.nativeElement.remove();
        } else {
          this.ply = (this.data.move.fullMoveNumber() + (this.isFullPly() ? 0:.5)) + '.';
        }
      }
      if (this.data.move) {
        if (this.data.move._info.moveDescriptor && typeof this.data.move._info.moveDescriptor != 'string') {
          this.score = this.data.move.notation();
        } else {
          this.score = this.data.move._info.moveDescriptor;
        }
        this.data.getType();
        this.updateTypeName();
      }
    }
  }

  ngAfterViewInit(): void {
    this.updateTypeName();
    if (this.gsiPly && this.data.move) {
      let showing = false;
      if (this.isFullPly()) {
        showing = this.aria.showingPly.value;
      } else {
        showing = this.aria.showingHalfPly.value;
      }
      if (!showing) {
        this.gsiPly.nativeElement.remove();
      } else {
        window.setTimeout(() => { 
          this.ply = (this.data.move.fullMoveNumber() + (this.isFullPly() ? 0:.5)) + '.';},
          10);
      }
    }
  }

  showPly(): boolean {
    if (this.data) {
      if (this.isFullPly()) {
        return this.aria.showingPly.value;
      }
      return this.aria.showingHalfPly.value;
    }
    return false;
  }
  isFullPly(): boolean {
    if (this.data) {
      return (this.data.type & GameScoreType.HalfPly) == 0;
    }
    return false;
  }
  setSelected(select: boolean): void {
    if (this.data) {
      if (select) {
        this.data.type = (this.data.type | GameScoreType.Selected);
        this.updateTypeName();
        return;
      }
      if (this.data.type >= GameScoreType.Selected) {
        this.data.type = this.data.type ^ GameScoreType.Selected;
      }
      this.updateTypeName();
    }
  }


  isSelected(): boolean {
    if (this.data) {
      return (this.data.type & GameScoreType.Selected) == GameScoreType.Selected;
    }
    return false;
  }

  getPly(): number {
    if (this.data && this.data.move) {
      return this.data.move.fullMoveNumber();
    }
    return -1;
  }

  isGroup(): boolean {
    if (this.data) {
      return (this.data.type & GameScoreType.Group) == GameScoreType.Group;
    }
    return false;
  }

  isAnnotation(): boolean {
    if (this.data) {
      return (this.data.type & GameScoreType.Annotation) == GameScoreType.Annotation;
    }
    return false;
  }

  clickMove(): void {
    if (this.data.move) {
      var target = (this.data.move.fullMoveNumber() - 1) * 2;
      if ((this.data.type & GameScoreType.HalfPly) == GameScoreType.HalfPly) {
        ++target;
      }
      this.aria.navigateToNode(target);
      const variations = this.data.move.variations();
      if (variations.length > 0) {
        this.aria.displayVariations(this.data);
        // show variation 
        console.log('Taking first variation');
        console.log(variations[0]);
      }
    }
  }

  protected updateTypeName(): void {
    this.typeName = '';
    if (this.data) {
      const value = this.data.type & GameScoreType.Selected;
      if ((this.data.type & GameScoreType.Selected) == GameScoreType.Selected) {
        this.typeName += ' Current';
      }
      if ((this.data.type & GameScoreType.Annotation) == GameScoreType.Annotation) {
        this.typeName += ' Annotation ';
      }
      if ((this.data.type & GameScoreType.Group) == GameScoreType.Group) {
        this.typeName += ' Group ';
      }
      if ((this.data.type & GameScoreType.HalfPly) == GameScoreType.HalfPly) {
        this.typeName += ' HalfPly ';
      }
      if (this.data.move) {
        const variations = this.data.move.variations();
        if (variations && variations.length > 0) {
          this.typeName += ' Variation ';
        }

        if ((this.data.type & GameScoreType.Branched) == GameScoreType.Branched) { // must have a variation to be branched
          this.typeName += ' Branched';
        }
      }
    }
  }
}
