import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, AfterViewInit, QueryList, ViewChildren, ViewChild, ElementRef, Renderer2 } from '@angular/core';

import { GameScoreItem } from '../../common/kokopu-engine';
import { LayoutService } from '../../services/layout.service';
import { OlgaService } from '../../services/olga.service';
import { ThemeService } from '../../services/themes.service';
import { ScoreColumnComponent } from './score-column/score-column.component';

@Component({
  selector: 'score-table',
  templateUrl: './score-table.component.html',
  styleUrls: ['./score-table.component.scss']
})
export class ScoreTableComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChildren(ScoreColumnComponent) scoreTables!: QueryList<ScoreColumnComponent>;
  @ViewChild('comment', { static: false }) comment!: ElementRef;
  @ViewChild('scoreArea', { static: false }) scoreArea!: ElementRef;
  @Input() items: GameScoreItem[] = [];
  @Input() columns: number[] = [];
  @Input() rowCount = 0;
  @Input() currentItem: GameScoreItem | null = null;
  @Output() moveComment: string = '';
  container!: HTMLElement;
  width = 0;
  height = 0;

  constructor(public olga: OlgaService, public theme: ThemeService, public layout: LayoutService, private renderer: Renderer2) { }

  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    window.setTimeout(() => {
      let container = document.getElementById('score-table-' + this.olga.UUID);
      if (container) {
        this.container = container;
      }
      this.layout.gameScoreElement = document.getElementById('olga-score-' + this.olga.UUID);
      if (this.layout.gameScoreElement) {
        const width = this.layout.gameScoreElement.clientWidth;
        if (!isNaN(width)) {
          this.width = width;
          this.height = this.layout.gameScoreElement.clientHeight;
        }
      }
      this.resize();
    }, 10);
  }

  updateViewSize(): void {
    window.setTimeout(() => {
      if (this.resize) {
        this.resize();
      }
    }, 10);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.resize) {
      this.resize();
    }
  }

  selectGameScoreItem(index: number): void {
    if (this.currentItem) {
      this.currentItem.setSelected(false);
    }
    //this.variations = [];
    if (index < this.items.length && index >= 0) {
      this.currentItem = this.items[index];
      const targetColumn = index % this.rowCount;
      this.currentItem.setSelected(true);
      if (this.currentItem.move) {
        const comment = this.currentItem.move.comment();
        if (comment) {
          this.moveComment = comment;
        } else {
          this.moveComment = '';
        }
        // const variants = this.currentItem.move.variations();
        // for(let i = 0; i < variants.length; ++i) {
        //   const variation = variants[i];
        //   this.variations.push([variation.initialFullMoveNumber(), variation.first().notation()])
        // }
      }
    } else {
      this.currentItem = null;
    }
    //this.updateViewSize();
  }

  resize(width: number = this.width, height: number = this.height): void {
    if (this.items.length == 0 || width == 0) {
      return;
    }
    if (!this.container || !this.scoreArea) {
      window.setTimeout(() => { this.resize(width, height); }, 100);
      return;
    }
    let scoreSize = height - 32;
    if (this.currentItem && this.currentItem.move) {
      let comment = this.currentItem.move.comment();
      if (comment && comment.length >= 0) {
        if (!this.comment) {
          window.setTimeout(() => { this.resize(width, height) }, 10);
          return;
        }
        scoreSize = height;
      }
    }

    let moves = Math.ceil(this.items.length / 2);
    let existing_items = document.getElementsByClassName('gsi-container');
    let item_height = 25;
    if (existing_items && existing_items.length) {
      const first = existing_items[0];
      item_height = first.clientHeight;
    }
    if (height <= 0) {
      height = ((Math.ceil(moves / 3) + (this.olga.showTableHeader.value ? 2 : 1)) * item_height);
      if (this.container) {
        this.renderer.setStyle(this.container, 'height', height + 'px');
      }
    }
    switch (this.layout.state) {
      //@ts-ignore
      case 1: { }
      //@ts-ignore
      case 2: { }
      case 3: {
        this.width = width;
        this.height = height;
        let max_row_count = Math.floor(height / item_height) + (this.olga.showTableHeader.value ? 0 : 1);
        let max_columns = Math.floor(width / 176);
        if (max_row_count * max_columns >= moves) {
          // it will fit
          for (let i = Math.ceil(moves / max_row_count); i < max_columns; ++i) {
            if (moves % i === 0) {
              max_columns = i;
              break;
            }
          }
          this.rowCount = Math.ceil(moves / max_columns); // even the columns out
          //max_columns = Math.floor(moves/this.rowCount);
        } else { // determine whats the best column count based on width

          for (let i = max_columns; i >= 2; --i) {
            if (moves % i === 0) {
              max_columns = i;
              break;
            }
          }
          //max_columns = Math.floor( (3 + max_columns)/2);
          this.rowCount = Math.ceil(moves / max_columns);
        }
        if (this.container) {
          this.renderer.setStyle(this.container, 'height', 'unset');
          this.renderer.setStyle(this.container, 'overflow-y', 'scroll');
        }

        if (this.scoreArea) {
          this.renderer.setStyle(this.scoreArea.nativeElement, 'height', scoreSize + 'px');
          this.renderer.setStyle(this.scoreArea.nativeElement, 'overflow-y', 'unset');
          this.renderer.setStyle(this.scoreArea.nativeElement, 'overflow-x', 'hidden');
        }
        this.columns = Array.from({ length: max_columns }, (_, i) => i + 1);
        this.theme.gsTableItemWidth.next(Math.round((width - (32 * this.columns.length)) / (this.columns.length * 2)) + 'px');
        window.setTimeout(() => {
          if (this.scoreTables) {
            const tables = this.scoreTables.toArray();
            for (let i = 0; i < tables.length; ++i) {
              tables[i].setData(this.items, i * this.rowCount, this.rowCount);
            }
          }
        }, 1);
        break;
      }
      case 4: {
        if (this.container) {
          //this.renderer.setStyle(this.container, 'width', '100%');
          // if(this.container.clientHeight == 0) {
          // this.renderer.setStyle(this.container, 'height', '800px');
          //   window.setTimeout(()=>{this.resize(width, height)}, 2);
          // }
          this.renderer.setStyle(this.container, 'height', 'unset');
          //this.renderer.setStyle(this.container, 'overflow-y', 'visible');
        }

        if (this.scoreArea) {
          this.renderer.setStyle(this.scoreArea.nativeElement, 'height', (scoreSize - 10) + 'px');
          this.renderer.setStyle(this.scoreArea.nativeElement, 'overflow-y', 'unset');
          this.renderer.setStyle(this.scoreArea.nativeElement, 'overflow-x', 'hidden');
        }
        let max_row_count = Math.floor(scoreSize / item_height) + (this.olga.showTableHeader.value ? 0 : 1);
        let max_columns = Math.floor(width / 180);
        if (max_row_count * max_columns >= moves) {
          // it will fit
          for (let i = Math.ceil(moves / max_row_count); i < max_columns; ++i) {
            if (moves % i === 0) {
              max_columns = i;
              break;
            }
          }
          this.rowCount = Math.ceil(moves / max_columns); // even the columns out
          //max_columns = Math.floor(moves/this.rowCount);
        } else { // determine whats the best column count based on width
          max_columns = Math.floor(width / 180);
          this.rowCount = Math.ceil(moves / max_columns);
        }
        this.columns = Array.from({ length: max_columns }, (_, i) => i + 1);
        this.theme.gsTableItemWidth.next(Math.round((width - (32 * this.columns.length)) / (this.columns.length * 2)) + 'px');
        window.setTimeout(() => {
          if (this.scoreTables) {
            const tables = this.scoreTables.toArray();
            for (let i = 0; i < tables.length; ++i) {
              tables[i].setData(this.items, i * this.rowCount, this.rowCount);
            }
          }
        }, 1);
      }
    }
  }

}
