import { Component, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { interval, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'STOPWATCH';
  elapsedTime: number = 0;
  isRunning: boolean = false;
  minutes: string = '00';
  seconds: string = '00';
  miliseconds: string = '00';
  isVisible: boolean = true;

  private startTime: number = 0;
  private stop$ = new Subject<void>();
  private subscription: Subscription | null = null;
  private hideTimeout: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  startStop() {
    if (!this.isRunning) {
      this.startTime = Date.now() - this.elapsedTime;
      this.isRunning = true;
      this.isVisible = true;
      this.resetHideTimeout();
      this.subscription = interval(10)
        .pipe(
          takeUntil(this.stop$),
          map(() => this.formatTime(Date.now() - this.startTime))
        )
        .subscribe(({ minutes, seconds, miliseconds }) => {
          this.minutes = minutes;
          this.seconds = seconds;
          this.miliseconds = miliseconds;
        });
    } else {
      this.stop$.next();
      this.isRunning = false;
      this.isVisible = true;
      clearTimeout(this.hideTimeout);
      this.cdr.detectChanges();
    }
  }

  reset() {
    if (this.isRunning) {
      this.stop$.next();
      this.subscription?.unsubscribe();
    }
    this.isRunning = false;
    this.elapsedTime = 0;
    this.minutes = '00';
    this.seconds = '00';
    this.miliseconds = '00';
    this.isVisible = true;
    clearTimeout(this.hideTimeout);
    this.cdr.detectChanges();
  }

  private formatTime(elapsed: number): { minutes: string; seconds: string; miliseconds: string } {
    this.elapsedTime = elapsed;
    const minutes = Math.floor(elapsed / (1000 * 60) % 60).toString().padStart(2, '0');
    const seconds = Math.floor(elapsed / 1000 % 60).toString().padStart(2, '0');
    const miliseconds = Math.floor(elapsed % 1000 / 10).toString().padStart(2, '0');
    return { minutes, seconds, miliseconds };
  }

  @HostListener('document:mousemove')
  onMouseMove() {
    if (this.isRunning) {
      this.isVisible = true;
      this.cdr.detectChanges();
      this.resetHideTimeout();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === ' ' || event.code === 'Space') { // Check for spacebar
      event.preventDefault(); // Prevent scrolling or other default behavior
      this.startStop(); // Trigger start/stop
    }
  }

  private resetHideTimeout() {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      if (this.isRunning) {
        this.isVisible = false;
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  ngOnDestroy() {
    this.stop$.next();
    this.stop$.complete();
    this.subscription?.unsubscribe();
    clearTimeout(this.hideTimeout);
  }
}