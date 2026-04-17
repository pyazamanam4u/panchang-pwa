import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Lang, LanguageService } from '../../services/language.service';
import { VoiceService } from '../../services/voice.service';
import { CommonModule } from '@angular/common';

type Step = 'idle' | 'speaking' | 'listening' | 'confirming';

@Component({
  selector: 'app-conversation',
  imports: [CommonModule],
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit, OnDestroy {

  step: Step = 'idle';

  index = 0;
  currentAnswer = '';
  answers: Record<string, string> = {};
get currentQuestion() {
  return this.getQuestion(this.questions[this.index].key);
}
  activeLanguage: Lang = 'en-IN';

  private langSub!: Subscription;
  private running = false;

  private questions = [
    { key: 'name' },
    { key: 'gotra' },
    { key: 'purpose' }
  ];

  constructor(
    private voice: VoiceService,
    private langService: LanguageService
  ) {}

  // =========================
  // INIT (REACTIVE LANGUAGE)
  // =========================
  ngOnInit() {

    this.langService.init();

    this.langSub = this.langService.lang$.subscribe((lang: any) => {

      console.log('🔄 LANGUAGE UPDATE:', lang);

      this.activeLanguage = lang;

      this.resetFlow(); // IMPORTANT FIX
    });

    if (!this.running) {
      this.running = true;
      this.run();
    }
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    this.voice.stop();
  }

  // =========================
  // RESET FLOW (FIX OVERLAP)
  // =========================
  resetFlow() {

    this.index = 0;
    this.currentAnswer = '';
    this.answers = {};
    this.step = 'idle';

    this.voice.stop();
  }

  // =========================
  // MAIN FLOW
  // =========================
  async run() {
    await this.ask();
  }

  async ask() {

    this.step = 'speaking';

    const q = this.getQuestion(this.questions[this.index].key);

    await this.voice.speak(q);

    await this.delay(900);

    await this.listen();
  }

  // =========================
  // LISTEN
  // =========================
  async listen() {

    this.step = 'listening';

    let result = '';

    for (let i = 0; i < 3; i++) {

      result = await this.voice.listen();

      console.log('🎙️ INPUT:', result);

      if (result) break;

      await this.voice.speak(this.getRetryText());
    }

    if (!result) return this.next();

    this.currentAnswer = result;

    await this.confirm();
  }

  // =========================
  // CONFIRM
  // =========================
  async confirm() : Promise<void> {
 this.step = 'confirming';

  const confirmText = this.getConfirmText(this.currentAnswer);

  await this.voice.speak(confirmText);

  await this.delay(500);

  let response = '';

  for (let i = 0; i < 2; i++) {

    response = await this.voice.listen();

    console.log('🧠 CONFIRM INPUT:', response);

    const cleaned = this.clean(response);

    if (cleaned) {
      response = cleaned;
      break;
    }

    await this.voice.speak(this.getRetryText());
  }

  // 🚨 STILL EMPTY → retry confirm (NOT question)
  if (!response) {
    console.warn('⚠️ Empty confirm → retry confirm');
    return this.confirm();
  }

  // ✅ CHECK YES
  if (this.isYes(response)) {

    console.log('✅ CONFIRMED');

    this.answers[this.questions[this.index].key] = this.currentAnswer;

    return this.next();

  } else {

    console.log('❌ NOT CONFIRMED');

    await this.voice.speak(this.getRetryText());

    return this.ask();
  }
  }
clean(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[?.।]/g, '') // remove punctuation
    .trim();
}
  // =========================
  // NEXT
  // =========================
  async next() {

    this.index++;

    if (this.index < this.questions.length) {
      await this.ask();
    } else {
      this.finish();
    }
  }

  finish() {

    this.step = 'idle';

    console.log('🏁 FINAL:', this.answers);

    alert(JSON.stringify(this.answers, null, 2));
  }

  // =========================
  // HELPERS
  // =========================
  isYes(text: string) {
    const t = (text || '').toLowerCase();
    return t.includes('yes') || t.includes('ok') || t.includes('అవును');
  }

  getRetryText(): string {

  const map: any = {
    'en-IN': 'Please say yes or no',
    'hi-IN': 'कृपया हाँ या नहीं बोलें',
    'te-IN': 'దయచేసి అవును లేదా కాదు చెప్పండి'
  };

  return map[this.activeLanguage];
}

  getConfirmText(value: string): string {

  const map: any = {
    'en-IN': `You said ${value}. Is that correct?`,
    'hi-IN': `आपने ${value} कहा। क्या यह सही है?`,
    'te-IN': `మీరు ${value} చెప్పారు. ఇది సరైందా?`
  };

  return map[this.activeLanguage];
}

  getQuestion(key: string) {

    const map: any = {
      'en-IN': {
        name: 'What is your name?',
        gotra: 'What is your gotra?',
        purpose: 'What is your purpose?'
      },
      'hi-IN': {
        name: 'आपका नाम क्या है?',
        gotra: 'आपका गोत्र क्या है?',
        purpose: 'आपका संकल्प क्या है?'
      },
      'te-IN': {
        name: 'మీ పేరు ఏమిటి?',
        gotra: 'మీ గోత్రం ఏమిటి?',
        purpose: 'మీ సంకల్పం ఏమిటి?'
      }
    };

    return map[this.activeLanguage][key];
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}