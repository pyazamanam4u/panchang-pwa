import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PanchangApiService } from '../../services/panchang-api.service';
import { App } from '../../app';

@Component({
  standalone: true,
  selector: 'app-panchang-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './panchang-form.component.html',
  styleUrls: ['./panchang-form.component.scss'],
})
export class PanchangFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PanchangApiService);
  private readonly app = inject(App);

  private currentAudioUrl: string | null = null;

  readonly today = new Date().toISOString().slice(0, 10);
  readonly loading = signal(false);
  readonly audioUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    gotra: ['', [Validators.required, Validators.minLength(2)]],
    date: [this.today, [Validators.required]],
  });

  get nameControl() {
    return this.form.controls.name;
  }

  get gotraControl() {
    return this.form.controls.gotra;
  }

  get dateControl() {
    return this.form.controls.date;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);
    this.submitted.set(true);
    this.dateControl.disable({ emitEvent: false });
    this.audioUrl.set(null);

    // Set global loading state
    this.app.setGlobalLoading(true);

    const request = this.form.getRawValue();

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }

    this.api.generateAudio(request).subscribe({
      next: (result) => {
        const url = URL.createObjectURL(result);
        this.currentAudioUrl = url;
        this.audioUrl.set(url);
        this.loading.set(false);
        this.app.setGlobalLoading(false);
      },
      error: () => {
        this.error.set('Unable to generate audio. Please try again later.');
        this.loading.set(false);
        this.app.setGlobalLoading(false);
      },
    });
  }
}
